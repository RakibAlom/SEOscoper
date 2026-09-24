// SEOscoper - Background Script (Mozilla Firefox & Manifest V3)
// Handles link status checks with concurrency control, timeouts, and downloads

const ext = typeof browser !== 'undefined' ? browser : (typeof chrome !== 'undefined' ? chrome : null);
let activeLinkCheckAbortController = null;

if (ext?.runtime?.onInstalled) {
  ext.runtime.onInstalled.addListener((details) => {
    console.log('[SEOscoper Firefox] Background script initialized:', details.reason);
  });
}

// Unified message listener
if (ext?.runtime?.onMessage) {
  ext.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'CHECK_LINKS') {
      handleCheckLinks(message.links, sendResponse);
      return true; // Keep message channel open for asynchronous response
    }

    if (message.action === 'CANCEL_CHECK_LINKS') {
      if (activeLinkCheckAbortController) {
        activeLinkCheckAbortController.abort();
        activeLinkCheckAbortController = null;
      }
      sendResponse({ status: 'cancelled' });
      return false;
    }

    if (message.action === 'DOWNLOAD_IMAGE') {
      handleDownloadImage(message.url, message.filename || 'image.jpg', sendResponse);
      return true;
    }

    if (message.action === 'DOWNLOAD_ZIP') {
      handleDownloadZip(message.files, message.zipName || 'seoscoper-images.zip', sendResponse);
      return true;
    }

    return false;
  });
}

/**
 * Handle single image download safely in Firefox
 */
