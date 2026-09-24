// SEOscoper - Popup Application Logic
// High-performance vanilla JS ES module for instant (<300ms) startup and smooth UX

// Global State
let currentTabId = null;
let currentTabUrl = '';
let currentTabData = null;
let activeTheme = 'light';
let activeTabName = 'summary';

// Sub-list states for pagination and search
const listStates = {
  headers: { filter: 'all', search: '' },
  images: { filter: 'all', search: '', page: 1, pageSize: 25 },
  videos: { filter: 'all', search: '' },
  links: { filter: 'all', search: '', page: 1, pageSize: 35, checkResults: new Map(), isChecking: false },
  tools: { category: 'all', search: '' }
};

// Tools Data
const SEO_TOOLS = [
  // Keyword Research
  { name: 'SEMrush', category: 'Keyword Research', desc: 'Competitor and keyword research suite', url: 'https://www.semrush.com' },
  { name: 'SpyFu', category: 'Keyword Research', desc: 'Competitor keyword research and PPC analysis', url: 'https://www.spyfu.com' },
  { name: 'Keyword Tool', category: 'Keyword Research', desc: 'Google, YouTube, and Amazon keyword suggestions', url: 'https://keywordtool.io' },
  { name: 'Google Trends', category: 'Keyword Research', desc: 'Real-time keyword search trends & interest', url: 'https://trends.google.com' },

  // Backlinks & Authority
  { name: 'Ahrefs', category: 'Backlinks and Authority', desc: 'Backlink checker, keyword explorer, and site audit', url: 'https://ahrefs.com' },
  { name: 'Moz', category: 'Backlinks and Authority', desc: 'Domain Authority (DA) metrics and SEO audit tools', url: 'https://moz.com' },
  { name: 'Majestic', category: 'Backlinks and Authority', desc: 'Trust Flow and Citation Flow backlink analysis', url: 'https://majestic.com' },

  // Technical SEO & Audits
  { name: 'Screaming Frog', category: 'Technical SEO and Audits', desc: 'Industry-standard desktop website crawler', url: 'https://www.screamingfrog.co.uk/seo-spider/' },
  { name: 'DeepCrawl (Lumar)', category: 'Technical SEO and Audits', desc: 'Enterprise technical SEO and website intelligence', url: 'https://www.lumar.io' },
  { name: 'WooRank', category: 'Technical SEO and Audits', desc: 'Automated website review and on-page SEO audit', url: 'https://www.woorank.com' },
  { name: 'Seobility', category: 'Technical SEO and Audits', desc: 'All-in-one SEO software and crawler audit', url: 'https://www.seobility.net' },

  // Speed and Performance
  { name: 'PageSpeed Insights', category: 'Speed and Performance', desc: 'Core Web Vitals and Google Lighthouse audit', url: 'https://pagespeed.web.dev' },
  { name: 'GTmetrix', category: 'Speed and Performance', desc: 'Page speed, waterfall charts, and performance analysis', url: 'https://gtmetrix.com' },

  // Google Tools
  { name: 'Google Search Console', category: 'Google Tools', desc: 'Track organic impressions, clicks, and indexing', url: 'https://search.google.com/search-console' },
  { name: 'Google Analytics', category: 'Google Tools', desc: 'Traffic analytics, user journeys, and conversions', url: 'https://analytics.google.com' },

  // WordPress SEO
  { name: 'Rank Math', category: 'WordPress SEO', desc: 'AI-powered WordPress SEO plugin and schema generator', url: 'https://rankmath.com' },
  { name: 'Yoast SEO', category: 'WordPress SEO', desc: 'WordPress content optimization and XML sitemaps', url: 'https://yoast.com' },

  // Rank Tracking and All-in-One
  { name: 'SE Ranking', category: 'Rank Tracking and All-in-One', desc: 'Accurate keyword rank tracker and competitive research', url: 'https://seranking.com' },
  { name: 'SEO PowerSuite', category: 'Rank Tracking and All-in-One', desc: 'Rank Tracker, WebSite Auditor, and SEO SpyGlass', url: 'https://www.seopowersuite.com' },

  // Content and Design
  { name: 'Canva', category: 'Content and Design', desc: 'Create visual assets, OG images, and infographics', url: 'https://www.canva.com' }
];

/**
 * Self-contained in-page SEO extraction function.
 * Executed directly inside the active tab's page context via chrome.scripting.executeScript.
 * Always extracts 100% fresh, live DOM data with zero caching or mock placeholders.
 */
