# Changelog

All notable changes to the **SEOscoper** Chrome extension will be documented in this file.

---

## [2.0.2] - Pure Live DOM Extraction, Keywords Detection & Viewport Maximization

### 🎯 Key Fixes & Real-Time Enhancements
- **Removed Sticky on Inner Tab Toolbars**: Changed `.list-controls-sticky` from sticky to `position: static` in all tabs (Headers, Images, Videos, Links). Search bars and filter chips now scroll naturally with the content, leaving maximum vertical height to inspect data.
- **100% Live Page Data (Zero Mock/Demo Fallbacks)**: Completely eliminated `getDemoSEOData()` and mock/static datasets. All tabs (Keywords, Images, Videos, Links, Headings, Schema) now display purely live DOM elements extracted directly from the inspected page.
- **Accurate Meta Keywords Extraction**: Extracts real page `<meta name="keywords" content="...">` (e.g. from EasyPro Tools). If meta keywords are not declared or empty, it explicitly displays **"Keywords not found"** with a warning status badge.
- **Fresh Active-Tab Scan on Every Popup Open**: Embedded self-contained `extractLivePageSEOData()` using `chrome.scripting.executeScript({ target: { tabId }, func: ... })`, guaranteeing instant, synchronous, cache-free DOM auditing every time the popup is opened or re-scanned.
- **Accurate Empty States**: If a page has 0 videos, 0 images, or 0 schema items, SEOscoper displays clear "0 found" counts and clean empty state messages—never placeholder images or mock video links.
- **Enhanced Permissions**: Added `"tabs"` permission to `manifest.json` to guarantee seamless tab inspection.

---

## [2.0.1] - Dedicated SEO Score Tab, Keywords Support & UX Enhancements

### 🎯 Key Enhancements & User Feedback Updates
- **Clean Header**: Removed page URL/domain from the extension header. Displays solely the SEOscoper logo, name, and `v2.0.0` version badge.
- **Dedicated "SEO Score" Tab (`#pane-score`)**: Added a 9th dedicated tab featuring:
  - Hero animated circular score gauge with dynamic color changes (Green >= 80, Amber >= 50, Red < 50).
  - 10-Factor SEO Calculation Breakdown with awarded points out of max (Title: 15/15, Description: 15/15, H1: 15/15, Canonical: 10/10, Image Alt: 10/10, Open Graph: 10/10, Lang & Charset: 10/10, Heading Tree: 5/5, Mobile Viewport: 5/5, Robots Index: 5/5).
  - "Fix This First" Prioritized Action Plan categorized by severity (Errors, Warnings, Info).
- **Summary Tab Score Position**: Moved overall score card to the bottom of the Summary tab as a compact preview card with a one-click "View Score Details" navigation button.
- **Meta Keywords Row**: Added a dedicated Meta Keywords field immediately following Meta Description on the Summary tab, complete with keyword count badge and individual copyable pills.
- **Full Heading Text Wrapping**: Removed truncation and ellipses on `.heading-text` in the Headers tab so full titles and subheadings wrap naturally and are 100% visible.
- **All-Visible 2-Row Navigation Tab Bar**: Organized the tab navigation into 2 neat rows (`Summary`, `SEO Score`, `Headers`, `Images`, `Videos` on Row 1; `Links`, `Schema`, `SEO Tools`, `About` on Row 2) ensuring all 9 tabs are 100% visible without horizontal scrolling or clipping.
- **Auto-Wrapping Filter Chips**: Upgraded all filter chips and sub-tabs in Headers, Images, Videos, Links, and Tools to `flex-wrap: wrap` so all filter options are immediately visible without clipping.
- **Fixed Summary Tab Blank Bug**: Resolved issue where switching away from the Summary tab and returning left it blank by ensuring `.hidden` is cleared and the tab is reliably re-rendered.
- **Chrome Web Store Rating Link**: Verified and linked the official Web Store review page in the About section.

---

