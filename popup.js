document.addEventListener('DOMContentLoaded', () => {
  console.log('SEOscoper: Popup initialized');

  // Tab switching logic
  const buttons = document.querySelectorAll('.tab-button');
  const panes = document.querySelectorAll('.tab-pane');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => btn.classList.remove('active'));
      panes.forEach(pane => pane.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
    });
  });

  // Query active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || !tabs[0]) {
      console.error('SEOscoper: No active tab found');
      document.getElementById('meta-title').textContent = 'Error: No active tab';
      return;
    }

    const tab = tabs[0];
    const url = tab.url || '';
    console.log('SEOscoper: Analyzing URL:', url);

    // Check for restricted URLs
    if (url.startsWith('chrome://') || url.startsWith('about:') || !url.startsWith('http')) {
      console.warn('SEOscoper: Restricted or invalid URL:', url);
      document.getElementById('meta-title').textContent = 'SEOscoper cannot analyze this page';
      return;
    }

    // Execute content script
    try {
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractSEOData
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('SEOscoper: Script execution error:', chrome.runtime.lastError.message);
          document.getElementById('meta-title').textContent = 'Error: Unable to analyze page';
          return;
        }

        if (!results || !results[0] || !results[0].result) {
          console.error('SEOscoper: No data returned from content script');
          document.getElementById('meta-title').textContent = 'Error: No SEO data available';
          return;
        }

        console.log('SEOscoper: Data received:', results[0].result);
        displaySEOData(results[0].result);
      });
    } catch (error) {
      console.error('SEOscoper: Unexpected error:', error);
      document.getElementById('meta-title').textContent = 'Error: Failed to analyze page';
    }
  });
});

function extractSEOData() {
  try {
    // Helper to safely get meta content
    const getMetaContent = (name) => {
      const meta = document.querySelector(`meta[name="${name}" i]`);
      return meta && meta.getAttribute('content') ? meta.getAttribute('content') : `No ${name} found`;
    };

    // Extract metadata
    const title = document.querySelector('title')?.textContent || 'No title found';
    const desc = getMetaContent('description');
    const keywords = getMetaContent('keywords');
    const author = getMetaContent('author');
    const publisher = getMetaContent('publisher');
    const lang = document.documentElement.lang || 'No language specified';
    const url = window.location.href || 'No URL';
    const canonical = document.querySelector('link[rel="canonical"]')?.href || 'No canonical found';
    const robots = getMetaContent('robots');

    // Extract headings (h1-h4 with level for semantic hierarchy)
    const headings = {
      counts: {
        h1: document.querySelectorAll('h1').length,
        h2: document.querySelectorAll('h2').length,
        h3: document.querySelectorAll('h3').length,
        h4: document.querySelectorAll('h4').length,
        h5: document.querySelectorAll('h5').length,
        h6: document.querySelectorAll('h6').length
      },
      list: []
    };
    ['h1', 'h2', 'h3', 'h4'].forEach(tag => {
      document.querySelectorAll(tag).forEach((el) => {
        const text = el.textContent?.trim();
        if (text) {
          const level = parseInt(tag.replace('h', '')); // h1=1, h2=2, etc.
          headings.list.push({ tag, level, text });
        }
      });
    });

    // Extract images with src, alt, and title
    const images = {
      total: document.querySelectorAll('img').length,
      withAlt: document.querySelectorAll('img[alt]:not([alt=""])').length,
      withoutAlt: document.querySelectorAll('img:not([alt]), img[alt=""]').length,
      list: Array.from(document.querySelectorAll('img'))
        .map(img => ({
          src: img.src || '',
          alt: img.getAttribute('alt') || 'No alt text',
          title: img.getAttribute('title') || 'No title'
        }))
        .filter(img => img.src)
    };

    // Extract links with text, nofollow, and handle '#'
    const links = {
      total: document.querySelectorAll('a[href]').length,
      internal: 0,
      external: 0,
      withoutText: 0,
      withoutTitle: 0,
      list: []
    };
    const currentDomain = window.location.hostname || '';
    const baseUrl = window.location.origin || '';
    document.querySelectorAll('a[href]').forEach(link => {
      let href = link.getAttribute('href') || '';
      const text = link.textContent?.trim() || '';
      const title = link.getAttribute('title') || '';
      const isNofollow = link.getAttribute('rel')?.includes('nofollow') ? 'No-follow' : 'Do-follow';

      // Handle '#' href with correct slash
      if (href === '#') {
        href = `${baseUrl}/#`; // Fixed to include '/'
      }

      links.list.push({ href, text: text || 'No anchor text', isNofollow });
      if (!text) links.withoutText++;
      if (!title) links.withoutTitle++;
      if (href.startsWith('/') || (currentDomain && href.includes(currentDomain))) {
        links.internal++;
      } else if (href.startsWith('http')) {
        links.external++;
      }
    });

    return { title, desc, keywords, author, publisher, lang, url, canonical, robots, headings, images, links };
  } catch (error) {
    console.error('SEOscoper: Error extracting SEO data:', error);
    return { error: 'Failed to extract SEO data' };
  }
}