function extractLivePageSEOData() {
  const currentUrl = window.location.href;
  const origin = window.location.origin;

  // Helper: Safely get meta tag content
  const getMeta = (query, attr = 'content') => {
    const el = document.querySelector(query);
    return el ? (el.getAttribute(attr) || '').trim() : '';
  };

  // 1. Title & SERP Pixel Width estimation
  const rawTitle = document.title || (document.querySelector('title')?.textContent || '').trim();
  let titlePixelWidth = 0;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.font = '20px Arial';
      titlePixelWidth = Math.round(ctx.measureText(rawTitle).width);
    }
  } catch (e) {
    titlePixelWidth = Math.round(rawTitle.length * 9.6);
  }

  // 2. Core Meta tags
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
  const canonical = canonicalEl ? (canonicalEl.href || canonicalEl.getAttribute('href') || '') : '';
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

  // 9. Word Count
  let wordCount = 0;
  try {
    const clone = document.body.cloneNode(true);
    const removeSelectors = ['script', 'style', 'noscript', 'svg', 'iframe', 'canvas', 'nav', 'footer', 'header'];
    removeSelectors.forEach(sel => {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    });
    const text = clone.innerText || clone.textContent || '';
    wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
  } catch (e) {
    wordCount = 0;
  }

  // 10. Load Time
  let loadTimeMs = 0;
  try {
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      const nav = navEntries[0];
      const duration = nav.loadEventEnd ? (nav.loadEventEnd - nav.startTime) : (nav.domContentLoadedEventEnd - nav.startTime);
      loadTimeMs = Math.round(duration > 0 ? duration : 0);
    } else if (performance.timing) {
      const t = performance.timing;
      const duration = t.loadEventEnd ? (t.loadEventEnd - t.navigationStart) : (t.domContentLoadedEventEnd - t.navigationStart);
      loadTimeMs = Math.round(duration > 0 ? duration : 0);
    }
  } catch (e) {
    loadTimeMs = 0;
  }

  // 11. Headings
  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  const headingList = [];
  const headingWarnings = [];
  const headingNodes = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let lastLevel = 0;
  const seenHeadingTexts = new Map();

  headingNodes.forEach((el, index) => {
    const tag = el.tagName.toLowerCase();
    const level = parseInt(tag.charAt(1), 10);
    const text = (el.innerText || el.textContent || '').trim();
    counts[tag] = (counts[tag] || 0) + 1;

    if (!el.dataset.seoscoperHeadingId) {
      el.dataset.seoscoperHeadingId = `heading-${index}`;
    }

    headingList.push({
      tag,
      level,
      text: text || '(Empty heading)',
      length: text.length,
      index
    });

    if (!text) {
      headingWarnings.push({
        type: 'empty',
        level: 'warning',
        tag,
        message: `Empty <${tag.toUpperCase()}> tag at index #${index + 1}`
      });
    }

    if (text.length > 70) {
      headingWarnings.push({
        type: 'long',
        level: 'info',
        tag,
        message: `<${tag.toUpperCase()}> is over 70 characters (${text.length} chars)`
      });
    }

    if (lastLevel > 0 && level > lastLevel + 1) {
      headingWarnings.push({
        type: 'skipped_level',
        level: 'warning',
        tag,
        message: `Heading level skipped: jumped from <H${lastLevel}> directly to <H${level}>`
      });
    }
    lastLevel = level;

    if (text) {
      const lower = text.toLowerCase();
      seenHeadingTexts.set(lower, (seenHeadingTexts.get(lower) || 0) + 1);
    }
  });

  if (counts.h1 === 0) {
    headingWarnings.unshift({
      type: 'missing_h1',
      level: 'danger',
      message: 'Missing H1 heading on the page'
    });
  } else if (counts.h1 > 1) {
    headingWarnings.unshift({
      type: 'multiple_h1',
      level: 'warning',
      message: `Multiple H1 headings detected (${counts.h1} H1s found)`
    });
  }

  seenHeadingTexts.forEach((cnt, txt) => {
    if (cnt > 1) {
      headingWarnings.push({
        type: 'duplicate',
        level: 'warning',
        message: `Duplicate heading found ${cnt} times: "${txt.slice(0, 50)}${txt.length > 50 ? '...' : ''}"`
      });
    }
  });

  // 12. Images
  const imgElements = Array.from(document.querySelectorAll('img'));
  let withAlt = 0;
  let withoutAlt = 0;
  let emptyAlt = 0;
  let withTitle = 0;
  let withoutTitle = 0;
  let lazyLoaded = 0;
  let totalEstimatedSize = 0;

  const resourceTimingMap = new Map();
  try {
    const resources = performance.getEntriesByType('resource');
    resources.forEach(res => {
      if (res.initiatorType === 'img' || /\.(jpg|jpeg|png|webp|avif|svg|gif)(\?.*)?$/i.test(res.name)) {
        const size = res.transferSize || res.encodedBodySize || res.decodedBodySize || 0;
        if (size > 0) resourceTimingMap.set(res.name, size);
      }
    });
  } catch (e) {}

  const imageList = imgElements.map((img, index) => {
    const src = img.src || img.getAttribute('data-src') || img.currentSrc || '';
    const rawAlt = img.getAttribute('alt');
    const rawTitle = img.getAttribute('title');
    const loading = img.getAttribute('loading') || (img.classList.contains('lazy') || img.dataset.src ? 'lazy' : 'eager');

    const naturalWidth = img.naturalWidth || 0;
    const naturalHeight = img.naturalHeight || 0;
    const width = img.clientWidth || naturalWidth || parseInt(img.getAttribute('width') || '0', 10);
    const height = img.clientHeight || naturalHeight || parseInt(img.getAttribute('height') || '0', 10);

    let format = 'unknown';
    try {
      if (src.startsWith('data:image/')) {
        format = src.substring(11, src.indexOf(';'));
      } else {
        const pathname = new URL(src, window.location.href).pathname;
        const extMatch = pathname.match(/\.([a-zA-Z0-9]+)$/);
        if (extMatch) format = extMatch[1].toLowerCase();
      }
    } catch (e) {}

    const hasAltAttr = rawAlt !== null;
    const hasAltText = hasAltAttr && rawAlt.trim().length > 0;
    const isDecorative = hasAltAttr && rawAlt.trim().length === 0;

    if (hasAltText) withAlt++;
    else if (isDecorative) emptyAlt++;
    else withoutAlt++;

    if (rawTitle && rawTitle.trim()) withTitle++;
    else withoutTitle++;

    if (loading === 'lazy') lazyLoaded++;

    const fileSize = resourceTimingMap.get(src) || 0;
    totalEstimatedSize += fileSize;

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

  // 13. Videos
  const videoList = [];
  let vidEmbedded = 0;
  let vidSelfHosted = 0;
  let vidWithPoster = 0;
  let vidWithCaptions = 0;
  let vidWithAutoplay = 0;

  document.querySelectorAll('video').forEach((video, index) => {
    vidSelfHosted++;
    const src = video.src || video.querySelector('source')?.src || '';
    const poster = video.poster || '';
    const autoplay = video.autoplay || video.hasAttribute('autoplay');
    const controls = video.controls || video.hasAttribute('controls');
    const loop = video.loop || video.hasAttribute('loop');
    const muted = video.muted || video.hasAttribute('muted');
    const width = video.videoWidth || video.clientWidth || parseInt(video.getAttribute('width') || '0', 10);
    const height = video.videoHeight || video.clientHeight || parseInt(video.getAttribute('height') || '0', 10);

    const hasCaptions = video.querySelectorAll('track[kind="subtitles"], track[kind="captions"]').length > 0;
    if (hasCaptions) vidWithCaptions++;
    if (poster) vidWithPoster++;
    if (autoplay) vidWithAutoplay++;

    videoList.push({
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

  document.querySelectorAll('iframe').forEach((iframe) => {
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
      vidEmbedded++;
      const autoplay = src.includes('autoplay=1') || iframe.allow?.includes('autoplay');
      if (autoplay) vidWithAutoplay++;
      if (poster) vidWithPoster++;

      videoList.push({
        index: videoList.length,
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

  const ogVideo = document.querySelector('meta[property="og:video" i], meta[property="og:video:url" i]')?.getAttribute('content');
  if (ogVideo && !videoList.some(v => v.url === ogVideo)) {
    videoList.push({
      index: videoList.length,
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

  // 14. Links
  const aElements = Array.from(document.querySelectorAll('a[href]'));
  const currentDomain = window.location.hostname;
  let linkInternal = 0;
  let linkExternal = 0;
  let linkWithoutText = 0;
  let linkWithoutTitle = 0;
  let linkNofollow = 0;
  let linkDofollow = 0;
  let linkDuplicateCount = 0;
  const seenLinkUrls = new Map();

  const linksList = aElements.map((el, index) => {
    const rawHref = el.getAttribute('href') || '';
    const href = el.href || rawHref;
    const text = (el.innerText || el.textContent || '').trim();
    const title = (el.getAttribute('title') || '').trim();
    const target = el.getAttribute('target') || '_self';
    const rel = (el.getAttribute('rel') || '').toLowerCase();

    const isNofollow = rel.includes('nofollow');
    if (isNofollow) linkNofollow++;
    else linkDofollow++;

    let isInternal = false;
    let isExternal = false;
    try {
      if (rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) {
        isInternal = true;
      } else {
        const linkUrl = new URL(href, window.location.href);
        isInternal = linkUrl.hostname === currentDomain || !linkUrl.hostname;
        isExternal = !isInternal;
      }
    } catch (e) {
      isInternal = true;
    }

    if (isInternal) linkInternal++;
    if (isExternal) linkExternal++;

    if (!text) linkWithoutText++;
    if (!title) linkWithoutTitle++;

    const normUrl = href.split('#')[0].replace(/\/$/, '');
    let isDuplicate = false;
    if (seenLinkUrls.has(normUrl)) {
      isDuplicate = true;
      linkDuplicateCount++;
    } else {
      seenLinkUrls.set(normUrl, true);
    }

    if (!el.dataset.seoscoperLinkId) {
      el.dataset.seoscoperLinkId = `link-${index}`;
    }

    return {
      index,
      href,
      rawHref,
      text: text || '(No anchor text)',
      title,
      target,
      rel,
      isInternal,
      isExternal,
      isNofollow,
      isDofollow: !isNofollow,
      isDuplicate
    };
  }).filter(l => Boolean(l.href));

  // 15. Schema Structured Data
  const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const schemaTypesDetected = new Map();
  const validationIssues = [];

  const jsonLdBlocks = jsonLdScripts.map((script, idx) => {
    const raw = (script.textContent || '').trim();
    let data = null;
    let hasError = false;
    let errorMessage = '';

    try {
      data = JSON.parse(raw);
      const extractTypes = (obj) => {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) {
          obj.forEach(extractTypes);
        } else {
          if (obj['@type']) {
            const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
            types.forEach(t => {
              schemaTypesDetected.set(t, (schemaTypesDetected.get(t) || 0) + 1);
            });
          }
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            obj['@graph'].forEach(extractTypes);
          }
        }
      };
      extractTypes(data);
    } catch (err) {
      hasError = true;
      errorMessage = err.message;
      validationIssues.push({
        type: 'syntax_error',
        message: `JSON-LD Block #${idx + 1} syntax error: ${err.message}`
      });
    }

    return {
      index: idx + 1,
      format: 'JSON-LD',
      raw,
      data,
      hasError,
      errorMessage
    };
  });

  const microdataElements = Array.from(document.querySelectorAll('[itemscope]'));
  const microdataBlocks = microdataElements.map((el, idx) => {
    const itemType = el.getAttribute('itemtype') || 'Unknown Type';
    const typeShort = itemType.split('/').pop() || itemType;
    schemaTypesDetected.set(typeShort, (schemaTypesDetected.get(typeShort) || 0) + 1);

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

  const rdfaElements = Array.from(document.querySelectorAll('[typeof]'));
  const rdfaBlocks = rdfaElements.map((el, idx) => {
    const rdfType = el.getAttribute('typeof') || 'Unknown RDFa Type';
    schemaTypesDetected.set(rdfType, (schemaTypesDetected.get(rdfType) || 0) + 1);
    return {
      index: jsonLdBlocks.length + microdataBlocks.length + idx + 1,
      format: 'RDFa',
      type: rdfType
    };
  });

  const typesSummary = Array.from(schemaTypesDetected.entries()).map(([type, count]) => ({
    type,
    count
  }));

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
    headings: {
      counts,
      total: headingNodes.length,
      list: headingList,
      warnings: headingWarnings
    },
    images: {
      total: imageList.length,
      withAlt,
      withoutAlt,
      emptyAlt,
      withTitle,
      withoutTitle,
      lazyLoaded,
      totalEstimatedSize,
      list: imageList
    },
    videos: {
      total: videoList.length,
      embedded: vidEmbedded,
      selfHosted: vidSelfHosted,
      withPoster: vidWithPoster,
      withCaptions: vidWithCaptions,
      withAutoplay: vidWithAutoplay,
      list: videoList
    },
    links: {
      total: linksList.length,
      internal: linkInternal,
      external: linkExternal,
      withoutText: linkWithoutText,
      withoutTitle: linkWithoutTitle,
      nofollow: linkNofollow,
      dofollow: linkDofollow,
      duplicateCount: linkDuplicateCount,
      list: linksList
    },
    schema: {
      totalBlocks: jsonLdBlocks.length + microdataBlocks.length + rdfaBlocks.length,
      typesSummary,
      validationIssues,
      jsonLdBlocks,
      microdataBlocks,
      rdfaBlocks
    }
  };
}

/**
 * Direct element highlighter executed on the active tab via scripting.executeScript
 */
function highlightElementOnPage(type, index) {
  if (!currentTabId) return;

  const extApi = typeof browser !== 'undefined' && browser.scripting ? browser : (typeof chrome !== 'undefined' ? chrome : null);
  if (!extApi) return;

  extApi.scripting.executeScript({
    target: { tabId: currentTabId },
    func: (type, index) => {
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

      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
      void target.offsetWidth;
      target.classList.add('seoscoper-highlighted-element');

      setTimeout(() => {
        target.classList.remove('seoscoper-highlighted-element');
      }, 2600);
    },
    args: [type, index]
  }).catch(() => {
    if (extApi.tabs?.sendMessage) {
      extApi.tabs.sendMessage(currentTabId, { action: 'HIGHLIGHT_ELEMENT', type, index });
    }
  });
}

// Storage Helpers (safe fallback if chrome.storage or localStorage is restricted)
function safeGetStorage(key) {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch (e) {
    return null;
  }
}

function safeSetStorage(key, val) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, val);
  } catch (e) {
    // Ignore restricted storage
  }
}

function initModal() {
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('btn-modal-close');
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }
}

// Initialize on DOM Ready or immediately if DOM is already parsed
async function initApp() {
  try {
    initTheme();
    initTabNavigation();
    initGlobalActions();
    initModal();
    initBackgroundListeners();

    await loadActiveTabAndAnalyze();
  } catch (err) {
    console.error('[SEOscoper] initApp error:', err);
    showRestrictedState('SEOscoper encountered an error during initialization: ' + (err.message || 'Unknown error'));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

/* Cross-browser Storage Helpers (compatible with browser.storage and chrome.storage) */
function getExtStorage(key, callback) {
  const extApi = typeof browser !== 'undefined' && browser.storage?.local ? browser.storage.local : (typeof chrome !== 'undefined' && chrome.storage?.local ? chrome.storage.local : null);
  if (extApi) {
    try {
      const res = extApi.get([key], (data) => {
        if (callback) callback(data ? data[key] : null);
      });
      if (res && typeof res.then === 'function') {
        res.then((data) => { if (callback) callback(data ? data[key] : null); })
           .catch(() => { if (callback) callback(safeGetStorage(key)); });
      }
      return;
    } catch (e) {}
  }
  if (callback) callback(safeGetStorage(key));
}

function setExtStorage(key, val) {
  const extApi = typeof browser !== 'undefined' && browser.storage?.local ? browser.storage.local : (typeof chrome !== 'undefined' && chrome.storage?.local ? chrome.storage.local : null);
  if (extApi) {
    try {
      const res = extApi.set({ [key]: val });
      if (res && typeof res.catch === 'function') {
        res.catch(() => safeSetStorage(key, val));
      }
      return;
    } catch (e) {}
  }
  safeSetStorage(key, val);
}

/* ==========================================================================
   Theme Management
   ========================================================================== */
function initTheme() {
  getExtStorage('theme', (savedTheme) => {
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  });

  const toggleBtn = document.getElementById('btn-theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const newTheme = activeTheme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      setExtStorage('theme', newTheme);
    });
  }
}

function setTheme(theme) {
  activeTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);
}

/* ==========================================================================
   Tab Navigation & Memory
   ========================================================================== */
function initTabNavigation() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;
      switchTab(targetTab);
      setExtStorage('lastTab', targetTab);
    });
  });

  // Restore last active tab
  getExtStorage('lastTab', (savedTab) => {
    if (savedTab && document.getElementById(`pane-${savedTab}`)) {
      switchTab(savedTab);
    }
  });
}

function switchTab(tabName) {
  activeTabName = tabName;
  document.querySelectorAll('.tab-btn').forEach(b => {
    const isActive = b.dataset.tab === tabName;
    b.classList.toggle('active', isActive);
    b.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  document.querySelectorAll('.tab-pane').forEach(pane => {
    const isTarget = pane.id === `pane-${tabName}`;
    pane.classList.toggle('active', isTarget);
    if (isTarget) {
      pane.classList.remove('hidden');
    }
  });

  // Lazy render tab on switch if data is available
  if (currentTabData) {
    if (tabName === 'summary') renderSummaryTab(currentTabData);
    else if (tabName === 'score') renderScoreTab(currentTabData);
    else if (tabName === 'headers') renderHeadersTab(currentTabData.headings);
    else if (tabName === 'images') renderImagesTab(currentTabData.images);
    else if (tabName === 'videos') renderVideosTab(currentTabData.videos);
    else if (tabName === 'links') renderLinksTab(currentTabData.links);
    else if (tabName === 'schema') renderSchemaTab(currentTabData.schema);
    else if (tabName === 'tools') renderToolsTab();
  }
}

/* ==========================================================================
   Data Extraction & Tab Interaction
   ========================================================================== */
async function loadActiveTabAndAnalyze(forceRefresh = false) {
  showLoadingState();

  const extApi = typeof browser !== 'undefined' && browser.tabs ? browser : (typeof chrome !== 'undefined' && chrome.tabs ? chrome : null);
  const isExtensionContext = Boolean(extApi && extApi.tabs?.query);

  if (!isExtensionContext) {
    showRestrictedState('Browser extension context required. Please open SEOscoper from the toolbar while on any live webpage to audit.');
    return;
  }

  try {
    const tabs = await extApi.tabs.query({ active: true, currentWindow: true });
    if (!tabs || !tabs[0]) {
      showRestrictedState('No active webpage detected. Please select a webpage tab and open SEOscoper.');
      return;
    }

    const tab = tabs[0];
    currentTabId = tab.id;
    currentTabUrl = tab.url || '';

    updateHeaderPageInfo(tab);

    // Check for restricted browser/internal pages
    if (isRestrictedUrl(currentTabUrl)) {
      showRestrictedState('SEOscoper cannot analyze internal browser pages (such as about:, addons.mozilla.org, chrome://, or PDF viewers). Please open any live webpage (e.g. easyprotools.com).');
      return;
    }

    // Direct live in-page DOM extraction via scripting.executeScript
    if (extApi.scripting?.executeScript) {
      try {
        const results = await extApi.scripting.executeScript({
          target: { tabId: tab.id },
          func: extractLivePageSEOData
        });

        if (results && results[0] && results[0].result) {
          handleDataLoaded(results[0].result);
          return;
        }
      } catch (scriptErr) {
        console.warn('[SEOscoper Firefox] Direct script execution error, attempting content script fallback:', scriptErr);
      }
    }

    // Fallback: Attempt content script communication
    fetchSEODataFromContentScript(tab.id, forceRefresh);

  } catch (err) {
    console.error('[SEOscoper Firefox] Tab query error:', err);
    showRestrictedState('Failed to inspect current tab: ' + (err.message || 'Unknown error'));
  }
}

function isRestrictedUrl(url) {
  if (!url) return true;
  return (
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://') ||
    url.startsWith('moz-extension://') ||
    url.startsWith('resource://') ||
    url.startsWith('edge://') ||
    url.startsWith('about:') ||
    url.startsWith('view-source:') ||
    url.includes('chrome.google.com/webstore') ||
    url.includes('chromewebstore.google.com') ||
    url.includes('addons.mozilla.org')
  );
}

function updateHeaderPageInfo(tab) {
  const domainEl = document.getElementById('header-domain');
  const faviconEl = document.getElementById('header-favicon');

  if (domainEl) {
    try {
      const urlObj = new URL(tab.url);
      domainEl.textContent = `${urlObj.hostname}${urlObj.pathname !== '/' ? urlObj.pathname : ''}`;
      domainEl.title = tab.url;
    } catch (e) {
      domainEl.textContent = tab.url || 'Active Page';
    }
  }

  if (faviconEl) {
    faviconEl.src = tab.favIconUrl || 'icons/icon16.png';
  }
}

function fetchSEODataFromContentScript(tabId, forceRefresh = false) {
  const extApi = typeof browser !== 'undefined' && browser.tabs ? browser : (typeof chrome !== 'undefined' && chrome.tabs ? chrome : null);
  if (!extApi || !extApi.tabs?.sendMessage) {
    showRestrictedState('Browser extension messaging API unavailable.');
    return;
  }

  extApi.tabs.sendMessage(tabId, { action: 'EXTRACT_SEO_DATA' }, (response) => {
    const hasLastError = typeof chrome !== 'undefined' && chrome.runtime?.lastError;
    if (hasLastError || !response || !response.success) {
      // Content script might not be injected yet into this tab. Attempt programmatic injection!
      if (extApi.scripting?.executeScript) {
        extApi.scripting.executeScript({
          target: { tabId },
          files: ['content.js']
        }, () => {
          setTimeout(() => {
            extApi.tabs.sendMessage(tabId, { action: 'EXTRACT_SEO_DATA' }, (retryResponse) => {
              if (retryResponse && retryResponse.success && retryResponse.data) {
                handleDataLoaded(retryResponse.data);
              } else {
                showRestrictedState('Unable to extract live SEO data from this page. Please refresh the page and try again.');
              }
            });
          }, 120);
        });
      } else {
        showRestrictedState('Unable to extract live SEO data from this page. Please refresh the page and try again.');
      }
      return;
    }

    if (response.data) {
      handleDataLoaded(response.data);
    }
  });
}

function handleDataLoaded(data) {
  currentTabData = data;
  hideLoadingState();

  // Always pre-render Summary and Score data
  renderSummaryTab(data);
  renderScoreTab(data);

  // Render the currently active tab if not summary
  if (activeTabName === 'score') renderScoreTab(data);
  else if (activeTabName === 'headers') renderHeadersTab(data.headings);
  else if (activeTabName === 'images') renderImagesTab(data.images);
  else if (activeTabName === 'videos') renderVideosTab(data.videos);
  else if (activeTabName === 'links') renderLinksTab(data.links);
  else if (activeTabName === 'schema') renderSchemaTab(data.schema);
  else if (activeTabName === 'tools') renderToolsTab();
}

function showLoadingState() {
  const loading = document.getElementById('loading-state');
  if (loading) loading.classList.remove('hidden');
  const restricted = document.getElementById('restricted-state');
  if (restricted) restricted.classList.add('hidden');
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
}

function hideLoadingState() {
  const loading = document.getElementById('loading-state');
  if (loading) loading.classList.add('hidden');
  const restricted = document.getElementById('restricted-state');
  if (restricted) restricted.classList.add('hidden');
  document.querySelectorAll('.tab-pane').forEach(pane => {
    if (pane.id === `pane-${activeTabName}`) {
      pane.classList.remove('hidden');
      pane.classList.add('active');
    }
  });
}

function showRestrictedState(reason) {
  const loading = document.getElementById('loading-state');
  if (loading) loading.classList.add('hidden');
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
  const restrictedState = document.getElementById('restricted-state');
  if (restrictedState) restrictedState.classList.remove('hidden');
  const reasonEl = document.getElementById('restricted-reason');
  if (reason && reasonEl) {
    reasonEl.textContent = reason;
  }
}

/* ==========================================================================
   TAB 1: Summary Tab
   ========================================================================== */
function renderSummaryTab(data) {
  if (!data) return;

  // 1. Populate Metadata Fields
  // Meta Title
  const title = (data.title || '').trim();
  const titleLen = title.length;
  const titleWidth = data.titlePixelWidth || Math.round(titleLen * 9.6);
  const valTitleEl = document.getElementById('val-meta-title');
  if (valTitleEl) valTitleEl.textContent = title || 'Not found';

  const titleBadges = document.getElementById('title-badges');
  if (titleBadges) {
    titleBadges.innerHTML = '';
    if (!title) {
      titleBadges.innerHTML = `<span class="badge badge-danger">Missing</span>`;
    } else {
      const isOptimal = titleLen >= 30 && titleLen <= 60;
      titleBadges.innerHTML = `
        <span class="badge ${isOptimal ? 'badge-success' : 'badge-warn'} font-mono">${titleLen}/60 chars</span>
        <span class="badge badge-info font-mono">~${titleWidth}px / 580px</span>
      `;
    }
  }

  // Meta Description
  const desc = (data.description || '').trim();
  const descLen = desc.length;
  const valDescEl = document.getElementById('val-meta-desc');
  if (valDescEl) valDescEl.textContent = desc || 'Not found';

  const descBadges = document.getElementById('desc-badges');
  if (descBadges) {
    descBadges.innerHTML = '';
    if (!desc) {
      descBadges.innerHTML = `<span class="badge badge-danger">Missing</span>`;
    } else {
      const isOptimal = descLen >= 70 && descLen <= 160;
      descBadges.innerHTML = `<span class="badge ${isOptimal ? 'badge-success' : 'badge-warn'} font-mono">${descLen}/160 chars</span>`;
    }
  }

  // Meta Keywords Row (Positioned immediately after Meta Description)
  const rawKeywords = (data.keywords || '').trim();
  const valKeywordsEl = document.getElementById('val-keywords');
  const keywordsBadgesEl = document.getElementById('keywords-badges');
  const keywordsPillsEl = document.getElementById('keywords-pills');

  if (rawKeywords) {
    if (valKeywordsEl) valKeywordsEl.textContent = rawKeywords;
    const kwList = rawKeywords.split(/,\s*/).map(k => k.trim()).filter(Boolean);
    if (keywordsBadgesEl) {
      keywordsBadgesEl.innerHTML = `<span class="badge badge-info font-mono">${kwList.length} keyword${kwList.length === 1 ? '' : 's'}</span>`;
    }
    if (keywordsPillsEl) {
      keywordsPillsEl.innerHTML = kwList.map(kw => `
        <span class="badge font-mono" data-copy-text="${escapeHtml(kw)}" title="Click to copy: ${escapeHtml(kw)}" style="cursor: pointer;">
          ${escapeHtml(kw)}
        </span>
      `).join('');
    }
  } else {
    if (valKeywordsEl) valKeywordsEl.textContent = 'Keywords not found';
    if (keywordsBadgesEl) {
      keywordsBadgesEl.innerHTML = `<span class="badge badge-warn">Keywords not found</span>`;
    }
    if (keywordsPillsEl) keywordsPillsEl.innerHTML = '';
  }

  // URL & Canonical
  const valUrlEl = document.getElementById('val-url');
  if (valUrlEl) valUrlEl.textContent = data.url || '-';

  const canonical = data.canonical || '';
  const canonicalEl = document.getElementById('val-canonical');
  const canonicalBadges = document.getElementById('canonical-badges');
  const extraCanonical = document.getElementById('extra-canonical');

  if (canonicalEl) canonicalEl.textContent = canonical || 'No canonical tag found';
  if (canonicalBadges) canonicalBadges.innerHTML = '';
  if (extraCanonical) extraCanonical.innerHTML = '';

  if (canonicalBadges) {
    if (!canonical) {
      canonicalBadges.innerHTML = `<span class="badge badge-warn">Missing</span>`;
    } else if (data.canonicalMatch) {
      canonicalBadges.innerHTML = `<span class="badge badge-success">Self-Canonical</span>`;
    } else {
      canonicalBadges.innerHTML = `<span class="badge badge-warn">Different URL</span>`;
      if (extraCanonical) extraCanonical.textContent = `Points to: ${canonical}`;
    }
  }

  // Robots Tags
  const robots = data.robots || '';
  const valRobotsEl = document.getElementById('val-robots');
  if (valRobotsEl) valRobotsEl.textContent = robots || 'Not specified (index, follow by default)';
  const robotsPills = document.getElementById('robots-pills');
  if (robotsPills) {
    robotsPills.innerHTML = '';
    if (robots) {
      const tokens = robots.toLowerCase().split(/,\s*/);
      tokens.forEach(t => {
        const isBad = ['noindex', 'nofollow', 'noarchive', 'nosnippet'].includes(t);
        robotsPills.innerHTML += `<span class="badge ${isBad ? 'badge-danger' : 'badge-success'}">${t}</span>`;
      });
    }
  }

  // Googlebot
  const valGooglebotEl = document.getElementById('val-googlebot');
  if (valGooglebotEl) valGooglebotEl.textContent = data.googlebot || 'None specified';

  // Language, Charset, Viewport
  const valLangEl = document.getElementById('val-lang');
  if (valLangEl) valLangEl.textContent = data.lang || 'Not specified';
  const valCharsetEl = document.getElementById('val-charset');
  if (valCharsetEl) valCharsetEl.textContent = data.charset || 'UTF-8';

  const viewport = data.viewport || '';
  const valViewportEl = document.getElementById('val-viewport');
  if (valViewportEl) valViewportEl.textContent = viewport || 'Not specified';
  const viewportBadges = document.getElementById('viewport-badges');
  if (viewportBadges) {
    if (viewport && viewport.includes('width=device-width')) {
      viewportBadges.innerHTML = `<span class="badge badge-success">Mobile Friendly</span>`;
    } else {
      viewportBadges.innerHTML = `<span class="badge badge-warn">Non-Responsive</span>`;
    }
  }

  // Author & Publisher
  const valAuthorEl = document.getElementById('val-author');
  if (valAuthorEl) valAuthorEl.textContent = data.author || 'Not specified';
  const valPubEl = document.getElementById('val-publisher');
  if (valPubEl) valPubEl.textContent = data.publisher || 'Not specified';

  // Word count & Page load time
  const valWordCountEl = document.getElementById('val-word-count');
  if (valWordCountEl) valWordCountEl.textContent = `${(data.wordCount || 0).toLocaleString()} words`;
  const valLoadTimeEl = document.getElementById('val-load-time');
  if (valLoadTimeEl) valLoadTimeEl.textContent = data.loadTimeMs ? `${data.loadTimeMs} ms` : 'Cached / Fast';

  // Robots.txt & Sitemap links
  const robotsLink = document.getElementById('link-robots-txt');
  const sitemapLink = document.getElementById('link-sitemap-xml');
  if (robotsLink) robotsLink.href = data.robotsUrl || (data.origin ? `${data.origin}/robots.txt` : '#');
  if (sitemapLink) sitemapLink.href = data.sitemapUrl || (data.origin ? `${data.origin}/sitemap.xml` : '#');

  // Published & Modified
  const valPubDateEl = document.getElementById('val-published-date');
  if (valPubDateEl) valPubDateEl.textContent = data.publishedDate || 'Not detected';
  const valModDateEl = document.getElementById('val-modified-date');
  if (valModDateEl) valModDateEl.textContent = data.modifiedDate || 'Not detected';

  // Hreflang Tags
  const hreflangCount = data.hreflangTags?.length || 0;
  const hrefBadge = document.getElementById('hreflang-count-badge');
  if (hrefBadge) hrefBadge.textContent = hreflangCount;
  const hreflangList = document.getElementById('hreflang-list');
  if (hreflangList) {
    if (hreflangCount > 0) {
      hreflangList.innerHTML = data.hreflangTags.map(h => `
        <div class="date-row" style="margin-bottom: 4px;">
          <span class="badge badge-info">${escapeHtml(h.lang)}</span>
          <a href="${escapeHtml(h.href)}" target="_blank" class="link-btn font-mono" style="font-size: 11px;">${escapeHtml(h.href)}</a>
        </div>
      `).join('');
    } else {
      hreflangList.innerHTML = '<span class="empty-desc">No alternate hreflang links declared.</span>';
    }
  }

  // Open Graph Tags
  const og = data.og || {};
  const ogEntries = Object.entries(og).filter(([_, v]) => Boolean(v));
  const ogBadge = document.getElementById('og-count-badge');
  if (ogBadge) ogBadge.textContent = ogEntries.length;
  const ogContent = document.getElementById('og-content');
  if (ogContent) {
    if (ogEntries.length > 0) {
      ogContent.innerHTML = ogEntries.map(([k, v]) => `
        <div class="date-row" style="margin-bottom: 5px;">
          <span class="font-mono text-muted" style="font-size: 11px;">og:${k}</span>
          <span class="font-mono" style="font-size: 11.5px; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(v)}</span>
        </div>
      `).join('');
    } else {
      ogContent.innerHTML = '<span class="empty-desc">No Open Graph tags detected on this page.</span>';
    }
  }

  // Twitter Tags
  const twitter = data.twitter || {};
  const twitterEntries = Object.entries(twitter).filter(([_, v]) => Boolean(v));
  const twBadge = document.getElementById('twitter-count-badge');
  if (twBadge) twBadge.textContent = twitterEntries.length;
  const twitterContent = document.getElementById('twitter-content');
  if (twitterContent) {
    if (twitterEntries.length > 0) {
      twitterContent.innerHTML = twitterEntries.map(([k, v]) => `
        <div class="date-row" style="margin-bottom: 5px;">
          <span class="font-mono text-muted" style="font-size: 11px;">twitter:${k}</span>
          <span class="font-mono" style="font-size: 11.5px; max-width: 250px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(v)}</span>
        </div>
      `).join('');
    } else {
      twitterContent.innerHTML = '<span class="empty-desc">No Twitter Card meta tags detected.</span>';
    }
  }

  // 2. Compact Bottom Score Card (Summary Tab)
  const { score, statusText, statusClass, issues } = calculateSEOScore(data);
  const sumRing = document.getElementById('summary-score-ring-fill');
  const sumNum = document.getElementById('summary-score-num');
  const sumBadge = document.getElementById('summary-score-badge');
  const sumBrief = document.getElementById('summary-issues-brief');
  const btnViewScore = document.getElementById('btn-view-score-tab');

  if (sumRing) {
    const strokeDash = 264;
    const offset = strokeDash - (strokeDash * score) / 100;
    sumRing.style.strokeDashoffset = offset;
    if (score >= 80) sumRing.style.stroke = 'var(--status-good)';
    else if (score >= 50) sumRing.style.stroke = 'var(--status-warn)';
    else sumRing.style.stroke = 'var(--status-error)';
  }
  if (sumNum) animateCounter(sumNum, 0, score, 600);
  if (sumBadge) {
    sumBadge.textContent = `${statusText} (${score}/100)`;
    sumBadge.className = `score-status-badge badge-${statusClass}`;
  }
  if (sumBrief) {
    sumBrief.textContent = `${issues.length} issue${issues.length === 1 ? '' : 's'} found`;
  }
  if (btnViewScore) {
    btnViewScore.onclick = () => switchTab('score');
  }

  // Copy Buttons on Summary fields
  setupCopyButtons();
}

/**
 * Deterministic SEO Scoring Model (0-100) across 10 Core On-Page Ranking Factors
 */
function calculateSEOScore(data) {
  let score = 0;
  const issues = [];
  const factors = [];

  // Factor 1: Title Tag (+15)
  const title = (data.title || '').trim();
  let titlePts = 0;
  let titleStatus = 'error';
  let titleDetail = 'Missing <title> tag on page.';
  if (!title) {
    issues.push({ level: 'error', title: 'Missing Title Tag', tip: 'Add a descriptive <title> tag between 30 and 60 characters.' });
  } else if (title.length < 30) {
    titlePts = 8;
    titleStatus = 'warn';
    titleDetail = `Short (${title.length} chars). Aim for 30-60 characters.`;
    issues.push({ level: 'warning', title: 'Meta Title Too Short', tip: `Title is only ${title.length} characters. Aim for 30-60 characters for maximum SERP impact.` });
  } else if (title.length > 60) {
    titlePts = 10;
    titleStatus = 'warn';
    titleDetail = `Long (${title.length} chars). May truncate in Google SERP.`;
    issues.push({ level: 'warning', title: 'Meta Title Over 60 Characters', tip: `Title length (${title.length} chars) may be truncated on Google desktop search results.` });
  } else {
    titlePts = 15;
    titleStatus = 'good';
    titleDetail = `Optimal length (${title.length} characters, within 60 chars / ~580px).`;
  }
  score += titlePts;
  factors.push({ id: 'title', name: 'Meta Title Tag', maxPoints: 15, points: titlePts, status: titleStatus, detail: titleDetail });

  // Factor 2: Meta Description (+15)
  const desc = (data.description || '').trim();
  let descPts = 0;
  let descStatus = 'error';
  let descDetail = 'Missing meta description tag.';
  if (!desc) {
    issues.push({ level: 'error', title: 'Missing Meta Description', tip: 'Add a compelling meta description between 70 and 160 characters to improve click-through rates.' });
  } else if (desc.length < 70) {
    descPts = 8;
    descStatus = 'warn';
    descDetail = `Short (${desc.length} chars). Recommended range: 70-160 characters.`;
    issues.push({ level: 'warning', title: 'Meta Description Short', tip: `Description is ${desc.length} characters. Aim for 70-160 characters.` });
  } else if (desc.length > 160) {
    descPts = 10;
    descStatus = 'warn';
    descDetail = `Long (${desc.length} chars). May be clipped in search snippets.`;
    issues.push({ level: 'warning', title: 'Meta Description Long', tip: `Description is ${desc.length} characters and may be clipped in search snippets.` });
  } else {
    descPts = 15;
    descStatus = 'good';
    descDetail = `Ideal length (${desc.length} characters, full SERP snippet display).`;
  }
  score += descPts;
  factors.push({ id: 'description', name: 'Meta Description', maxPoints: 15, points: descPts, status: descStatus, detail: descDetail });

  // Factor 3: Heading H1 (+15)
  const h1Count = data.headings?.counts?.h1 || 0;
  let h1Pts = 0;
  let h1Status = 'error';
  let h1Detail = 'No <h1> tag detected on page.';
  if (h1Count === 0) {
    issues.push({ level: 'error', title: 'Missing H1 Heading', tip: 'Every page should have exactly one main <h1> heading defining its core topic.' });
  } else if (h1Count > 1) {
    h1Pts = 8;
    h1Status = 'warn';
    h1Detail = `Multiple (${h1Count}) H1 headings detected. Only 1 is recommended.`;
    issues.push({ level: 'warning', title: `Multiple H1 Headings (${h1Count})`, tip: 'Having more than one <h1> can dilute topical focus. Consider using <h2> for secondary sub-topics.' });
  } else {
    h1Pts = 15;
    h1Status = 'good';
    h1Detail = 'Exactly one clean <h1> heading established.';
  }
  score += h1Pts;
  factors.push({ id: 'h1', name: 'H1 Heading Structure', maxPoints: 15, points: h1Pts, status: h1Status, detail: h1Detail });

  // Factor 4: Canonical Tag (+10)
  let canonicalPts = 0;
  let canonicalStatus = 'error';
  let canonicalDetail = 'Missing rel="canonical" link element.';
  if (!data.canonical) {
    canonicalPts = 2;
    canonicalStatus = 'warn';
    issues.push({ level: 'warning', title: 'Missing Canonical Link', tip: 'Declare a rel="canonical" link to prevent duplicate content indexing issues.' });
  } else if (data.canonicalMatch) {
    canonicalPts = 10;
    canonicalStatus = 'good';
    canonicalDetail = 'Self-referencing canonical URL properly declared.';
  } else {
    canonicalPts = 8;
    canonicalStatus = 'warn';
    canonicalDetail = 'Canonical points to alternate URL.';
  }
  score += canonicalPts;
  factors.push({ id: 'canonical', name: 'Canonical Tag', maxPoints: 10, points: canonicalPts, status: canonicalStatus, detail: canonicalDetail });

  // Factor 5: Image Alt Text (+10)
  const imgTotal = data.images?.total || 0;
  const imgWithAlt = data.images?.withAlt || 0;
  const imgNoAlt = data.images?.withoutAlt || 0;
  let imgPts = 0;
  let imgStatus = 'good';
  let imgDetail = 'All images have alt text specified.';
  if (imgTotal === 0) {
    imgPts = 10;
    imgDetail = 'No images on page or all decorative.';
  } else if (imgNoAlt === 0) {
    imgPts = 10;
    imgDetail = `All ${imgTotal} images include valid alt attributes.`;
  } else {
    const ratio = (imgWithAlt / imgTotal);
    imgPts = Math.round(ratio * 10);
    imgStatus = imgNoAlt > (imgTotal / 2) ? 'error' : 'warn';
    imgDetail = `${imgNoAlt} of ${imgTotal} images missing alt text description.`;
    issues.push({ level: 'warning', title: `${imgNoAlt} Images Missing Alt Text`, tip: 'Add descriptive alt text to all informative images for accessibility and image search.' });
  }
  score += imgPts;
  factors.push({ id: 'images', name: 'Image Alt Coverage', maxPoints: 10, points: imgPts, status: imgStatus, detail: imgDetail });

  // Factor 6: Open Graph Social Tags (+10)
  const og = data.og || {};
  let ogPts = 0;
  let ogStatus = 'warn';
  let ogDetail = 'No Open Graph tags detected.';
  if (og.title && og.image) {
    ogPts = 10;
    ogStatus = 'good';
    ogDetail = 'Complete social sharing cards (og:title, og:image present).';
  } else if (og.title || og.image) {
    ogPts = 5;
    ogStatus = 'warn';
    ogDetail = 'Partial Open Graph tags declared.';
    issues.push({ level: 'warning', title: 'Incomplete Open Graph Tags', tip: 'Add og:title, og:description, and og:image for rich social sharing cards.' });
  } else {
    issues.push({ level: 'info', title: 'No Open Graph Meta Tags', tip: 'Social media networks won\'t display rich preview cards when your link is shared.' });
  }
  score += ogPts;
  factors.push({ id: 'og', name: 'Open Graph (Social)', maxPoints: 10, points: ogPts, status: ogStatus, detail: ogDetail });

  // Factor 7: Language & Charset (+10)
  let lcPts = 0;
  let lcDetail = '';
  if (data.lang && data.lang !== 'No language specified') {
    lcPts += 5;
    lcDetail = `lang="${data.lang}"`;
  } else {
    issues.push({ level: 'warning', title: 'Missing HTML Lang Attribute', tip: 'Add lang="en" (or appropriate locale) to the root <html> tag.' });
  }
  if (data.charset) {
    lcPts += 5;
    lcDetail += lcDetail ? `, charset="${data.charset}"` : `charset="${data.charset}"`;
  }
  score += lcPts;
  factors.push({
    id: 'lang_charset',
    name: 'Language & Charset',
    maxPoints: 10,
    points: lcPts,
    status: lcPts === 10 ? 'good' : (lcPts > 0 ? 'warn' : 'error'),
    detail: lcDetail || 'Missing language and charset declarations.'
  });

  // Factor 8: Headings Hierarchy (+5)
  const skippedHeadings = data.headings?.warnings?.some(w => w.type === 'skipped_level');
  let htPts = 5;
  let htStatus = 'good';
  let htDetail = 'Logical heading levels without skipped depths.';
  if (skippedHeadings) {
    htPts = 2;
    htStatus = 'warn';
    htDetail = 'Skipped heading hierarchy levels found (e.g. H1 to H3).';
    issues.push({ level: 'warning', title: 'Skipped Heading Levels', tip: 'Avoid skipping levels (e.g. H1 directly jumping to H3) for clear structural semantics.' });
  }
  score += htPts;
  factors.push({ id: 'headings_tree', name: 'Heading Hierarchy', maxPoints: 5, points: htPts, status: htStatus, detail: htDetail });

  // Factor 9: Viewport / Mobile Friendly (+5)
  let vpPts = 0;
  let vpStatus = 'error';
  let vpDetail = 'No responsive viewport tag detected.';
  if (data.viewport && data.viewport.includes('width=device-width')) {
    vpPts = 5;
    vpStatus = 'good';
    vpDetail = 'Mobile viewport configured (width=device-width).';
  } else {
    issues.push({ level: 'error', title: 'Missing Responsive Viewport', tip: 'Ensure a <meta name="viewport" content="width=device-width, initial-scale=1"> tag exists.' });
  }
  score += vpPts;
  factors.push({ id: 'viewport', name: 'Mobile Viewport', maxPoints: 5, points: vpPts, status: vpStatus, detail: vpDetail });

  // Factor 10: Robots Meta Index (+5)
  const robotsStr = (data.robots || '').toLowerCase();
  let robPts = 5;
  let robStatus = 'good';
  let robDetail = 'Page is indexable by search engine crawlers.';
  if (robotsStr.includes('noindex')) {
    robPts = 0;
    robStatus = 'error';
    robDetail = 'Robots meta tag contains "noindex". Indexing blocked!';
    issues.push({ level: 'error', title: 'Robots Noindex Active', tip: 'Search engines are instructed NOT to index this page due to meta name="robots" content="noindex".' });
  }
  score += robPts;
  factors.push({ id: 'robots', name: 'Search Indexability', maxPoints: 5, points: robPts, status: robStatus, detail: robDetail });

  // Bound score
  score = Math.max(0, Math.min(100, score));

  let statusText = 'Excellent';
  let statusClass = 'success';
  if (score < 50) {
    statusText = 'Needs Attention';
    statusClass = 'danger';
  } else if (score < 80) {
    statusText = 'Good';
    statusClass = 'warn';
  }

  // Sort issues: error first, warning second, info third
  const severityOrder = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => (severityOrder[a.level] ?? 3) - (severityOrder[b.level] ?? 3));

  return { score, statusText, statusClass, issues, factors };
}

/* ==========================================================================
   TAB 2: Dedicated SEO Score Tab
   ========================================================================== */
function renderScoreTab(data) {
  if (!data) return;

  const { score, statusText, statusClass, issues, factors } = calculateSEOScore(data);

  // Large Hero Score Ring
  const scoreRing = document.getElementById('score-ring-fill');
  const scoreNumEl = document.getElementById('score-val');
  const badgeEl = document.getElementById('score-status-badge');
  const captionEl = document.getElementById('score-caption');

  if (scoreRing) {
    const strokeDash = 264;
    const offset = strokeDash - (strokeDash * score) / 100;
    scoreRing.style.strokeDashoffset = offset;
    if (score >= 80) scoreRing.style.stroke = 'var(--status-good)';
    else if (score >= 50) scoreRing.style.stroke = 'var(--status-warn)';
    else scoreRing.style.stroke = 'var(--status-error)';
  }

  if (scoreNumEl) animateCounter(scoreNumEl, 0, score, 700);
  if (badgeEl) {
    badgeEl.textContent = `${statusText} (${score}/100)`;
    badgeEl.className = `score-status-badge badge-${statusClass}`;
  }
  if (captionEl) {
    captionEl.textContent = issues.length === 0
      ? 'All key on-page SEO parameters look well-optimized!'
      : `${issues.length} item${issues.length === 1 ? '' : 's'} require your attention to improve rankability.`;
  }

  // Render Factor Breakdown List
  const factorsListEl = document.getElementById('score-factors-list');
  if (factorsListEl) {
    factorsListEl.innerHTML = factors.map(f => {
      const icon = f.status === 'good' ? '✓' : (f.status === 'warn' ? '⚠' : '✕');
      return `
        <div class="factor-row">
          <div class="factor-left">
            <span class="factor-status-icon ${f.status}">${icon}</span>
            <div class="factor-name-wrap">
              <span class="factor-name">${escapeHtml(f.name)}</span>
              <span class="factor-detail">${escapeHtml(f.detail)}</span>
            </div>
          </div>
          <span class="factor-points-badge badge-${f.status === 'good' ? 'success' : (f.status === 'warn' ? 'warn' : 'danger')} font-mono">
            ${f.points}/${f.maxPoints} pts
          </span>
        </div>
      `;
    }).join('');
  }

  // Render Prioritized Action Plan / Issues List
  const countBadgeEl = document.getElementById('score-issues-count-badge');
  const issuesListEl = document.getElementById('score-issues-list');

  if (countBadgeEl) {
    countBadgeEl.textContent = `${issues.length} Issue${issues.length === 1 ? '' : 's'}`;
    countBadgeEl.className = `badge ${issues.length === 0 ? 'badge-success' : 'badge-danger'}`;
  }

  if (issuesListEl) {
    if (issues.length === 0) {
      issuesListEl.innerHTML = `
        <div class="issue-item good">
          <span class="toast-icon">✓</span>
          <div class="issue-text-wrap">
            <div class="issue-title">All primary technical checks passed!</div>
            <div class="issue-tip">Meta tags, headings, canonical directive, and image alt attributes meet on-page standards.</div>
          </div>
        </div>
      `;
    } else {
      issuesListEl.innerHTML = issues.map(issue => `
        <div class="issue-item ${issue.level}">
          <span class="issue-icon">${issue.level === 'error' ? '✕' : (issue.level === 'warning' ? '⚠' : 'ℹ')}</span>
          <div class="issue-text-wrap">
            <div class="issue-title">${escapeHtml(issue.title)}</div>
            <div class="issue-tip">${escapeHtml(issue.tip)}</div>
          </div>
        </div>
      `).join('');
    }
  }
}

/* ==========================================================================
   TAB 2: Headers Tab
   ========================================================================== */
function renderHeadersTab(headingsData) {
  if (!headingsData) return;

  // Stat Counters
  const counts = headingsData.counts || {};
  animateCounter(document.getElementById('stat-head-total'), 0, headingsData.total || 0);
  animateCounter(document.getElementById('stat-head-h1'), 0, counts.h1 || 0);
  animateCounter(document.getElementById('stat-head-h2'), 0, counts.h2 || 0);
  animateCounter(document.getElementById('stat-head-h3'), 0, counts.h3 || 0);
  animateCounter(document.getElementById('stat-head-h4'), 0, counts.h4 || 0);
  animateCounter(document.getElementById('stat-head-h5'), 0, counts.h5 || 0);
  animateCounter(document.getElementById('stat-head-h6'), 0, counts.h6 || 0);

  // Warnings
  const warningsContainer = document.getElementById('headers-warnings-container');
  const warnings = headingsData.warnings || [];
  if (warnings.length > 0) {
    warningsContainer.classList.remove('hidden');
    warningsContainer.innerHTML = warnings.map(w => `
      <div class="warning-item ${w.level}">
        <span>${w.level === 'danger' ? '✕' : '⚠'}</span>
        <span>${escapeHtml(w.message)}</span>
      </div>
    `).join('');
  } else {
    warningsContainer.classList.add('hidden');
  }

  // Filter Chips and Search Listeners
  initHeadersControls(headingsData);
  filterAndRenderHeadingsList(headingsData);
}

function initHeadersControls(headingsData) {
  const chips = document.querySelectorAll('#heading-filter-chips .chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      listStates.headers.filter = chip.dataset.filter;
      filterAndRenderHeadingsList(headingsData);
    };
  });

  const searchInput = document.getElementById('input-search-headers');
  searchInput.oninput = (e) => {
    listStates.headers.search = e.target.value.toLowerCase().trim();
    filterAndRenderHeadingsList(headingsData);
  };
}

