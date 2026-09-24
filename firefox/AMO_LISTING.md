# Mozilla Add-ons (AMO) Store Listing for SEOscoper

Use this document to quickly fill in your listing details when submitting to the [Mozilla Add-ons Developer Hub (AMO)](https://addons.mozilla.org/developers/).

---

## 🏷️ Add-on Metadata

- **Add-on Name**:
  `SEOscoper - On-Page SEO Analyzer & Checker`

- **Gecko ID** *(Configured in manifest.json)*:
  `seoscoper@rakibalom.com`

- **Version**:
  `2.0.2`

- **Primary Category**:
  `Search Tools` or `Web Development`

- **Secondary Category**:
  `Photos, Music & Media` or `Alerts & Updates`

- **Tags / Keywords**:
  `seo`, `on-page seo`, `meta tags`, `schema markup`, `headings`, `broken links`, `image alt`, `technical seo`, `open graph`

- **Support Website**:
  `https://rakibalom.com/`

- **Support Email**:
  `contact@rakibalom.com`

---

## 📝 Summary (Max 250 characters)

```text
Instant 1-click on-page SEO analyzer. Audit meta tags, headings (H1-H6), image alt text, broken links, schema markup, and overall SEO health score with zero external dependencies.
```
*(Character count: 184 / 250)*

---

## 📄 Detailed Description (Formatted with Markdown for AMO)

```markdown
**SEOscoper** is a modern, lightning-fast on-page SEO analyzer and technical SEO audit extension built specifically for technical SEO specialists, developers, content strategists, and digital marketers.

With a single click, SEOscoper audits critical on-page ranking factors in real time—100% locally in your browser with zero third-party tracking or data collection.

---

### 🚀 Key Features & Capabilities:

- **⚡ Lightning-Fast (Under 300 ms)**: Engineered with pure vanilla JavaScript and CSS variables. Opens instantly and audits pages without slowing down Firefox.
- **🎯 Overall SEO Score (0–100)**: Animated radial health score calculating on-page health based on 10 core technical SEO ranking factors.
- **💡 "Fix This First" Prioritized Action Plan**: Ordered checklist of discovered issues with direct, actionable tips to resolve them.
- **🏷️ Meta Title & Pixel Width Checker**: Character counts (30–60 ideal) and desktop Google SERP pixel width indicator (~580px max).
- **📝 Meta Description & Keywords**: Character counts (70–160 ideal) with interactive copyable keyword pills.
- **📐 Complete Headings Hierarchy (H1–H6)**: Indented hierarchy tree detecting missing H1s, multiple H1s, skipped levels, and duplicate headings.
- **👁️ Live Visual Element Highlighter**: Click "Locate" on any heading, image, or link to smoothly scroll to and pulse-highlight it directly on the active webpage.
- **🖼️ Image & Media Extractor**: Inspect natural vs. rendered dimensions, file formats (WebP, SVG, AVIF, JPG, PNG), alt text presence, and lazy loading. Download individual images or batch-package all webpage media into a `.zip` archive.
- **🎥 Video Extractor**: Detects and previews `<video>` elements, YouTube, and Vimeo embeds with direct preview players.
- **🔗 Async HTTP Link Status Checker**: Run concurrent requests with timeout control to instantly detect 200 OK, 301/302 redirects, and 404 broken links.
- **🧩 Structured Data & Schema Viewer**: Detect and parse JSON-LD (`application/ld+json`), Microdata, and RDFa with formatted syntax-highlighted blocks and copy shortcuts.
- **📊 Instant CSV & JSON Exports**: One-click exports on every tab for fast audit reporting and sharing.
- **🌓 Light & Dark Theme**: Beautiful modern card-based UI with system-theme auto-detection and persistent storage.

---

### 🔒 100% Client-Side Privacy:

SEOscoper respects your privacy:
- Runs 100% locally within your Firefox browser.
- No analytics, tracking pixels, or remote telemetry.
- No webpage content or URLs are ever transmitted to any external server.
```

---

## 🛡️ AMO Reviewer Notes (Permission Justifications)

Paste this into the **"Notes to Reviewer"** field during AMO submission to ensure fast, seamless approval:

```text
Hello Mozilla Review Team,

SEOscoper is an on-page SEO analysis tool that operates completely locally within the browser without any remote scripts or external tracking. Below is a breakdown of why each permission is required:

1. activeTab & tabs:
Used to query the active browser tab when the user opens the popup, retrieve the current URL/title, and display on-page audit data.

2. scripting:
Used via browser.scripting.executeScript to extract DOM metadata (meta tags, headings H1-H6, schema JSON-LD, images, and links) and to power the visual "Locate" button that smoothly scrolls to and pulse-highlights an element on the webpage.

3. storage:
Used via browser.storage.local to save the user's preferred theme (dark/light) and remember the last active tab in the popup.

4. clipboardWrite:
Used to let users copy meta tags, URLs, headings, and schema blocks with a single click.

5. downloads:
Used to download inspected webpage images individually or package them into a client-side generated .zip file.

6. host_permissions (http://*/* and https://*/*):
Required to allow the user to audit any standard public webpage they visit and to run asynchronous HTTP status checks (200 OK, redirects, 404 broken links) on the links found on that page.

7. Data Collection & Privacy (data_collection_permissions: ["none"]):
SEOscoper collects NO personal data, analytics, telemetry, or user interaction data whatsoever. All analysis runs 100% locally in the browser memory.

8. HTML Rendering & Sanitization (innerHTML warnings):
All template rendering in popup.js strictly passes dynamic values (heading text, URLs, alt texts, schema blocks) through our custom escapeHtml() sanitizer before insertion to eliminate any XSS vectors.

Thank you for your review!
```