## [2.0.0] - Modern Technical Overhaul & Feature Expansion

### 🚀 Major Highlights
- **Manifest V3 Migration**: Full upgrade to Chrome Manifest V3 featuring a background service worker (`background.js`) and modern asynchronous content messaging.
- **Brand New Card-Based Design System**: Modern, clean, professional UI with 12px rounded corners, soft shadows, CSS variables, and fluid typography.
- **Native Light & Dark Mode**: Added seamless toggle with automatic OS system preference detection and persistent storage in `chrome.storage.local`.
- **Overall On-Page SEO Health Score (0–100)**: Visual animated radial score ring calculating technical on-page health based on real SEO ranking factors.
- **"Fix This First" Prioritized Insights**: Instant checklist pinpointing critical issues with clear actionable tips to fix each problem.
- **Concurrent HTTP Link Status Checker**: Added asynchronous link health checker using concurrency limit of 5 and timeout of 8s (HEAD with fallback to GET) to detect 200 OK, 301/302 redirects, and 404 broken links with live progress.
- **Live On-Page Highlighter**: Click "Locate" on any heading, image, or link to smoothly scroll and highlight it on the active page with a pulsing outline.
- **Batch Image ZIP Packaging**: Single image downloads plus pure-JavaScript batch ZIP packaging of all webpage images.
- **8 Dedicated Tabs**: Expanded from basic panes to 8 comprehensive tabs (Summary, Headers, Images, Videos, Links, Schema, Tools, About).

---

### 🌟 New Features & Additions by Tab