function filterAndRenderHeadingsList(headingsData) {
  const listEl = document.getElementById('headings-tree-list');
  const countIndicator = document.getElementById('headers-count-indicator');
  const { filter, search } = listStates.headers;

  let filtered = headingsData.list || [];

  if (filter !== 'all') {
    filtered = filtered.filter(h => h.tag === filter);
  }

  if (search) {
    filtered = filtered.filter(h => h.text.toLowerCase().includes(search));
  }

  countIndicator.textContent = `Showing ${filtered.length} of ${headingsData.total || 0} headings`;

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-desc" style="text-align: center; padding: 24px 0;">No headings match your filter.</div>';
    return;
  }

  listEl.innerHTML = filtered.map(h => `
    <div class="heading-tree-row" data-level="${h.level}">
      <span class="heading-tag-pill">&lt;${h.tag.toUpperCase()}&gt;</span>
      <span class="heading-text" title="${escapeHtml(h.text)}">${escapeHtml(h.text)}</span>
      <div class="heading-actions">
        <span class="badge font-mono" style="font-size: 10px;">${h.length}c</span>
        <button class="locate-btn" data-heading-index="${h.index}" title="Scroll and highlight heading on page">Locate</button>
        <button class="copy-btn" data-copy-text="${escapeHtml(h.text)}" title="Copy heading text">
          <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Attach Locate button listeners
  listEl.querySelectorAll('.locate-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.headingIndex, 10);
      highlightElementOnPage('heading', index);
      showToast('Heading highlighted on webpage!');
    });
  });

  setupCopyButtons(listEl);
}

/* ==========================================================================
   TAB 3: Images Tab
   ========================================================================== */
function renderImagesTab(imagesData) {
  if (!imagesData) return;

  // Stat Counters
  animateCounter(document.getElementById('stat-img-total'), 0, imagesData.total || 0);
  animateCounter(document.getElementById('stat-img-alt'), 0, imagesData.withAlt || 0);
  animateCounter(document.getElementById('stat-img-noalt'), 0, imagesData.withoutAlt || 0);
  animateCounter(document.getElementById('stat-img-emptyalt'), 0, imagesData.emptyAlt || 0);
  animateCounter(document.getElementById('stat-img-title'), 0, imagesData.withTitle || 0);
  animateCounter(document.getElementById('stat-img-notitle'), 0, imagesData.withoutTitle || 0);
  animateCounter(document.getElementById('stat-img-lazy'), 0, imagesData.lazyLoaded || 0);

  const totalKb = Math.round((imagesData.totalEstimatedSize || 0) / 1024);
  document.getElementById('stat-img-size').textContent = totalKb > 1024 ? `${(totalKb / 1024).toFixed(1)} MB` : `${totalKb} KB`;

  initImagesControls(imagesData);
  filterAndRenderImagesList(imagesData);
}

function initImagesControls(imagesData) {
  const chips = document.querySelectorAll('#images-filter-chips .chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      listStates.images.filter = chip.dataset.filter;
      listStates.images.page = 1;
      filterAndRenderImagesList(imagesData);
    };
  });

  const searchInput = document.getElementById('input-search-images');
  searchInput.oninput = (e) => {
    listStates.images.search = e.target.value.toLowerCase().trim();
    listStates.images.page = 1;
    filterAndRenderImagesList(imagesData);
  };

  const loadMoreBtn = document.getElementById('btn-images-load-more');
  loadMoreBtn.onclick = () => {
    listStates.images.page++;
    filterAndRenderImagesList(imagesData, true);
  };
}

function filterAndRenderImagesList(imagesData, append = false) {
  const listEl = document.getElementById('images-items-list');
  const countIndicator = document.getElementById('images-count-indicator');
  const paginationWrap = document.getElementById('images-pagination');
  const { filter, search, page, pageSize } = listStates.images;

  let filtered = imagesData.list || [];

  // Filter conditions
  if (filter === 'missing-alt') {
    filtered = filtered.filter(img => !img.hasAltAttr || (!img.hasAltText && !img.isDecorative));
  } else if (filter === 'empty-alt') {
    filtered = filtered.filter(img => img.isDecorative);
  } else if (filter === 'missing-title') {
    filtered = filtered.filter(img => !img.title);
  } else if (filter === 'lazy') {
    filtered = filtered.filter(img => img.loading === 'lazy');
  } else if (['jpg', 'png', 'webp', 'svg', 'avif', 'gif'].includes(filter)) {
    filtered = filtered.filter(img => img.format === filter || (filter === 'jpg' && img.format === 'jpeg'));
  }

  // Search filter
  if (search) {
    filtered = filtered.filter(img => {
      const alt = (img.alt || '').toLowerCase();
      const title = (img.title || '').toLowerCase();
      const src = img.src.toLowerCase();
      return alt.includes(search) || title.includes(search) || src.includes(search);
    });
  }

  countIndicator.textContent = `Showing ${Math.min(page * pageSize, filtered.length)} of ${filtered.length} images`;

  const paginatedItems = filtered.slice(0, page * pageSize);

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-desc" style="text-align: center; padding: 24px 0;">No images match your filter.</div>';
    paginationWrap.classList.add('hidden');
    return;
  }

  const itemsHtml = paginatedItems.map(img => {
    const fileName = getFilenameFromUrl(img.src);
    const sizeStr = img.fileSize ? `${Math.round(img.fileSize / 1024)} KB` : '';
    const dimStr = img.naturalWidth && img.naturalHeight ? `${img.naturalWidth}×${img.naturalHeight}px` : '';

    return `
      <div class="media-item-card" data-img-index="${img.index}">
        <div class="media-thumb-wrap" data-preview-src="${escapeHtml(img.src)}" data-preview-type="image" data-preview-title="${escapeHtml(img.alt || fileName)}">
          <img src="${escapeHtml(img.src)}" class="media-thumb" loading="lazy" alt="" onerror="this.src='icons/icon48.png'">
        </div>
        <div class="media-info">
          <div class="media-header-row">
            <span class="media-title" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</span>
            <div class="media-badges">
              <span class="badge font-mono" style="text-transform: uppercase;">${escapeHtml(img.format || 'img')}</span>
              ${img.loading === 'lazy' ? '<span class="badge badge-info">Lazy</span>' : ''}
            </div>
          </div>

          <!-- Alt text badge & copy -->
          <div class="media-subtext">
            <span>Alt:</span>
            ${img.hasAltText
              ? `<span class="badge badge-success font-mono" title="${escapeHtml(img.alt)}">${escapeHtml(img.alt.slice(0, 30))}${img.alt.length > 30 ? '...' : ''}</span>`
              : (img.isDecorative
                  ? `<span class="badge font-mono">Empty (Decorative)</span>`
                  : `<span class="badge badge-danger">Missing Alt</span>`
                )
            }
            ${img.alt ? `
              <button class="copy-btn" data-copy-text="${escapeHtml(img.alt)}" title="Copy Alt Text">
                <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              </button>
            ` : ''}
          </div>

          <!-- Dimensions & file size -->
          <div class="media-subtext font-mono" style="font-size: 10.5px;">
            <span>${dimStr || 'Rendered'}</span>
            ${sizeStr ? `<span>• ${sizeStr}</span>` : ''}
          </div>

          <!-- Actions Row -->
          <div class="media-actions">
            <button class="btn btn-secondary btn-xs btn-img-download" data-src="${escapeHtml(img.src)}" data-filename="${escapeHtml(fileName)}">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              <span>Download</span>
            </button>
            <button class="btn btn-secondary btn-xs btn-img-preview" data-preview-src="${escapeHtml(img.src)}" data-preview-type="image" data-preview-title="${escapeHtml(fileName)}" data-dim="${dimStr}">
              <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/></svg>
              <span>Preview</span>
            </button>
            <button class="locate-btn btn-img-locate" data-img-index="${img.index}">Locate</button>
            <button class="copy-btn" data-copy-text="${escapeHtml(img.src)}" title="Copy Image URL">
              <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = itemsHtml;

  // Pagination toggle
  if (paginatedItems.length < filtered.length) {
    paginationWrap.classList.remove('hidden');
  } else {
    paginationWrap.classList.add('hidden');
  }

  // Attach event handlers
  attachMediaActions(listEl);
}

