# SEOscoper 🚀
### Free On-Page SEO Analyzer & Technical SEO Checker for Google Chrome

[![Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-blue?logo=google-chrome&logoColor=white)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Version](https://img.shields.io/badge/version-2.0.2-green.svg)](manifest.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)
[![Creator: Rakib Alom](https://img.shields.io/badge/Author-Rakib%20Alom-orange.svg)](https://rakibalom.com/)
[![Support: Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-yellow.svg?logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/rakibalom)

**SEOscoper** is a modern, fast, professional on-page SEO analyzer Chrome extension. Designed for technical SEO experts, web developers, content strategists, and digital marketers, SEOscoper audits critical on-page elements in real time with a single click—100% locally in your browser with zero data collection.

---

## 📑 Table of Contents
- [Key Features](#-key-features)
- [Tab-by-Tab Breakdown](#-tab-by-tab-breakdown)
  - [1. Summary Tab (Page Directives & Metadata)](#1-summary-tab-page-directives--metadata)
  - [2. Dedicated SEO Score Tab (Deep Ranking Factor Analysis)](#2-dedicated-seo-score-tab-deep-ranking-factor-analysis)
  - [3. Heading Structure (H1–H6)](#3-heading-structure-h1h6)
  - [4. Image Alt Text & Media Extractor](#4-image-alt-text--media-extractor)
  - [5. Video Extractor & Player](#5-video-extractor--player)
  - [6. Link Extractor & HTTP Status Checker](#6-link-extractor--http-status-checker)
  - [7. Structured Data & Schema Markup Viewer](#7-structured-data--schema-markup-viewer)
  - [8. Curated SEO Tools Grid](#8-curated-seo-tools-grid)
  - [9. About & Support](#9-about--support)
- [Design & User Experience](#-design--user-experience)
- [Technical Architecture (Manifest V3)](#-technical-architecture-manifest-v3)
- [Permissions & Privacy](#-permissions--privacy)
  - [Why Host Permissions are Needed](#why-host-permissions-are-needed)
  - [Privacy Commitment](#privacy-commitment)
- [Installation Guide](#-installation-guide)
- [Target Keywords](#-target-keywords)
- [Author & Credits](#-author--credits)

---

## ✨ Key Features

- **⚡ Lightning-Fast Performance**: Opens in under 300 ms with vanilla JavaScript, modern CSS variables, and zero heavy frameworks.
- **🎯 Overall SEO Score (0–100)**: Visual animated radial score ring calculating on-page health based on 10 core technical SEO ranking factors.
- **💡 "Fix This First" Prioritized Action Plan**: Ordered checklist of issues and quick tips explaining how to resolve each error.
- **🏷️ Meta Keywords Support**: Dedicated keywords row with tokenized copy-friendly pills placed immediately after Meta Description.
- **👁️ Live Page Highlighter**: Click "Locate" on any heading, image, or link to smoothly scroll and highlight it directly on the live webpage.
- **🔗 Async HTTP Link Status Checker**: Run concurrent `HEAD`/`GET` requests with a timeout of 8 seconds and concurrency limit of 5 to instantly detect 200 OK, 301/302 redirects, and 404 broken links.
- **📦 Single & Batch ZIP Downloads**: Download individual images or batch-package all webpage images into a `.zip` archive.
- **📊 Instant CSV & JSON Exports**: One-click exports on every tab for fast audit reporting.
- **📋 One-Click Copy Buttons**: Copy any meta tag, URL, heading, or schema block with micro-animated checkmarks and floating toast feedback.
- **🌓 Light & Dark Theme**: Sleek card-based UI with soft shadows, system-theme auto-detection, and persistent storage.
- **🔒 100% Client-Side Privacy**: Runs strictly in your browser without collecting, tracking, or transmitting your webpage data.

---

## 🔍 Tab-by-Tab Breakdown

### 1. Summary Tab (Page Directives & Metadata)
The command center for your on-page audit:
- **Meta Title Checker**: Character count (`30–60 chars` ideal) and Google desktop SERP pixel width indicator (`~580px max`).
- **Meta Description Checker**: Character count (`70–160 chars` ideal) with status badge.
- **Meta Keywords Checker**: Detected keywords count with individual interactive copyable tag pills.
- **Page URL & Canonical**: Compares `<link rel="canonical">` against current URL to detect missing tags or cross-domain mismatches.
- **Robots Meta Tag Checker**: Color-coded badges highlighting `noindex`, `nofollow`, `noarchive`, and `nosnippet`.
- **Googlebot Directives**: Dedicated tag extraction.
- **Language, Charset & Viewport**: Checks `html lang` attribute, character encoding, and mobile-friendly responsive viewport.
- **Open Graph & Twitter Cards**: Complete audit of `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card`, `twitter:title`, `twitter:image`.
- **Hreflang Tags Viewer**: Lists all international and regional language variations.
- **Content & Speed Metrics**: Total word count and page navigation timing in milliseconds.
- **Direct Links**: Instant one-click links to test `/robots.txt` and `/sitemap.xml`.
- **Compact Bottom Score Card**: Overall technical SEO health indicator with a direct link button to open the detailed Score tab.

### 2. Dedicated SEO Score Tab (Deep Ranking Factor Analysis)
Comprehensive breakdown of your webpage's technical SEO health:
- **Hero Score Radial Ring**: Large animated circular gauge scoring the page from 0 to 100 with dynamic status badges.
- **10 Core Ranking Factors Evaluated**:
  1. *Meta Title Tag* (Max 15 pts): Checks existence, length (30-60 chars), and SERP pixel truncation width.
  2. *Meta Description* (Max 15 pts): Evaluates length (70-160 chars) and snippet impact.
  3. *H1 Heading Structure* (Max 15 pts): Ensures exactly one main topic H1 exists.
  4. *Canonical Tag* (Max 10 pts): Validates canonical presence and self-referencing correctness.
  5. *Image Alt Text Coverage* (Max 10 pts): Calculates percentage of informative images with descriptive alt text.
  6. *Open Graph Social Meta* (Max 10 pts): Checks for complete social preview cards (title and image).
  7. *Language & Charset* (Max 10 pts): Validates `lang` and `charset` declarations for global crawlers.
  8. *Heading Hierarchy* (Max 5 pts): Flags skipped heading levels (e.g. H1 directly jumping to H3).
  9. *Mobile Responsive Viewport* (Max 5 pts): Verifies mobile readiness via `width=device-width`.
  10. *Search Indexability (Robots)* (Max 5 pts): Ensures search engines are not blocked by `noindex`.
- **Prioritized Action Plan ("Fix This First")**: Issues sorted strictly by ranking severity (Errors, Warnings, Info) with step-by-step resolution advice.

### 3. Heading Structure (H1–H6)
- **Tag Counts**: Animated counters for H1, H2, H3, H4, H5, H6, and Total Headings.
- **Structural Warnings**: Flags missing H1, multiple H1s, empty headings, skipped levels (e.g. H2 to H4), duplicate headings, and very long headings (>70 chars).
- **Full Text Wrapping**: Headings wrap completely with natural line breaks—never truncated with ellipses.
- **Indented Visual Hierarchy Tree**: Displays headings in natural DOM order with tag badges, character count pills, and copy buttons.
- **Live Highlight ("Locate")**: Scrolls and pulses headings directly on the webpage.
- **Filter & Search**: Real-time filtering by level (H1–H6) or text search.
- **Export**: Copy all headings as formatted text, export to CSV or JSON.

### 4. Image Alt Text & Media Extractor
- **Statistics**: Total images, with alt, missing alt (highlighted in red), empty alt (decorative `alt=""`), with title, missing title, lazy-loaded (`loading="lazy"`), and estimated file size.
- **Item Details**: Thumbnail preview, filename, dimensions (`naturalWidth` × `naturalHeight`), file format (JPG, PNG, WebP, SVG, AVIF, GIF), alt text, title attribute, and URL.
- **Interactive Actions**:
  - Download individual images via Chrome Downloads API.
  - Preview popover modal with dimensions and zoom view.
  - Download all images as a compressed ZIP file.
  - Export image inventory as CSV or JSON.
  - Auto-wrapping filter chips: All, Missing Alt, Missing Title, Empty Alt, Lazy, by Format.

### 5. Video Extractor & Player
- **Detection**: HTML5 `<video>` tags & child `<source>` elements, YouTube, Vimeo, and Dailymotion iframe embeds, Open Graph video tags, and JSON-LD `VideoObject` schema.
- **Attributes**: Autoplay, controls, loop, muted, captions/subtitles, dimensions, and poster image.
- **Actions**: Built-in modal video player, direct download for self-hosted files, "Open source" for embeds, CSV and JSON exports.

### 6. Link Extractor & HTTP Status Checker
- **Link Audit**: Total links, internal vs external links, without text, without title, Dofollow vs Nofollow, and rel attributes (`sponsored`, `ugc`, `noopener`, `noreferrer`).
- **HTTP Status Checker**:
  - User-triggered asynchronous checker with concurrency limit of 5 and timeout of 8 seconds.
  - First tests via `HEAD`, with automatic fallback to `GET` for servers blocking HEAD requests.
  - Color-coded status badges: `200 OK` (Green), `301/302 Redirect` with destination URL (Amber), `404 / 5xx Broken` (Red), `Timeout` (Grey).
  - Live progress bar with cancellation support.
- **Interactivity**: Highlight link on page, filter by status or link type, text search, CSV/JSON export.

### 7. Structured Data & Schema Markup Viewer
- **Formats Detected**: JSON-LD (`application/ld+json`), Microdata (`itemscope`, `itemtype`), and RDFa (`typeof`).
- **Detected Types Summary**: Quick badges with counts (Article, Organization, Product, FAQPage, BreadcrumbList, WebSite, LocalBusiness, Review, VideoObject).
- **Validation**: Flags malformed JSON syntax errors and missing recommended attributes (e.g. `@context`, `name`).
- **Formatted Viewer**: Expandable/collapsible blocks with colorized syntax highlighting for keys, strings, numbers, and booleans.
- **External Validator Shortcuts**: Direct links to test current URL on Google Rich Results Test and Schema Markup Validator.

### 8. Curated SEO Tools Grid
- **Featured Tool**: **EasyPro Tools**—mass online developer and marketing utilities built by Rakib Alom.
- **Curated Directory**: 20+ top SEO tools organized across Keyword Research, Backlinks & Authority, Technical SEO & Audits, Speed & Performance, Google Tools, WordPress SEO, Rank Tracking, and Content Creation (Ahrefs, SEMrush, Moz, Screaming Frog, PageSpeed Insights, Google Search Console, Rank Math, Yoast SEO, Canva, etc.).

### 9. About & Support
- Built with passion by **Rakib Alom**, professional SEO expert since 2020.
- Direct contact: `contact@rakibalom.com`.
- Social links: Facebook, GitHub, LinkedIn, Instagram.
- **Rate on Chrome Web Store**: [SEOscoper on Chrome Web Store](https://chromewebstore.google.com/detail/seoscoper/jcgmckddodaomodngaciiphfedbjonag).
- Integrated **Buy Me A Coffee** support button to fund ongoing development.

---

## 🎨 Design & User Experience

- **Curated Color Palette**:
  - Primary Brand: `#4F46E5` (Light) / `#818CF8` (Dark)
  - Card Surfaces: Clean white `#FFFFFF` / Deep navy `#111827`
  - Subtle Status Badges: Soft tinted backgrounds with icons (never relying on color alone)
  - Warm Yellow Accent (`#FFDD00`) exclusively for the Buy Me A Coffee button.
- **Fluid Layout**: 440px width with max 600px height and smooth internal scrolling.
- **Micro-Animations**: 150–220ms ease-out transitions, counter roll-ups on load, and checkmark copy animations.
- **Accessibility**: Keyboard navigable, visible focus rings, ARIA labels on all icon buttons, and WCAG contrast ratio exceeding 4.5:1.

---

## 🏗️ Technical Architecture (Manifest V3)

```
SEOscoper/
├── manifest.json         # Manifest V3 configuration & permissions
├── background.js         # Service Worker (concurrent link status check & ZIP downloads)
├── content.js            # Injected DOM analyzer & element highlighter
├── popup.html            # Semantic 8-tab markup & SVG icon library
├── popup.css             # CSS variables, dark/light themes & design tokens
├── popup.js              # Application logic, scoring model, virtualized lists & exports
├── icons/                # High-res extension icons (16, 32, 48, 128 px + master)
├── README.md             # Documentation & technical guide
├── STORE_LISTING.md      # Chrome Web Store copy & metadata
└── CHANGELOG.md          # Version history & release notes
```

---

## 🔐 Permissions & Privacy

```json
"permissions": [
  "activeTab",
  "scripting",
  "storage",
  "clipboardWrite",
  "downloads"
],
"host_permissions": [
  "http://*/*",
  "https://*/*"
]
```

### Why Host Permissions are Needed
The `host_permissions` permission (`http://*/*`, `https://*/*`) is required **solely** for the **HTTP Link Status Checker**. When you click "Check Link Status", the background service worker sends standard `HEAD`/`GET` requests to external destination domains to determine if links are healthy (200 OK), redirected (301/302), or broken (404/500). Without host permissions, Chrome would block cross-origin requests to external domains.

### Privacy Commitment
- **Zero Tracking**: SEOscoper does not use analytics, tracking pixels, or external telemetry.
- **Local Execution**: All analysis runs 100% locally in your browser.
- **No Data Leaves**: No page content, URLs, or metadata are ever saved or transmitted to any server.

---

## 💻 Installation Guide

### Install in Developer Mode (Manual / Unpacked)
1. Download or clone this repository to your computer:
   ```bash
   git clone https://github.com/rakibalom/SEOscoper.git
   ```
2. Open Google Chrome and navigate to:
   ```
   chrome://extensions/
   ```
3. Enable **Developer mode** using the toggle in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the `SEOscoper` folder.
6. The SEOscoper icon will appear in your Chrome toolbar. Pin it for quick access!

---

## 🏷️ Target Keywords

`SEO extension`, `SEO analyzer`, `SEO checker`, `on-page SEO`, `meta tags checker`, `meta title checker`, `meta description checker`, `heading checker`, `H1 H2 H3 checker`, `image alt text checker`, `broken link checker`, `nofollow checker`, `dofollow checker`, `schema markup checker`, `structured data viewer`, `JSON-LD viewer`, `canonical tag checker`, `robots meta tag checker`, `Open Graph checker`, `Twitter card checker`, `hreflang checker`, `SEO audit tool`, `technical SEO`, `free SEO tool`, `Chrome SEO plugin`, `website SEO analysis`, `SEO tools for Chrome`, `link extractor`, `image extractor`, `video extractor`.

---

## 👨‍💻 Author & Credits

**SEOscoper** is created and maintained by:

**Rakib Alom**
- 🌐 Website: [rakibalom.com](https://rakibalom.com/)
- 🛠️ Tools: [EasyPro Tools](https://easyprotools.com/)
- 💼 LinkedIn: [linkedin.com/in/rakibalom](https://www.linkedin.com/in/rakibalom/)
- 🐙 GitHub: [github.com/rakibalom](https://github.com/rakibalom)
- ☕ Support: [buymeacoffee.com/rakibalom](https://buymeacoffee.com/rakibalom)

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