#### 1. Summary Tab
- **Added** overall SEO score calculation with dynamic color-coding and animated counters.
- **Added** Google SERP title pixel width calculator (~580px desktop maximum limit).
- **Added** Googlebot meta tag detector.
- **Added** HTML Charset and Viewport mobile-friendly responsiveness validation.
- **Added** Hreflang international alternate tags viewer.
- **Added** Open Graph social card tags inspector (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:site_name`, `og:locale`).
- **Added** Twitter Card meta tag inspector (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).
- **Added** visible body word count calculator.
- **Added** page navigation timing / load time measurement in milliseconds.
- **Added** quick one-click shortcuts to test `/robots.txt` and `/sitemap.xml`.
- **Added** article published and modified date extraction from metadata and schema.
- **Added** self-canonical matching indicator and target URL flag for canonical mismatches.
- **Added** copy button to every single metadata field with animated checkmark and toast notifications.
- **Added** full summary data export to JSON.

#### 2. Headers Tab
- **Added** animated counter cards for H1, H2, H3, H4, H5, H6, and Total Headings.
- **Added** diagnostic warnings engine:
  - Missing H1 tag alert (danger).
  - Multiple H1 headings alert (warning).
  - Empty heading tags alert.
  - Skipped heading levels alert (e.g. jumping from H1 directly to H3).
  - Duplicate heading text detection.
  - Heading character length warnings (>70 chars).
- **Added** character count badge next to every heading in the hierarchy tree.
- **Added** live search box to instantly search headings by text.
- **Added** filter chips to filter the tree by specific tags (H1, H2, H3, H4, H5, H6).
- **Added** "Locate" button to scroll and highlight headings on the live page.
- **Added** "Copy All", "Export CSV", and "Export JSON" buttons.

#### 3. Images Tab
- **Added** distinction between missing alt text and decorative empty alt (`alt=""`).
- **Added** lazy-loaded image detection (`loading="lazy"` attribute and lazy classes).
- **Added** estimated total image file size calculation using the Resource Timing API.
- **Added** image dimensions (`naturalWidth` × `naturalHeight` and display size).
- **Added** file format badge (WEBP, SVG, JPG, PNG, AVIF, GIF).
- **Added** image download button using `chrome.downloads`.
- **Added** image preview popover modal with enlarged view and dimension details.
- **Added** "ZIP All" feature to package all page images into a single `.zip` archive.
- **Added** sticky search box and filter chips (Missing Alt, Missing Title, Empty Alt, Lazy, by Format).
- **Added** "Locate" button to highlight images on the live webpage.
- **Added** pagination / chunked virtualized rendering to handle pages with 1,000+ images smoothly.

#### 4. Videos Tab (Brand New)
- **Added** detection for HTML5 `<video>` tags and child `<source>` elements.
- **Added** detection for YouTube, Vimeo, and Dailymotion iframe embeds.
- **Added** detection for Open Graph video tags (`og:video`) and JSON-LD `VideoObject` schema.
- **Added** stats for embedded vs. self-hosted videos, posters, captions/subtitles, and autoplay.
- **Added** built-in video preview player modal.
- **Added** download option for directly hosted media and "Open source" for embeds.
- **Added** CSV and JSON export buttons.

#### 5. Links Tab
- **Added** Dofollow vs. Nofollow counter and badge tags.
- **Added** link rel attribute inspection (`sponsored`, `ugc`, `noopener`, `noreferrer`).
- **Added** duplicate links counter and detection.
- **Added** link target indicator (`_blank` vs. `_self`).
- **Added** concurrent HTTP Link Status Checker with concurrency 5, 8s timeout, and cancellation.
- **Added** live redirect target URL tracking for 301/302 redirects.
- **Added** sticky search input and filter chips (Internal, External, Dofollow, Nofollow, Broken, Redirected, No Text).
- **Added** "Locate" button to scroll and pulse-highlight links on the live page.
- **Added** chunked pagination to easily handle 2,000+ links without lag.
- **Added** "Copy All", "Export CSV", and "Export JSON" buttons.

#### 6. Schema Tab (Brand New)
- **Added** multi-format structured data detection: JSON-LD, Microdata, and RDFa.
- **Added** summary of all detected schema types with count badges (Article, Organization, Product, FAQPage, BreadcrumbList, WebSite, LocalBusiness, Review, VideoObject).
- **Added** formatted JSON viewer with colorized syntax highlighting for keys, strings, numbers, and booleans.
- **Added** schema syntax validation and missing recommended property checks (`@context`, `name`, `image`).
- **Added** single-click buttons to open the active page URL in Google Rich Results Test and Schema Markup Validator.
- **Added** "Copy All Schema" and "Export JSON" buttons.

#### 7. SEO Tools Tab (Upgraded)
- **Added** featured card highlighting **EasyPro Tools** with a gold badge.
- **Added** 20+ curated industry-standard tools across 8 categories (Keyword Research, Backlinks & Authority, Technical SEO, Speed & Performance, Google Tools, WordPress SEO, Rank Tracking, and Content Creation).
- **Added** live search box and category filter chips.
- **Added** safe `target="_blank" rel="noopener noreferrer"` links.

#### 8. About Tab (Upgraded)
- **Added** developer profile for Rakib Alom with personal site and contact links.
- **Added** social links for Facebook, GitHub, LinkedIn, and Instagram.
- **Added** version pill linked to manifest version.
- **Added** 100% client-side privacy guarantee card.
- **Added** direct links to rate on Chrome Web Store and submit bug reports.

#### Footer
- **Added** sticky footer present across all tabs.
- **Added** signature "Buy me a coffee" yellow badge (`#FFDD00`) linking to https://buymeacoffee.com/rakibalom.

---

### 🔧 Bug Fixes & Refactoring
- **Fixed** silent failures on restricted browser pages (`chrome://`, Web Store, PDF viewer) by introducing friendly empty state illustrations and helpful instructions.
- **Fixed** missing `icon32.png` deliverable by generating a high-quality 32x32 bicubic icon from the master 1024x1024 asset.
- **Fixed** memory leaks and performance bottlenecks on pages with large DOMs by introducing virtualized/paginated rendering and on-demand tab lazy loading.
- **Fixed** missing copy feedback by implementing micro-animated checkmarks and floating toasts.
- **Preserved** all original functionality while radically modernizing aesthetics and architecture.