function attachMediaActions(container) {
  // Download single image
  container.querySelectorAll('.btn-img-download').forEach(btn => {
    btn.onclick = () => {
      const url = btn.dataset.src;
      const filename = btn.dataset.filename || 'image.jpg';
      chrome.runtime.sendMessage({ action: 'DOWNLOAD_IMAGE', url, filename }, (res) => {
        if (res && res.success) {
          showToast(`Downloading ${filename}`);
        } else {
          showToast('Could not initiate download.');
        }
      });
    };
  });

  // Preview button & thumbnail preview
  container.querySelectorAll('.btn-img-preview, .media-thumb-wrap').forEach(el => {
    el.onclick = () => {
      const src = el.dataset.previewSrc;
      const title = el.dataset.previewTitle || 'Image Preview';
      const dim = el.dataset.dim || '';
      openPreviewModal({ type: 'image', src, title, dim });
    };
  });

  // Locate on page
  container.querySelectorAll('.btn-img-locate').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.imgIndex, 10);
      highlightElementOnPage('image', index);
      showToast('Image highlighted on webpage!');
    };
  });

  setupCopyButtons(container);
}

/* ==========================================================================
   TAB 4: Videos Tab
   ========================================================================== */
function renderVideosTab(videosData) {
  if (!videosData) return;

  animateCounter(document.getElementById('stat-vid-total'), 0, videosData.total || 0);
  animateCounter(document.getElementById('stat-vid-embed'), 0, videosData.embedded || 0);
  animateCounter(document.getElementById('stat-vid-self'), 0, videosData.selfHosted || 0);
  animateCounter(document.getElementById('stat-vid-poster'), 0, videosData.withPoster || 0);
  animateCounter(document.getElementById('stat-vid-captions'), 0, videosData.withCaptions || 0);
  animateCounter(document.getElementById('stat-vid-autoplay'), 0, videosData.withAutoplay || 0);

  initVideosControls(videosData);
  filterAndRenderVideosList(videosData);
}