function displaySEOData(data) {
  console.log('SEOscoper: Rendering data:', data);
  if (data.error) {
    document.getElementById('meta-title').textContent = data.error;
    return;
  }

  // Summary Tab
  document.getElementById('meta-title').textContent = data.title || 'No title';
  document.getElementById('title-chars').textContent = `${(data.title || '').length}/60 chars`;
  document.getElementById('meta-desc').textContent = data.desc || 'No description';
  document.getElementById('desc-chars').textContent = `${(data.desc || '').length}/160 chars`;
  document.getElementById('keywords').textContent = data.keywords || 'No keywords';
  document.getElementById('author').textContent = data.author || 'No author';
  document.getElementById('publisher').textContent = data.publisher || 'No publisher';
  document.getElementById('lang').textContent = data.lang || 'No language';
  document.getElementById('url').textContent = data.url || 'No URL';
  document.getElementById('canonical').textContent = data.canonical || 'No canonical';
  document.getElementById('robots').textContent = data.robots || 'No robots';

  // Apply warnings for character limits
  if ((data.title || '').length > 60) {
    document.getElementById('title-chars').classList.add('warning');
  }
  if ((data.desc || '').length > 160) {
    document.getElementById('desc-chars').classList.add('warning');
  }

  // Headers Tab
  document.getElementById('h1-count').textContent = `H1: ${data.headings.counts.h1 || 0}`;
  document.getElementById('h2-count').textContent = `H2: ${data.headings.counts.h2 || 0}`;
  document.getElementById('h3-count').textContent = `H3: ${data.headings.counts.h3 || 0}`;
  document.getElementById('h4-count').textContent = `H4: ${data.headings.counts.h4 || 0}`;
  document.getElementById('h5-count').textContent = `H5: ${data.headings.counts.h5 || 0}`;
  document.getElementById('h6-count').textContent = `H6: ${data.headings.counts.h6 || 0}`;
  const headingsList = document.getElementById('headings-list');
  headingsList.innerHTML = data.headings.list.length
    ? data.headings.list.map(h => `
        <li class="heading-level-${h.level}" data-level="${h.level}">
          <span class="heading-tag">${h.tag.toUpperCase()}</span>: ${h.text}
        </li>
      `).join('')
    : '<li>No headings found</li>';

  // Images Tab
  document.getElementById('total-images').textContent = `Total Images: ${data.images.total || 0}`;
  document.getElementById('images-with-alt').textContent = `With Alt: ${data.images.withAlt || 0}`;
  document.getElementById('images-without-alt').textContent = `Without Alt: ${data.images.withoutAlt || 0}`;
  const imagesList = document.getElementById('images-list');
  imagesList.innerHTML = data.images.list.length
    ? data.images.list.map((img, i) => `
        <p>${i + 1}. <a href="${img.src}" target="_blank">${img.src}</a></p>
        <p style="margin-left: 1rem; font-size: 0.75rem; color: #6b7280;">Alt: ${img.alt}</p>
        <p style="margin-left: 1rem; font-size: 0.75rem; color: #6b7280;">Title: ${img.title}</p>
      `).join('')
    : '<p>No images found</p>';

  // Links Tab
  document.getElementById('total-links').textContent = `Total Links: ${data.links.total || 0}`;
  document.getElementById('internal-links').textContent = `Internal Links: ${data.links.internal || 0}`;
  document.getElementById('external-links').textContent = `External Links: ${data.links.external || 0}`;
  document.getElementById('links-without-text').textContent = `Without Text: ${data.links.withoutText || 0}`;
  document.getElementById('links-without-title').textContent = `Without Title: ${data.links.withoutTitle || 0}`;
  const linksList = document.getElementById('links-list');
  linksList.innerHTML = data.links.list.length
    ? data.links.list.map((link, i) => `
        <p>${i + 1}. <a href="${link.href}" target="_blank">${link.href}</a></p>
        <p style="margin-left: 1rem; font-size: 0.75rem; color: #6b7280;">Text: ${link.text}</p>
        <p style="margin-left: 1rem; font-size: 0.75rem; color: #6b7280;">Type: ${link.isNofollow}</p>
      `).join('')
    : '<p>No links found</p>';
}