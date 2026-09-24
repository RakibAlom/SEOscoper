// SEOscoper - Content Script
// Extracts live DOM elements, metadata, headings, images, videos, links, schema markup

(() => {
  // Always expose global extraction function on window for direct execution
  window.__SEOSCOPER_EXTRACT__ = extractComprehensiveSEOData;
  window.__SEOSCOPER_HIGHLIGHT__ = highlightOnPage;

  // Listen for messages from popup or background
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    try {
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'EXTRACT_SEO_DATA') {
      try {
        const data = extractComprehensiveSEOData();
        sendResponse({ success: true, data });
      } catch (err) {
        console.error('[SEOscoper] Extraction error:', err);
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    if (request.action === 'HIGHLIGHT_ELEMENT') {
      try {
        highlightOnPage(request.type, request.index);
        sendResponse({ success: true });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }

    return false;
      });
    } catch (e) {
      console.warn('[SEOscoper] Listener setup warning:', e);
    }
  }

  /**
   * Main SEO Data Extraction Function
   */
  function extractComprehensiveSEOData() {
    const currentUrl = window.location.href;
    const origin = window.location.origin;

    // Helper: Safely get meta tag content
    const getMeta = (query, attr = 'content') => {
      const el = document.querySelector(query);
      return el ? (el.getAttribute(attr) || '').trim() : '';
    };

    // Helper: Get all matching meta tags
    const getAllMeta = (query, attr = 'content') => {
      return Array.from(document.querySelectorAll(query))
        .map(el => (el.getAttribute(attr) || '').trim())
        .filter(Boolean);
    };

    // 1. Title & SERP Pixel Width estimation
    const rawTitle = document.title || (document.querySelector('title')?.textContent || '').trim();
    const titlePixelWidth = estimatePixelWidth(rawTitle, '20px Arial');

    // 2. Meta tags
    const description = getMeta('meta[name="description" i]') || getMeta('meta[property="og:description" i]');
    const keywords = getMeta('meta[name="keywords" i]') || getMeta('meta[property="keywords" i]');
    const robots = getMeta('meta[name="robots" i]');
    const googlebot = getMeta('meta[name="googlebot" i]');
    const author = getMeta('meta[name="author" i]') || getMeta('link[rel="author"]', 'href') || '';
    const publisher = getMeta('meta[name="publisher" i]') || getMeta('link[rel="publisher"]', 'href') || '';
    const lang = (document.documentElement.lang || document.querySelector('html')?.getAttribute('xml:lang') || '').trim();
    const charset = document.characterSet || getMeta('meta[charset]', 'charset') || 'UTF-8';
    const viewport = getMeta('meta[name="viewport" i]');

    // 3. Canonical URL
    const canonicalEl = document.querySelector('link[rel="canonical" i]');
    const canonical = canonicalEl ? canonicalEl.href : '';
    const canonicalMatch = Boolean(canonical && (canonical.replace(/\/$/, '') === currentUrl.replace(/\/$/, '')));

    // 4. Favicon
    const faviconEl = document.querySelector('link[rel="icon" i], link[rel="shortcut icon" i], link[rel="apple-touch-icon" i]');
    const favicon = faviconEl ? faviconEl.href : `${origin}/favicon.ico`;

    // 5. Hreflang Tags
    const hreflangTags = Array.from(document.querySelectorAll('link[rel="alternate"][hreflang]')).map(el => ({
      lang: el.getAttribute('hreflang') || '',
      href: el.href || el.getAttribute('href') || ''
    }));

    // 6. Open Graph Tags
    const og = {
      title: getMeta('meta[property="og:title" i]'),
      description: getMeta('meta[property="og:description" i]'),
      image: getMeta('meta[property="og:image" i]'),
      url: getMeta('meta[property="og:url" i]'),
      type: getMeta('meta[property="og:type" i]'),
      site_name: getMeta('meta[property="og:site_name" i]'),
      locale: getMeta('meta[property="og:locale" i]')
    };

    // 7. Twitter Card Tags
    const twitter = {
      card: getMeta('meta[name="twitter:card" i]') || getMeta('meta[property="twitter:card" i]'),
      title: getMeta('meta[name="twitter:title" i]') || getMeta('meta[property="twitter:title" i]'),
      description: getMeta('meta[name="twitter:description" i]') || getMeta('meta[property="twitter:description" i]'),
      image: getMeta('meta[name="twitter:image" i]') || getMeta('meta[property="twitter:image" i]'),
      site: getMeta('meta[name="twitter:site" i]'),
      creator: getMeta('meta[name="twitter:creator" i]')
    };

    // 8. Dates
    const publishedDate = getMeta('meta[property="article:published_time" i]') ||
      getMeta('meta[name="date" i]') ||
      getMeta('meta[name="publication_date" i]') ||
      document.querySelector('time[datetime]')?.getAttribute('datetime') || '';
    const modifiedDate = getMeta('meta[property="article:modified_time" i]') ||
      getMeta('meta[property="og:updated_time" i]') ||
      getMeta('meta[name="last-modified" i]') || '';

    // 9. Word Count & Load Time
    const wordCount = calculateBodyWordCount();
    const loadTimeMs = getPageLoadTime();

    // 10. Headings Extraction & Warnings
    const headingsData = extractHeadings();

    // 11. Images Extraction & Stats
    const imagesData = extractImages();

    // 12. Videos Extraction & Stats
    const videosData = extractVideos();

    // 13. Links Extraction & Stats
    const linksData = extractLinks();

    // 14. Structured Data (Schema JSON-LD, Microdata, RDFa)
    const schemaData = extractSchema();

    return {
      url: currentUrl,
      origin,
      title: rawTitle,
      titlePixelWidth,
      description,
      keywords,
      robots,
      googlebot,
      author,
      publisher,
      lang,
      charset,
      viewport,
      canonical,
      canonicalMatch,
      favicon,
      hreflangTags,
      og,
      twitter,
      publishedDate,
      modifiedDate,
      wordCount,
      loadTimeMs,
      robotsUrl: `${origin}/robots.txt`,
      sitemapUrl: `${origin}/sitemap.xml`,
      headings: headingsData,
      images: imagesData,
      videos: videosData,
      links: linksData,
      schema: schemaData
    };
  }

  /**
   * Approximate Google SERP Title pixel width using an offscreen canvas
   */
  function estimatePixelWidth(text, fontSpec) {
    if (!text) return 0;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = fontSpec;
        return Math.round(ctx.measureText(text).width);
      }
    } catch (e) {
      // Fallback rough estimation
    }
    return Math.round(text.length * 9.6);
  }

  /**
   * Count words in visible body text
   */
  function calculateBodyWordCount() {
    try {
      const clone = document.body.cloneNode(true);
      const removeSelectors = ['script', 'style', 'noscript', 'svg', 'iframe', 'canvas', 'nav', 'footer', 'header'];
      removeSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });
      const text = clone.innerText || clone.textContent || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0);
      return words.length;
    } catch (e) {
      return 0;
    }
  }

  /**
   * Get page load time in milliseconds
   */
  function getPageLoadTime() {
    try {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length > 0) {
        const nav = navEntries[0];
        const duration = nav.loadEventEnd ? (nav.loadEventEnd - nav.startTime) : (nav.domContentLoadedEventEnd - nav.startTime);
        return Math.round(duration > 0 ? duration : 0);
      }
      if (performance.timing) {
        const t = performance.timing;
        const duration = t.loadEventEnd ? (t.loadEventEnd - t.navigationStart) : (t.domContentLoadedEventEnd - t.navigationStart);
        return Math.round(duration > 0 ? duration : 0);
      }
    } catch (e) {
      // Ignore
    }
    return 0;
  }

  /**
   * Extract Headings & perform structure diagnostics
   */
  function extractHeadings() {
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    const list = [];
    const warnings = [];

    const headingNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));

    let lastLevel = 0;
    const seenTexts = new Map();

    headingNodes.forEach((el, index) => {
      const tag = el.tagName.toLowerCase();
      const level = parseInt(tag.charAt(1), 10);
      const text = (el.innerText || el.textContent || '').trim();
      counts[tag] = (counts[tag] || 0) + 1;

      // Assign an ID or marker for highlighting
      if (!el.dataset.seoscoperHeadingId) {
        el.dataset.seoscoperHeadingId = `heading-${index}`;
      }

      list.push({
        tag,
        level,
        text: text || '(Empty heading)',
        length: text.length,
        index
      });

      // Warning checks
      if (!text) {
        warnings.push({
          type: 'empty',
          level: 'warning',
          tag,
          message: `Empty <${tag.toUpperCase()}> tag at index #${index + 1}`
        });
      }

      if (text.length > 70) {
        warnings.push({
          type: 'long',
          level: 'info',
          tag,
          message: `<${tag.toUpperCase()}> is over 70 characters (${text.length} chars)`
        });
      }

      // Check skipped level (e.g. H1 to H3)
      if (lastLevel > 0 && level > lastLevel + 1) {
        warnings.push({
          type: 'skipped_level',
          level: 'warning',
          tag,
          message: `Heading level skipped: jumped from <H${lastLevel}> directly to <H${level}>`
        });
      }
      lastLevel = level;

      // Duplicate headings check
      if (text) {
        const lower = text.toLowerCase();
        if (seenTexts.has(lower)) {
          seenTexts.set(lower, seenTexts.get(lower) + 1);
        } else {
          seenTexts.set(lower, 1);
        }
      }
    });

    // Check H1 warnings
    if (counts.h1 === 0) {
      warnings.unshift({
        type: 'missing_h1',
        level: 'danger',
        message: 'Missing H1 heading on the page'
      });
    } else if (counts.h1 > 1) {
      warnings.unshift({
        type: 'multiple_h1',
        level: 'warning',
        message: `Multiple H1 headings detected (${counts.h1} H1s found)`
      });
    }

    // Add duplicate warnings
    seenTexts.forEach((count, text) => {
      if (count > 1) {
        warnings.push({
          type: 'duplicate',
          level: 'warning',
          message: `Duplicate heading found ${count} times: "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`
        });
      }
    });

    return {
      counts,
      total: headingNodes.length,
      list,
      warnings
    };
  }

  /**
   * Extract Images & perform SEO checks
   */
  function extractImages() {
    const imgElements = Array.from(document.querySelectorAll('img'));
    let withAlt = 0;
    let withoutAlt = 0;
    let emptyAlt = 0;
    let withTitle = 0;
    let withoutTitle = 0;
    let lazyLoaded = 0;
    let totalEstimatedSize = 0;

    // Cache resource timing sizes
    const resourceTimingMap = new Map();
    try {
      const resources = performance.getEntriesByType('resource');
      resources.forEach(res => {
        if (res.initiatorType === 'img' || /\.(jpg|jpeg|png|webp|avif|svg|gif)(\?.*)?$/i.test(res.name)) {
          const size = res.transferSize || res.encodedBodySize || res.decodedBodySize || 0;
          if (size > 0) {
            resourceTimingMap.set(res.name, size);
          }
        }
      });
    } catch (e) {
      // Ignore
    }

    const list = imgElements.map((img, index) => {
      const src = img.src || img.getAttribute('data-src') || img.currentSrc || '';
      const rawAlt = img.getAttribute('alt');
      const rawTitle = img.getAttribute('title');
      const loading = img.getAttribute('loading') || (img.classList.contains('lazy') || img.dataset.src ? 'lazy' : 'eager');

      const naturalWidth = img.naturalWidth || 0;
      const naturalHeight = img.naturalHeight || 0;
      const width = img.clientWidth || naturalWidth || parseInt(img.getAttribute('width') || '0', 10);
      const height = img.clientHeight || naturalHeight || parseInt(img.getAttribute('height') || '0', 10);

      // File format extraction
      let format = 'unknown';
      try {
        if (src.startsWith('data:image/')) {
          format = src.substring(11, src.indexOf(';'));
        } else {
          const pathname = new URL(src, window.location.href).pathname;
          const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
          if (extMatch) {
            format = extMatch[1].toLowerCase();
          }
        }
      } catch (e) {
        // Fallback
      }

      // Alt stats
      const hasAltAttr = rawAlt !== null;
      const hasAltText = hasAltAttr && rawAlt.trim().length > 0;
      const isDecorative = hasAltAttr && rawAlt.trim().length === 0;

      if (hasAltText) {
        withAlt++;
      } else if (isDecorative) {
        emptyAlt++;
      } else {
        withoutAlt++;
      }

      // Title stats
      if (rawTitle && rawTitle.trim()) {
        withTitle++;
      } else {
        withoutTitle++;
      }

      if (loading === 'lazy') {
        lazyLoaded++;
      }

      const fileSize = resourceTimingMap.get(src) || 0;
      totalEstimatedSize += fileSize;

      // Assign marker for page highlight
      if (!img.dataset.seoscoperImageId) {
        img.dataset.seoscoperImageId = `image-${index}`;
      }

      return {
        index,
        src,
        alt: rawAlt,
        hasAltAttr,
        hasAltText,
        isDecorative,
        title: rawTitle || '',
        format,
        naturalWidth,
        naturalHeight,
        width,
        height,
        loading,
        fileSize
      };
    }).filter(img => Boolean(img.src));

    return {
      total: list.length,
      withAlt,
      withoutAlt,
      emptyAlt,
      withTitle,
      withoutTitle,
      lazyLoaded,
      totalEstimatedSize,
      list
    };
  }

  /**
   * Extract Videos: HTML5 tags, YouTube/Vimeo iframes, schema, og:video
   */
  function extractVideos() {
    const list = [];
    let embedded = 0;
    let selfHosted = 0;
    let withPoster = 0;
    let withCaptions = 0;
    let withAutoplay = 0;

    // 1. HTML5 <video> elements
    document.querySelectorAll('video').forEach((video, index) => {
      selfHosted++;
      const src = video.src || video.querySelector('source')?.src || '';
      const poster = video.poster || '';
      const autoplay = video.autoplay || video.hasAttribute('autoplay');
      const controls = video.controls || video.hasAttribute('controls');
      const loop = video.loop || video.hasAttribute('loop');
      const muted = video.muted || video.hasAttribute('muted');
      const width = video.videoWidth || video.clientWidth || parseInt(video.getAttribute('width') || '0', 10);
      const height = video.videoHeight || video.clientHeight || parseInt(video.getAttribute('height') || '0', 10);

      const hasCaptions = video.querySelectorAll('track[kind="subtitles"], track[kind="captions"]').length > 0;
      if (hasCaptions) withCaptions++;
      if (poster) withPoster++;
      if (autoplay) withAutoplay++;

      list.push({
        index,
        type: 'self-hosted',
        provider: 'HTML5 Video',
        url: src,
        poster,
        title: video.getAttribute('title') || video.getAttribute('aria-label') || 'HTML5 Video',
        autoplay,
        controls,
        loop,
        muted,
        width,
        height,
        hasCaptions
      });
    });

    // 2. Embedded Video Iframes (YouTube, Vimeo, Dailymotion, Wistia)
    document.querySelectorAll('iframe').forEach((iframe, index) => {
      const src = iframe.src || iframe.getAttribute('data-src') || '';
      if (!src) return;

      let provider = '';
      let videoId = '';
      let poster = '';

      if (src.includes('youtube.com/embed') || src.includes('youtube-nocookie.com/embed') || src.includes('youtu.be')) {
        provider = 'YouTube';
        const match = src.match(/(?:embed\/|v=|\/v\/|youtu\.be\/|\/embed\?list=)([^&?#/]+)/);
        if (match && match[1]) {
          videoId = match[1];
          poster = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      } else if (src.includes('player.vimeo.com/video/')) {
        provider = 'Vimeo';
      } else if (src.includes('dailymotion.com/embed/')) {
        provider = 'Dailymotion';
      }

      if (provider) {
        embedded++;
        const autoplay = src.includes('autoplay=1') || iframe.allow?.includes('autoplay');
        if (autoplay) withAutoplay++;
        if (poster) withPoster++;

        list.push({
          index: list.length,
          type: 'embedded',
          provider,
          url: src,
          poster,
          title: iframe.title || iframe.getAttribute('aria-label') || `${provider} Embed`,
          autoplay,
          controls: true,
          loop: false,
          muted: false,
          width: iframe.clientWidth || parseInt(iframe.getAttribute('width') || '0', 10),
          height: iframe.clientHeight || parseInt(iframe.getAttribute('height') || '0', 10),
          hasCaptions: false
        });
      }
    });

    // 3. Open Graph Video Meta Tag
    const ogVideo = document.querySelector('meta[property="og:video" i], meta[property="og:video:url" i]')?.getAttribute('content');
    if (ogVideo && !list.some(v => v.url === ogVideo)) {
      list.push({
        index: list.length,
        type: 'meta',
        provider: 'Open Graph Video',
        url: ogVideo,
        poster: document.querySelector('meta[property="og:image" i]')?.getAttribute('content') || '',
        title: document.querySelector('meta[property="og:title" i]')?.getAttribute('content') || 'OG Video',
        autoplay: false,
        controls: true,
        loop: false,
        muted: false,
        width: 0,
        height: 0,
        hasCaptions: false
      });
    }

    return {
      total: list.length,
      embedded,
      selfHosted,
      withPoster,
      withCaptions,
      withAutoplay,
      list
    };
  }

  /**
   * Extract Links & categorizations
   */
  function extractLinks() {
    const aElements = Array.from(document.querySelectorAll('a[href]'));
    const currentDomain = window.location.hostname;
    let internal = 0;
    let external = 0;
    let withoutText = 0;
    let withoutTitle = 0;
    let nofollow = 0;
    let dofollow = 0;
    let duplicateCount = 0;

    const seenUrls = new Map();

    const list = aElements.map((el, index) => {
      const rawHref = el.getAttribute('href') || '';
      const href = el.href || rawHref;
      const text = (el.innerText || el.textContent || '').trim();
      const title = (el.getAttribute('title') || '').trim();
      const target = el.getAttribute('target') || '_self';
      const rel = (el.getAttribute('rel') || '').toLowerCase();

      const isNofollow = rel.includes('nofollow');
      if (isNofollow) {
        nofollow++;
      } else {
        dofollow++;
      }

      if (!text) withoutText++;
      if (!title) withoutTitle++;

      // Check internal vs external
      let isInternal = false;
      try {
        if (rawHref.startsWith('#') || rawHref.startsWith('/') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
          isInternal = true;
        } else {
          const urlObj = new URL(href, window.location.href);
          isInternal = urlObj.hostname === currentDomain || urlObj.hostname.endsWith(`.${currentDomain}`);
        }
      } catch (e) {
        isInternal = false;
      }

      if (isInternal) {
        internal++;
      } else {
        external++;
      }

      // Duplicate check
      let isDuplicate = false;
      if (href) {
        if (seenUrls.has(href)) {
          isDuplicate = true;
          duplicateCount++;
        } else {
          seenUrls.set(href, 1);
        }
      }

      // Assign marker for highlighting
      if (!el.dataset.seoscoperLinkId) {
        el.dataset.seoscoperLinkId = `link-${index}`;
      }

      return {
        index,
        href,
        rawHref,
        text: text || '',
        title,
        target,
        rel,
        isInternal,
        isNofollow,
        isDofollow: !isNofollow,
        isDuplicate,
        status: null, // Populated by background service worker during link check
        statusText: ''
      };
    });

    return {
      total: list.length,
      internal,
      external,
      withoutText,
      withoutTitle,
      nofollow,
      dofollow,
      duplicateCount,
      list
    };
  }

  /**
   * Extract Structured Data (JSON-LD, Microdata, RDFa)
   */
  function extractSchema() {
    const jsonLdBlocks = [];
    const typesDetected = new Map();
    const validationIssues = [];

    // 1. JSON-LD scripts
    const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    jsonLdScripts.forEach((script, index) => {
      const rawText = script.textContent ? script.textContent.trim() : '';
      let parsed = null;
      let parseError = null;

      try {
        parsed = JSON.parse(rawText);
      } catch (err) {
        parseError = err.message;
        validationIssues.push({
          type: 'json_syntax_error',
          blockIndex: index + 1,
          message: `JSON-LD syntax error in block #${index + 1}: ${err.message}`
        });
      }

      // Helper to register detected schema types
      const recordType = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (obj['@type']) {
          const typeVal = Array.isArray(obj['@type']) ? obj['@type'].join(', ') : obj['@type'];
          typesDetected.set(typeVal, (typesDetected.get(typeVal) || 0) + 1);

          // Validation of standard types
          if (!obj['@context']) {
            validationIssues.push({
              type: 'missing_context',
              blockIndex: index + 1,
              message: `Schema @type "${typeVal}" is missing "@context" property.`
            });
          }
        }
        if (Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(recordType);
        }
      };

      if (parsed) {
        if (Array.isArray(parsed)) {
          parsed.forEach(recordType);
        } else {
          recordType(parsed);
        }
      }

      jsonLdBlocks.push({
        index: index + 1,
        format: 'JSON-LD',
        raw: rawText,
        data: parsed,
        hasError: Boolean(parseError),
        error: parseError
      });
    });

    // 2. Microdata (itemscope)
    const microdataElements = Array.from(document.querySelectorAll('[itemscope]'));
    const microdataBlocks = microdataElements.map((el, idx) => {
      const itemType = el.getAttribute('itemtype') || 'Unknown Type';
      const typeShort = itemType.split('/').pop() || itemType;
      typesDetected.set(typeShort, (typesDetected.get(typeShort) || 0) + 1);

      // Collect itemprops
      const props = {};
      el.querySelectorAll('[itemprop]').forEach(propEl => {
        const propName = propEl.getAttribute('itemprop');
        const val = propEl.getAttribute('content') || propEl.src || propEl.href || propEl.innerText.trim();
        if (propName) props[propName] = val;
      });

      return {
        index: jsonLdBlocks.length + idx + 1,
        format: 'Microdata',
        type: typeShort,
        itemType,
        props
      };
    });

    // 3. RDFa (typeof)
    const rdfaElements = Array.from(document.querySelectorAll('[typeof]'));
    const rdfaBlocks = rdfaElements.map((el, idx) => {
      const rdfType = el.getAttribute('typeof') || 'Unknown RDFa Type';
      typesDetected.set(rdfType, (typesDetected.get(rdfType) || 0) + 1);
      return {
        index: jsonLdBlocks.length + microdataBlocks.length + idx + 1,
        format: 'RDFa',
        type: rdfType
      };
    });

    // Format types summary
    const typesSummary = Array.from(typesDetected.entries()).map(([type, count]) => ({
      type,
      count
    }));

    return {
      totalBlocks: jsonLdBlocks.length + microdataBlocks.length + rdfaBlocks.length,
      typesSummary,
      validationIssues,
      jsonLdBlocks,
      microdataBlocks,
      rdfaBlocks
    };
  }

  /**
   * Highlight element on page with smooth scroll & pulsing outline
   */
  function highlightOnPage(type, index) {
    let target = null;

    if (type === 'heading') {
      target = document.querySelector(`[data-seoscoper-heading-id="heading-${index}"]`);
      if (!target) {
        const all = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        target = all[index];
      }
    } else if (type === 'image') {
      target = document.querySelector(`[data-seoscoper-image-id="image-${index}"]`);
      if (!target) {
        const all = document.querySelectorAll('img');
        target = all[index];
      }
    } else if (type === 'link') {
      target = document.querySelector(`[data-seoscoper-link-id="link-${index}"]`);
      if (!target) {
        const all = document.querySelectorAll('a[href]');
        target = all[index];
      }
    }

    if (!target) return;

    // Scroll into center
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Add pulse highlight style if not injected yet
    if (!document.getElementById('seoscoper-highlight-style')) {
      const style = document.createElement('style');
      style.id = 'seoscoper-highlight-style';
      style.textContent = `
        @keyframes seoscoperPulse {
          0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.7); outline: 3px solid #4F46E5; }
          50% { box-shadow: 0 0 0 12px rgba(79, 70, 229, 0); outline: 3px solid #4F46E5; }
          100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); outline: 3px solid transparent; }
        }
        .seoscoper-highlighted-element {
          animation: seoscoperPulse 1.2s ease-in-out 2 !important;
          border-radius: 4px !important;
          transition: outline 0.3s ease !important;
        }
      `;
      document.head.appendChild(style);
    }

    target.classList.remove('seoscoper-highlighted-element');
    // Trigger reflow
    void target.offsetWidth;
    target.classList.add('seoscoper-highlighted-element');

    setTimeout(() => {
      target.classList.remove('seoscoper-highlighted-element');
    }, 2600);
  }
})();