function initVideosControls(videosData) {
  const chips = document.querySelectorAll('#videos-filter-chips .chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      listStates.videos.filter = chip.dataset.filter;
      filterAndRenderVideosList(videosData);
    };
  });

  const searchInput = document.getElementById('input-search-videos');
  searchInput.oninput = (e) => {
    listStates.videos.search = e.target.value.toLowerCase().trim();
    filterAndRenderVideosList(videosData);
  };
}

function filterAndRenderVideosList(videosData) {
  const listEl = document.getElementById('videos-items-list');
  const countIndicator = document.getElementById('videos-count-indicator');
  const { filter, search } = listStates.videos;

  let filtered = videosData.list || [];

  if (filter === 'embedded') filtered = filtered.filter(v => v.type === 'embedded');
  else if (filter === 'self-hosted') filtered = filtered.filter(v => v.type === 'self-hosted');
  else if (filter === 'poster') filtered = filtered.filter(v => Boolean(v.poster));
  else if (filter === 'autoplay') filtered = filtered.filter(v => v.autoplay);

  if (search) {
    filtered = filtered.filter(v => (v.title || '').toLowerCase().includes(search) || v.url.toLowerCase().includes(search));
  }

  countIndicator.textContent = `Showing ${filtered.length} of ${videosData.total || 0} videos`;

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-desc" style="text-align: center; padding: 24px 0;">No videos detected on this page.</div>';
    return;
  }

  listEl.innerHTML = filtered.map(v => `
    <div class="media-item-card">
      <div class="media-thumb-wrap" data-preview-src="${escapeHtml(v.url)}" data-preview-type="video" data-preview-poster="${escapeHtml(v.poster || '')}">
        ${v.poster
          ? `<img src="${escapeHtml(v.poster)}" class="media-thumb" alt="" onerror="this.src='icons/icon48.png'">`
          : `<svg class="tab-icon" style="width: 24px; height: 24px; color: var(--text-muted);" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="14" x="3" y="5" rx="2"/><polygon points="10 9 15 12 10 15 10 9"/></svg>`
        }
      </div>
      <div class="media-info">
        <div class="media-header-row">
          <span class="media-title" title="${escapeHtml(v.title)}">${escapeHtml(v.title)}</span>
          <div class="media-badges">
            <span class="badge badge-info">${escapeHtml(v.provider)}</span>
            ${v.autoplay ? '<span class="badge badge-warn">Autoplay</span>' : ''}
          </div>
        </div>
        <div class="media-url font-mono" title="${escapeHtml(v.url)}">${escapeHtml(v.url)}</div>
        <div class="media-actions">
          <a href="${escapeHtml(v.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-xs">Open</a>
          <button class="btn btn-secondary btn-xs btn-vid-preview" data-src="${escapeHtml(v.url)}" data-title="${escapeHtml(v.title)}" data-type="${v.type}">Preview</button>
          <button class="copy-btn" data-copy-text="${escapeHtml(v.url)}" title="Copy video URL">
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  `).join('');

  listEl.querySelectorAll('.btn-vid-preview').forEach(btn => {
    btn.onclick = () => {
      openPreviewModal({ type: 'video', src: btn.dataset.src, title: btn.dataset.title });
    };
  });

  setupCopyButtons(listEl);
}