function handleDownloadImage(url, filename, sendResponse) {
  if (!ext?.downloads?.download) {
    sendResponse({ success: false, error: 'Downloads API not supported' });
    return;
  }

  const downloadOpts = {
    url,
    filename,
    saveAs: false
  };

  try {
    const downloadPromise = ext.downloads.download(downloadOpts, (downloadId) => {
      if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else if (downloadId !== undefined) {
        sendResponse({ success: true, downloadId });
      }
    });

    if (downloadPromise && typeof downloadPromise.then === 'function') {
      downloadPromise
        .then((downloadId) => sendResponse({ success: true, downloadId }))
        .catch((err) => sendResponse({ success: false, error: err?.message || String(err) }));
    }
  } catch (err) {
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Check multiple links with concurrency limit (5) and timeout (8s)
 */
async function handleCheckLinks(links, sendResponse) {
  if (!Array.isArray(links) || links.length === 0) {
    sendResponse({ results: [] });
    return;
  }

  if (activeLinkCheckAbortController) {
    activeLinkCheckAbortController.abort();
  }
  activeLinkCheckAbortController = new AbortController();
  const globalSignal = activeLinkCheckAbortController.signal;

  const CONCURRENCY = 5;
  const results = new Map();
  let completed = 0;

  // Queue of distinct HTTP/HTTPS URLs
  const validLinks = links.filter(link => {
    return link.url && (link.url.startsWith('http://') || link.url.startsWith('https://'));
  });

  const queue = [...validLinks];

  async function checkSingleUrl(linkItem) {
    if (globalSignal.aborted) return;
    const targetUrl = linkItem.url;

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 8000);

    const onGlobalAbort = () => timeoutController.abort();
    globalSignal.addEventListener('abort', onGlobalAbort, { once: true });

    let status = 0;
    let statusText = '';
    let redirected = false;
    let finalUrl = targetUrl;
    let ok = false;

    try {
      // 1. Try HEAD request first
      let response;
      try {
        response = await fetch(targetUrl, {
          method: 'HEAD',
          signal: timeoutController.signal,
          redirect: 'follow'
        });
      } catch (headErr) {
        // Fallback to GET with signal abort
        if (!globalSignal.aborted && timeoutController.signal.aborted === false) {
          response = await fetch(targetUrl, {
            method: 'GET',
            signal: timeoutController.signal,
            redirect: 'follow'
          });
        } else {
          throw headErr;
        }
      }

      clearTimeout(timeoutId);
      globalSignal.removeEventListener('abort', onGlobalAbort);

      if (response) {
        status = response.status || (response.type === 'opaque' ? 200 : 0);
        statusText = response.statusText || (status === 200 ? 'OK' : '');
        redirected = response.redirected || false;
        finalUrl = response.url || targetUrl;
        ok = response.ok || (status >= 200 && status < 400) || response.type === 'opaque';
      }
    } catch (err) {
      clearTimeout(timeoutId);
      globalSignal.removeEventListener('abort', onGlobalAbort);

      if (err.name === 'AbortError') {
        statusText = globalSignal.aborted ? 'Cancelled' : 'Timeout';
      } else {
        statusText = 'Network Error';
      }
      status = 0;
      ok = false;
    }

    const checkResult = {
      url: targetUrl,
      status,
      statusText,
      redirected,
      finalUrl,
      ok
    };

    results.set(targetUrl, checkResult);
    completed++;

    // Notify popup of progress (safely ignoring if popup was closed)
    if (ext?.runtime?.sendMessage) {
      try {
        const sendP = ext.runtime.sendMessage({
          action: 'LINK_CHECK_PROGRESS',
          progress: {
            completed,
            total: validLinks.length,
            currentResult: checkResult
          }
        });
        if (sendP && typeof sendP.catch === 'function') {
          sendP.catch(() => {});
        }
      } catch (e) {
        // Ignore inactive popup channel
      }
    }
  }

  // Worker pool for concurrency limit
  async function worker() {
    while (queue.length > 0) {
      if (globalSignal.aborted) break;
      const link = queue.shift();
      if (link) {
        await checkSingleUrl(link);
      }
    }
  }

  const workers = [];
  for (let i = 0; i < Math.min(CONCURRENCY, queue.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  activeLinkCheckAbortController = null;
  sendResponse({
    status: globalSignal.aborted ? 'cancelled' : 'completed',
    results: Array.from(results.values())
  });
}

/**
 * Handle packaging images into a single ZIP archive and triggering download
 */
async function handleDownloadZip(files, zipName, sendResponse) {
  try {
    if (!files || !files.length) {
      sendResponse({ success: false, error: 'No files to download' });
      return;
    }

    const fetchedFiles = [];
    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      try {
        const res = await fetch(item.url);
        if (res.ok) {
          const blob = await res.blob();
          const buffer = await blob.arrayBuffer();
          fetchedFiles.push({
            name: item.name || `image_${i + 1}.jpg`,
            data: new Uint8Array(buffer)
          });
        }
      } catch (err) {
        console.warn(`[SEOscoper Firefox] Could not download image ${item.url}:`, err);
      }
    }

    if (fetchedFiles.length === 0) {
      sendResponse({ success: false, error: 'Could not fetch any images' });
      return;
    }

    const zipBuffer = createZipArchive(fetchedFiles);
    const blob = new Blob([zipBuffer], { type: 'application/zip' });
    const blobUrl = URL.createObjectURL(blob);

    if (!ext?.downloads?.download) {
      sendResponse({ success: false, error: 'Downloads API unavailable' });
      return;
    }

    const downloadOpts = {
      url: blobUrl,
      filename: zipName,
      saveAs: true
    };

    const cleanup = () => {
      setTimeout(() => {
        try {
          URL.revokeObjectURL(blobUrl);
        } catch (e) {}
      }, 15000);
    };

    try {
      const downloadPromise = ext.downloads.download(downloadOpts, (downloadId) => {
        cleanup();
        if (typeof chrome !== 'undefined' && chrome.runtime?.lastError) {
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else if (downloadId !== undefined) {
          sendResponse({ success: true, downloadId });
        }
      });

      if (downloadPromise && typeof downloadPromise.then === 'function') {
        downloadPromise
          .then((downloadId) => {
            cleanup();
            sendResponse({ success: true, downloadId });
          })
          .catch((err) => {
            cleanup();
            sendResponse({ success: false, error: err?.message || String(err) });
          });
      }
    } catch (err) {
      cleanup();
      sendResponse({ success: false, error: err.message });
    }

  } catch (err) {
    console.error('[SEOscoper Firefox] Zip error:', err);
    sendResponse({ success: false, error: err.message });
  }
}

/**
 * Lightweight pure JavaScript ZIP builder (Store-only / Uncompressed standard ZIP)
 * Compatible with all OS unzip tools without requiring external dependencies.
 */
function createZipArchive(files) {
  let offset = 0;
  const fileEntries = [];

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const date = new Date();
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
    const crc = crc32(file.data);

    // Local file header (30 bytes + name)
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed to extract (2.0)
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method: 0 (Stored / no compression)
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, file.data.length, true); // Compressed size
    view.setUint32(22, file.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true); // File name length
    view.setUint16(28, 0, true);         // Extra field length
    header.set(nameBytes, 30);

    fileEntries.push({
      header,
      data: file.data,
      nameBytes,
      offset,
      crc,
      dosTime,
      dosDate,
      size: file.data.length
    });

    offset += header.length + file.data.length;
  }

  // Central directory
  const centralDirEntries = [];
  let centralDirSize = 0;

  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.nameBytes.length);
    const view = new DataView(cdHeader.buffer);
    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true);         // Version made by
    view.setUint16(6, 20, true);         // Version needed to extract
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method: 0
    view.setUint16(12, entry.dosTime, true);
    view.setUint16(14, entry.dosDate, true);
    view.setUint32(16, entry.crc, true);
    view.setUint32(20, entry.size, true);
    view.setUint32(24, entry.size, true);
    view.setUint16(28, entry.nameBytes.length, true);
    view.setUint16(30, 0, true);         // Extra field length
    view.setUint16(32, 0, true);         // File comment length
    view.setUint16(34, 0, true);         // Disk number start
    view.setUint16(36, 0, true);         // Internal file attributes
    view.setUint32(38, 0, true);         // External file attributes
    view.setUint32(42, entry.offset, true); // Relative offset of local header
    cdHeader.set(entry.nameBytes, 46);

    centralDirEntries.push(cdHeader);
    centralDirSize += cdHeader.length;
  }

  // End of central directory record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true); // EOCD signature
  eocdView.setUint16(4, 0, true);          // Disk number
  eocdView.setUint16(6, 0, true);          // Disk where central directory starts
  eocdView.setUint16(8, fileEntries.length, true);  // Number of central directory records on disk
  eocdView.setUint16(10, fileEntries.length, true); // Total central directory records
  eocdView.setUint32(12, centralDirSize, true);     // Size of central directory
  eocdView.setUint32(16, offset, true);             // Offset of central directory
  eocdView.setUint16(20, 0, true);                  // Comment length

  // Combine into single buffer
  const totalLength = offset + centralDirSize + eocd.length;
  const finalZip = new Uint8Array(totalLength);
  let pos = 0;

  for (const entry of fileEntries) {
    finalZip.set(entry.header, pos);
    pos += entry.header.length;
    finalZip.set(entry.data, pos);
    pos += entry.data.length;
  }

  for (const cd of centralDirEntries) {
    finalZip.set(cd, pos);
    pos += cd.length;
  }

  finalZip.set(eocd, pos);
  return finalZip.buffer;
}

// CRC-32 calculation for zip integrity
function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}