/* ==========================================================================
   TAB 5: Links Tab & Concurrency Link Status Checker
   ========================================================================== */
function renderLinksTab(linksData) {
  if (!linksData) return;

  animateCounter(document.getElementById('stat-links-total'), 0, linksData.total || 0);
  animateCounter(document.getElementById('stat-links-internal'), 0, linksData.internal || 0);
  animateCounter(document.getElementById('stat-links-external'), 0, linksData.external || 0);
  animateCounter(document.getElementById('stat-links-dofollow'), 0, linksData.dofollow || 0);
  animateCounter(document.getElementById('stat-links-nofollow'), 0, linksData.nofollow || 0);
  animateCounter(document.getElementById('stat-links-notext'), 0, linksData.withoutText || 0);

  initLinksControls(linksData);
  filterAndRenderLinksList(linksData);
}

function initLinksControls(linksData) {
  const chips = document.querySelectorAll('#links-filter-chips .chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      listStates.links.filter = chip.dataset.filter;
      listStates.links.page = 1;
      filterAndRenderLinksList(linksData);
    };
  });

  const searchInput = document.getElementById('input-search-links');
  searchInput.oninput = (e) => {
    listStates.links.search = e.target.value.toLowerCase().trim();
    listStates.links.page = 1;
    filterAndRenderLinksList(linksData);
  };

  const loadMoreBtn = document.getElementById('btn-links-load-more');
  loadMoreBtn.onclick = () => {
    listStates.links.page++;
    filterAndRenderLinksList(linksData);
  };

  // Status Checker Trigger
  const btnCheckLinks = document.getElementById('btn-check-links');
  const btnCancelCheck = document.getElementById('btn-cancel-check-links');

  btnCheckLinks.onclick = () => {
    startLinkStatusCheck(linksData);
  };

  btnCancelCheck.onclick = () => {
    chrome.runtime.sendMessage({ action: 'CANCEL_CHECK_LINKS' }, () => {
      finishLinkCheck();
      showToast('Link check cancelled.');
    });
  };
}

function startLinkStatusCheck(linksData) {
  const validLinks = (linksData.list || [])
    .filter(l => l.href && (l.href.startsWith('http://') || l.href.startsWith('https://')))
    .map(l => ({ url: l.href }));

  if (validLinks.length === 0) {
    showToast('No valid HTTP/HTTPS links to check.');
    return;
  }

  listStates.links.isChecking = true;
  document.getElementById('btn-check-links').classList.add('hidden');
  document.getElementById('btn-cancel-check-links').classList.remove('hidden');
  document.getElementById('checker-progress-container').classList.remove('hidden');
  document.getElementById('checker-progress-fill').style.width = '0%';
  document.getElementById('checker-progress-text').textContent = `Starting check for ${validLinks.length} links...`;

  chrome.runtime.sendMessage({ action: 'CHECK_LINKS', links: validLinks }, (response) => {
    finishLinkCheck();
    if (response && response.results) {
      response.results.forEach(res => {
        listStates.links.checkResults.set(res.url, res);
      });
      updateLinkCheckerStats();
      filterAndRenderLinksList(linksData);
      showToast('Link status checks completed!');
    }
  });
}

function finishLinkCheck() {
  listStates.links.isChecking = false;
  document.getElementById('btn-check-links').classList.remove('hidden');
  document.getElementById('btn-cancel-check-links').classList.add('hidden');
}

function updateLinkCheckerStats() {
  let broken = 0;
  let redirected = 0;

  listStates.links.checkResults.forEach(res => {
    if (res.redirected) redirected++;
    if (!res.ok && res.status !== 0) broken++;
    if (res.status >= 400) broken++;
  });

  animateCounter(document.getElementById('stat-links-broken'), 0, broken);
  animateCounter(document.getElementById('stat-links-redirected'), 0, redirected);
}

function filterAndRenderLinksList(linksData) {
  const listEl = document.getElementById('links-items-list');
  const countIndicator = document.getElementById('links-count-indicator');
  const paginationWrap = document.getElementById('links-pagination');
  const { filter, search, page, pageSize, checkResults } = listStates.links;

  let filtered = linksData.list || [];

  // Filter chips
  if (filter === 'internal') filtered = filtered.filter(l => l.isInternal);
  else if (filter === 'external') filtered = filtered.filter(l => !l.isInternal);
  else if (filter === 'dofollow') filtered = filtered.filter(l => l.isDofollow);
  else if (filter === 'nofollow') filtered = filtered.filter(l => l.isNofollow);
  else if (filter === 'no-text') filtered = filtered.filter(l => !l.text);
  else if (filter === 'broken') {
    filtered = filtered.filter(l => {
      const res = checkResults.get(l.href);
      return res && (!res.ok || res.status >= 400);
    });
  } else if (filter === 'redirected') {
    filtered = filtered.filter(l => {
      const res = checkResults.get(l.href);
      return res && res.redirected;
    });
  }

  // Search filter
  if (search) {
    filtered = filtered.filter(l => l.text.toLowerCase().includes(search) || l.href.toLowerCase().includes(search));
  }

  countIndicator.textContent = `Showing ${Math.min(page * pageSize, filtered.length)} of ${filtered.length} links`;

  const paginated = filtered.slice(0, page * pageSize);

  if (filtered.length === 0) {
    listEl.innerHTML = '<div class="empty-desc" style="text-align: center; padding: 24px 0;">No links match your filter.</div>';
    paginationWrap.classList.add('hidden');
    return;
  }

  listEl.innerHTML = paginated.map(l => {
    const checkRes = checkResults.get(l.href);
    let statusBadge = '<span class="badge font-mono">Untested</span>';

    if (checkRes) {
      if (checkRes.status === 200 || (checkRes.ok && !checkRes.redirected)) {
        statusBadge = '<span class="badge badge-success font-mono">200 OK</span>';
      } else if (checkRes.redirected) {
        statusBadge = `<span class="badge badge-warn font-mono">${checkRes.status || '3xx'} Redirect</span>`;
      } else if (checkRes.status >= 400 || !checkRes.ok) {
        statusBadge = `<span class="badge badge-danger font-mono">${checkRes.status || 'Broken'}</span>`;
      } else if (checkRes.statusText === 'Timeout') {
        statusBadge = '<span class="badge font-mono">Timeout</span>';
      }
    }

    return `
      <div class="link-row">
        <div class="link-row-top">
          <div class="link-anchor" title="${escapeHtml(l.text || 'No anchor text')}">
            ${l.text ? escapeHtml(l.text) : '<span class="badge badge-danger">No text</span>'}
          </div>
          <div class="link-badges">
            <span class="badge ${l.isInternal ? 'badge-info' : ''}">${l.isInternal ? 'Internal' : 'External'}</span>
            <span class="badge ${l.isDofollow ? 'badge-success' : 'badge-warn'}">${l.isDofollow ? 'Dofollow' : 'Nofollow'}</span>
            ${statusBadge}
          </div>
        </div>
        <div class="link-url-row">
          <a href="${escapeHtml(l.href)}" target="_blank" rel="noopener noreferrer" class="link-href font-mono" title="${escapeHtml(l.href)}">
            ${escapeHtml(l.href)}
          </a>
          <div style="display: flex; gap: 4px; align-items: center;">
            <button class="locate-btn btn-link-locate" data-link-index="${l.index}">Locate</button>
            <button class="copy-btn" data-copy-text="${escapeHtml(l.href)}" title="Copy link URL">
              <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
          </div>
        </div>
        ${checkRes && checkRes.redirected && checkRes.finalUrl && checkRes.finalUrl !== l.href
          ? `<div class="redirect-notice">Redirects to: ${escapeHtml(checkRes.finalUrl)}</div>`
          : ''
        }
      </div>
    `;
  }).join('');

  if (paginated.length < filtered.length) {
    paginationWrap.classList.remove('hidden');
  } else {
    paginationWrap.classList.add('hidden');
  }

  // Locate link
  listEl.querySelectorAll('.btn-link-locate').forEach(btn => {
    btn.onclick = () => {
      const index = parseInt(btn.dataset.linkIndex, 10);
      highlightElementOnPage('link', index);
      showToast('Link highlighted on webpage!');
    };
  });

  setupCopyButtons(listEl);
}

/* ==========================================================================
   TAB 6: Schema Tab
   ========================================================================== */
function renderSchemaTab(schemaData) {
  if (!schemaData) return;

  const totalBadge = document.getElementById('schema-total-badge');
  const typesContainer = document.getElementById('schema-types-pills');
  const warningsContainer = document.getElementById('schema-warnings-container');
  const blocksList = document.getElementById('schema-blocks-list');

  totalBadge.textContent = `${schemaData.totalBlocks || 0} Blocks Found`;

  // Validator test buttons pre-filled with current tab URL
  const googleBtn = document.getElementById('btn-validator-google');
  const schemaOrgBtn = document.getElementById('btn-validator-schemaorg');
  googleBtn.href = `https://search.google.com/test/rich-results?url=${encodeURIComponent(currentTabUrl)}`;
  schemaOrgBtn.href = `https://validator.schema.org/#url=${encodeURIComponent(currentTabUrl)}`;

  // Types summary pills
  const types = schemaData.typesSummary || [];
  if (types.length > 0) {
    typesContainer.innerHTML = types.map(t => `
      <span class="badge badge-info" style="font-size: 11.5px; padding: 4px 9px;">
        ${escapeHtml(t.type)} (${t.count})
      </span>
    `).join('');
  } else {
    typesContainer.innerHTML = '<span class="empty-desc">No structured schema types detected on this page.</span>';
  }

  // Validation warnings
  const issues = schemaData.validationIssues || [];
  if (issues.length > 0) {
    warningsContainer.classList.remove('hidden');
    warningsContainer.innerHTML = issues.map(iss => `
      <div class="warning-item warning">
        <span>⚠</span>
        <span>${escapeHtml(iss.message)}</span>
      </div>
    `).join('');
  } else {
    warningsContainer.classList.add('hidden');
  }

  // Blocks list
  const jsonBlocks = schemaData.jsonLdBlocks || [];
  const microdataBlocks = schemaData.microdataBlocks || [];

  let blocksHtml = '';

  jsonBlocks.forEach(b => {
    const jsonStr = b.data ? JSON.stringify(b.data, null, 2) : b.raw;
    blocksHtml += `
      <div class="schema-block-card">
        <div class="schema-block-header">
          <div class="schema-block-title">
            <span class="badge badge-success font-mono">JSON-LD</span>
            <span>Block #${b.index}</span>
          </div>
          <button class="copy-btn" data-copy-text="${escapeHtml(jsonStr)}" title="Copy Schema Block">
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <pre class="schema-json-viewer"><code>${syntaxHighlightJson(jsonStr)}</code></pre>
      </div>
    `;
  });

  microdataBlocks.forEach(b => {
    const jsonStr = JSON.stringify(b.props, null, 2);
    blocksHtml += `
      <div class="schema-block-card">
        <div class="schema-block-header">
          <div class="schema-block-title">
            <span class="badge badge-info font-mono">Microdata</span>
            <span>${escapeHtml(b.type)}</span>
          </div>
          <button class="copy-btn" data-copy-text="${escapeHtml(jsonStr)}" title="Copy Schema Block">
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
          </button>
        </div>
        <pre class="schema-json-viewer"><code>${syntaxHighlightJson(jsonStr)}</code></pre>
      </div>
    `;
  });

  blocksList.innerHTML = blocksHtml || '<div class="empty-desc" style="text-align: center; padding: 20px 0;">No schema markup found.</div>';

  setupCopyButtons(blocksList);
}

function syntaxHighlightJson(json) {
  if (!json) return '';
  json = escapeHtml(json);
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
    let cls = 'json-number';
    if (/^"/.test(match)) {
      if (/:$/.test(match)) {
        cls = 'json-key';
      } else {
        cls = 'json-string';
      }
    } else if (/true|false/.test(match)) {
      cls = 'json-boolean';
    } else if (/null/.test(match)) {
      cls = 'json-null';
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

/* ==========================================================================
   TAB 7: SEO Tools Tab
   ========================================================================== */
function renderToolsTab() {
  const chips = document.querySelectorAll('#tools-filter-chips .chip');
  chips.forEach(chip => {
    chip.onclick = () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      listStates.tools.category = chip.dataset.category;
      filterAndRenderToolsList();
    };
  });

  const searchInput = document.getElementById('input-search-tools');
  searchInput.oninput = (e) => {
    listStates.tools.search = e.target.value.toLowerCase().trim();
    filterAndRenderToolsList();
  };

  filterAndRenderToolsList();
}

function filterAndRenderToolsList() {
  const container = document.getElementById('tools-grid-list');
  const { category, search } = listStates.tools;

  let filtered = SEO_TOOLS;

  if (category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }

  if (search) {
    filtered = filtered.filter(t => t.name.toLowerCase().includes(search) || t.desc.toLowerCase().includes(search));
  }

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-desc" style="grid-column: span 2; text-align: center; padding: 24px 0;">No tools match your query.</div>';
    return;
  }

  container.innerHTML = filtered.map(t => `
    <div class="tool-card">
      <div>
        <div class="tool-category-badge">${escapeHtml(t.category)}</div>
        <div class="tool-name">${escapeHtml(t.name)}</div>
        <div class="tool-desc">${escapeHtml(t.desc)}</div>
      </div>
      <a href="${escapeHtml(t.url)}" target="_blank" rel="noopener noreferrer" class="tool-open-btn">
        <span>Open</span>
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </div>
  `).join('');
}

/* ==========================================================================
   Global Actions & Exports (CSV, JSON, Copy All)
   ========================================================================== */
function initGlobalActions() {
  // Re-scan button
  const refreshBtn = document.getElementById('btn-refresh');
  refreshBtn.addEventListener('click', () => {
    refreshBtn.classList.add('spinning');
    loadActiveTabAndAnalyze(true).finally(() => {
      setTimeout(() => refreshBtn.classList.remove('spinning'), 600);
      showToast('Page analysis updated!');
    });
  });

  // Summary Copy & Export
  const btnCopySummary = document.getElementById('btn-copy-summary');
  if (btnCopySummary) {
    btnCopySummary.onclick = () => {
      if (!currentTabData) return;
      const text = `
SEOscoper Audit Summary:
Title: ${currentTabData.title} (${(currentTabData.title || '').length} chars)
Description: ${currentTabData.description}
URL: ${currentTabData.url}
Canonical: ${currentTabData.canonical} (Match: ${currentTabData.canonicalMatch})
Robots: ${currentTabData.robots || 'Default index, follow'}
H1 Count: ${currentTabData.headings?.counts?.h1 || 0}
Images: ${currentTabData.images?.total || 0} (Missing Alt: ${currentTabData.images?.withoutAlt || 0})
Links: ${currentTabData.links?.total || 0} (Internal: ${currentTabData.links?.internal || 0}, External: ${currentTabData.links?.external || 0})
      `.trim();
      copyToClipboard(text, 'Summary copied to clipboard!');
    };
  }

  const btnExportSummaryJson = document.getElementById('btn-export-summary-json');
  if (btnExportSummaryJson) {
    btnExportSummaryJson.onclick = () => {
      if (!currentTabData) return;
      downloadJsonFile(currentTabData, 'seoscoper-summary.json');
    };
  }

  // Headings Export
  const btnCopyHeadings = document.getElementById('btn-copy-headings');
  if (btnCopyHeadings) {
    btnCopyHeadings.onclick = () => {
      if (!currentTabData?.headings?.list) return;
      const text = currentTabData.headings.list.map(h => `<${h.tag.toUpperCase()}> ${h.text}`).join('\n');
      copyToClipboard(text, 'All headings copied!');
    };
  }

  const btnExportHeadingsCsv = document.getElementById('btn-export-headings-csv');
  if (btnExportHeadingsCsv) {
    btnExportHeadingsCsv.onclick = () => {
      if (!currentTabData?.headings?.list) return;
      const headers = ['Tag', 'Level', 'Characters', 'Text'];
      const rows = currentTabData.headings.list.map(h => [h.tag.toUpperCase(), h.level, h.length, `"${(h.text || '').replace(/"/g, '""')}"`]);
      downloadCsvFile([headers, ...rows], 'seoscoper-headings.csv');
    };
  }

  const btnExportHeadingsJson = document.getElementById('btn-export-headings-json');
  if (btnExportHeadingsJson) {
    btnExportHeadingsJson.onclick = () => {
      if (!currentTabData?.headings) return;
      downloadJsonFile(currentTabData.headings, 'seoscoper-headings.json');
    };
  }

  // Images Export & ZIP
  const btnExportImagesCsv = document.getElementById('btn-export-images-csv');
  if (btnExportImagesCsv) {
    btnExportImagesCsv.onclick = () => {
      if (!currentTabData?.images?.list) return;
      const headers = ['URL', 'Alt Text', 'Title', 'Format', 'Dimensions', 'Loading'];
      const rows = currentTabData.images.list.map(img => [
        `"${img.src}"`,
        `"${(img.alt || '').replace(/"/g, '""')}"`,
        `"${(img.title || '').replace(/"/g, '""')}"`,
        img.format,
        `"${img.naturalWidth}x${img.naturalHeight}"`,
        img.loading
      ]);
      downloadCsvFile([headers, ...rows], 'seoscoper-images.csv');
    };
  }

  const btnExportImagesJson = document.getElementById('btn-export-images-json');
  if (btnExportImagesJson) {
    btnExportImagesJson.onclick = () => {
      if (!currentTabData?.images) return;
      downloadJsonFile(currentTabData.images, 'seoscoper-images.json');
    };
  }

  const btnDownloadAllImages = document.getElementById('btn-download-all-images');
  if (btnDownloadAllImages) {
    btnDownloadAllImages.onclick = () => {
      if (!currentTabData?.images?.list || currentTabData.images.list.length === 0) {
        showToast('No images available to download.');
        return;
      }
      showToast('Fetching and packaging images into ZIP...');
      const files = currentTabData.images.list.map((img, i) => ({
        url: img.src,
        name: `${i + 1}_${getFilenameFromUrl(img.src)}`
      }));
      chrome.runtime.sendMessage({ action: 'DOWNLOAD_ZIP', files, zipName: 'seoscoper-images.zip' }, (res) => {
        if (res && res.success) {
          showToast('ZIP download completed!');
        } else {
          showToast('Error creating ZIP download.');
        }
      });
    };
  }

  // Videos Export
  const btnExportVideosCsv = document.getElementById('btn-export-videos-csv');
  if (btnExportVideosCsv) {
    btnExportVideosCsv.onclick = () => {
      if (!currentTabData?.videos?.list) return;
      const headers = ['Title', 'Provider', 'URL', 'Type', 'Autoplay'];
      const rows = currentTabData.videos.list.map(v => [
        `"${(v.title || '').replace(/"/g, '""')}"`,
        v.provider,
        `"${v.url}"`,
        v.type,
        v.autoplay ? 'Yes' : 'No'
      ]);
      downloadCsvFile([headers, ...rows], 'seoscoper-videos.csv');
    };
  }

  const btnExportVideosJson = document.getElementById('btn-export-videos-json');
  if (btnExportVideosJson) {
    btnExportVideosJson.onclick = () => {
      if (!currentTabData?.videos) return;
      downloadJsonFile(currentTabData.videos, 'seoscoper-videos.json');
    };
  }

  // Links Export
  const btnCopyLinks = document.getElementById('btn-copy-links');
  if (btnCopyLinks) {
    btnCopyLinks.onclick = () => {
      if (!currentTabData?.links?.list) return;
      const text = currentTabData.links.list.map(l => `${l.text ? l.text + ' -> ' : ''}${l.href}`).join('\n');
      copyToClipboard(text, 'All links copied!');
    };
  }

  const btnExportLinksCsv = document.getElementById('btn-export-links-csv');
  if (btnExportLinksCsv) {
    btnExportLinksCsv.onclick = () => {
      if (!currentTabData?.links?.list) return;
      const headers = ['Anchor Text', 'URL', 'Type', 'Rel', 'Target', 'Status'];
      const rows = currentTabData.links.list.map(l => {
        const res = listStates.links.checkResults.get(l.href);
        return [
          `"${(l.text || '').replace(/"/g, '""')}"`,
          `"${l.href}"`,
          l.isInternal ? 'Internal' : 'External',
          `"${l.rel || ''}"`,
          l.target,
          res ? (res.status || res.statusText) : 'Untested'
        ];
      });
      downloadCsvFile([headers, ...rows], 'seoscoper-links.csv');
    };
  }

  const btnExportLinksJson = document.getElementById('btn-export-links-json');
  if (btnExportLinksJson) {
    btnExportLinksJson.onclick = () => {
      if (!currentTabData?.links) return;
      downloadJsonFile(currentTabData.links, 'seoscoper-links.json');
    };
  }

  // Schema Export
  const btnCopyAllSchema = document.getElementById('btn-copy-all-schema');
  if (btnCopyAllSchema) {
    btnCopyAllSchema.onclick = () => {
      if (!currentTabData?.schema) return;
      const jsonStr = JSON.stringify(currentTabData.schema, null, 2);
      copyToClipboard(jsonStr, 'All schema copied!');
    };
  }

  const btnExportSchemaJson = document.getElementById('btn-export-schema-json');
  if (btnExportSchemaJson) {
    btnExportSchemaJson.onclick = () => {
      if (!currentTabData?.schema) return;
      downloadJsonFile(currentTabData.schema, 'seoscoper-schema.json');
    };
  }

  // Issues accordion toggle (if present)
  const issuesHeader = document.getElementById('issues-header');
  const issuesList = document.getElementById('issues-list');
  if (issuesHeader && issuesList) {
    issuesHeader.onclick = () => {
      const isHidden = issuesList.classList.toggle('hidden');
      const icon = document.querySelector('.issues-toggle-icon');
      if (icon) icon.style.transform = isHidden ? 'rotate(-90deg)' : 'rotate(0deg)';
    };
  }

  // Collapsible headers (Hreflang, OG, Twitter)
  ['hreflang', 'og', 'twitter'].forEach(id => {
    const header = document.getElementById(`${id}-header`);
    const content = document.getElementById(id === 'hreflang' ? 'hreflang-list' : `${id}-content`);
    if (header && content) {
      header.onclick = () => {
        const isHidden = content.classList.toggle('hidden');
        header.querySelector('.toggle-arrow').style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
      };
    }
  });
}

/* ==========================================================================
   Background Worker Messaging Listener
   ========================================================================== */
function initBackgroundListeners() {
  const runtimeApi = (typeof browser !== 'undefined' && browser.runtime) ? browser.runtime : (typeof chrome !== 'undefined' ? chrome.runtime : null);
  if (runtimeApi?.onMessage) {
    try {
      runtimeApi.onMessage.addListener((message) => {
        if (!message) return;

        if (message.action === 'SEO_DATA_UPDATED' && message.data) {
          handleDataLoaded(message.data);
        }

        if (message.action === 'LINK_CHECK_PROGRESS' && message.progress) {
          const { completed, total, currentResult } = message.progress;
          const pct = Math.round((completed / total) * 100);

          const fill = document.getElementById('checker-progress-fill');
          const text = document.getElementById('checker-progress-text');
          if (fill) fill.style.width = `${pct}%`;
          if (text) text.textContent = `Checked ${completed} of ${total} links (${pct}%)...`;

          if (currentResult) {
            listStates.links.checkResults.set(currentResult.url, currentResult);
            updateLinkCheckerStats();
          }
        }
      });
    } catch (e) {
      console.warn('[SEOscoper] Background listener setup warning:', e);
    }
  }
}

/* ==========================================================================
   Modal Dialog
   ========================================================================== */
function initModal() {
  const modal = document.getElementById('preview-modal');
  const closeBtn = document.getElementById('btn-modal-close');

  const closeModal = () => modal.classList.add('hidden');
  closeBtn.onclick = closeModal;

  modal.onclick = (e) => {
    if (e.target === modal) closeModal();
  };
}

function openPreviewModal({ type, src, title, dim }) {
  const modal = document.getElementById('preview-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const modalFooter = document.getElementById('modal-footer');

  modalTitle.textContent = title || 'Preview';
  modalBody.innerHTML = '';
  modalFooter.innerHTML = '';

  if (type === 'image') {
    modalBody.innerHTML = `
      <img src="${escapeHtml(src)}" class="modal-preview-img" alt="${escapeHtml(title)}">
      <div class="modal-details">
        <div><strong>Dimensions:</strong> ${dim || 'Natural'}</div>
        <div style="word-break: break-all;"><strong>URL:</strong> ${escapeHtml(src)}</div>
      </div>
    `;
    modalFooter.innerHTML = `
      <a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Open Full Size</a>
      <button class="btn btn-primary btn-sm btn-modal-download" data-src="${escapeHtml(src)}">Download</button>
    `;
    modalFooter.querySelector('.btn-modal-download').onclick = () => {
      chrome.runtime.sendMessage({ action: 'DOWNLOAD_IMAGE', url: src, filename: getFilenameFromUrl(src) });
      showToast('Downloading image...');
    };
  } else if (type === 'video') {
    modalBody.innerHTML = `
      <video src="${escapeHtml(src)}" controls autoplay class="modal-preview-video"></video>
      <div class="modal-details">
        <div style="word-break: break-all;"><strong>URL:</strong> ${escapeHtml(src)}</div>
      </div>
    `;
    modalFooter.innerHTML = `
      <a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">Open in Tab</a>
    `;
  }

  modal.classList.remove('hidden');
}

/* ==========================================================================
   Micro-feedback: Toast Notification & Copy Buttons
   ========================================================================== */
let toastTimeout = null;

function showToast(message) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');

  msgEl.textContent = message;
  toast.classList.remove('hidden');

  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 1900);
}

function copyToClipboard(text, toastMsg = 'Copied to clipboard!') {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(toastMsg);
  }).catch(() => {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast(toastMsg);
  });
}

function setupCopyButtons(root = document) {
  root.querySelectorAll('.copy-btn').forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      let text = btn.dataset.copyText;
      const targetKey = btn.dataset.copyTarget;

      if (!text && targetKey && currentTabData) {
        if (targetKey === 'title') text = currentTabData.title;
        else if (targetKey === 'description') text = currentTabData.description;
        else if (targetKey === 'url') text = currentTabData.url;
        else if (targetKey === 'canonical') text = currentTabData.canonical;
        else if (targetKey === 'robots') text = currentTabData.robots;
        else if (targetKey === 'googlebot') text = currentTabData.googlebot;
        else if (targetKey === 'lang') text = currentTabData.lang;
        else if (targetKey === 'charset') text = currentTabData.charset;
        else if (targetKey === 'viewport') text = currentTabData.viewport;
        else if (targetKey === 'author') text = currentTabData.author;
        else if (targetKey === 'publisher') text = currentTabData.publisher;
      }

      if (text) {
        copyToClipboard(text, 'Copied!');
        btn.classList.add('copied');
        btn.innerHTML = `<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
        setTimeout(() => {
          btn.classList.remove('copied');
          btn.innerHTML = `<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        }, 1500);
      }
    };
  });
}

/* ==========================================================================
   Utilities
   ========================================================================== */
function animateCounter(element, start, end, duration = 400) {
  if (!element) return;
  if (start === end) {
    element.textContent = end;
    return;
  }
  const range = end - start;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + range * easeOut);
    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = end;
    }
  }

  requestAnimationFrame(update);
}

function escapeHtml(str) {
  if (typeof str !== 'string') return str || '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getFilenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.substring(pathname.lastIndexOf('/') + 1);
    return name ? decodeURIComponent(name) : 'image.jpg';
  } catch (e) {
    return 'image.jpg';
  }
}

function downloadCsvFile(rows, filename) {
  const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${filename}`);
}

function downloadJsonFile(obj, filename) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', dataStr);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast(`Exported ${filename}`);
}