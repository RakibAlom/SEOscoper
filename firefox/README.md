# SEOscoper for Mozilla Firefox 🦊
### Manifest V3 On-Page SEO Analyzer & Checker

This folder contains the complete, standalone build of **SEOscoper** optimized and configured specifically for **Mozilla Firefox** and ready for distribution on **Mozilla Add-ons (AMO)**.

---

## 📁 Folder Structure

```text
firefox/
├── manifest.json         # Firefox MV3 manifest with Gecko ID & background scripts
├── background.js        # Background script for link HTTP checks & image/zip downloads
├── content.js           # In-page DOM extractor, schema parser & element highlighter
├── popup.html           # Extension UI popup
├── popup.css            # Styles with Firefox custom scrollbars & light/dark theme
├── popup.js             # Client logic with cross-browser WebExtensions API support
├── icons/               # Extension icons (16px, 32px, 48px, 128px)
├── AMO_LISTING.md       # Mozilla Add-ons store listing text & reviewer notes
└── README.md            # Firefox development, testing, and packaging guide
```

---

## 🧪 How to Test Locally in Firefox

You can easily test SEOscoper in Mozilla Firefox without signing or publishing:

1. Open **Mozilla Firefox**.
2. Type `about:debugging` in the address bar and press **Enter**.
3. Click on **"This Firefox"** in the left sidebar (or navigate directly to `about:debugging#/runtime/this-firefox`).
4. Click the **"Load Temporary Add-on…"** button.
5. In the file picker dialog, navigate to this `firefox` folder:
   `D:\Projects\BrowserExtensions\SEOscoper\firefox\`
6. Select the [manifest.json](manifest.json) file and click **Open**.
7. **SEOscoper** will now appear in your Firefox toolbar!
8. Open any live public website (e.g. `https://developer.mozilla.org/`) and click the SEOscoper icon to run an instant audit.

> **Note on Temporary Add-ons**: Temporary add-ons remain active until Firefox is restarted. To update after making code edits, simply click the **"Reload"** button on the `about:debugging` page.

---

## 📦 How to Package for Mozilla Add-ons (AMO)

When you are ready to publish on [addons.mozilla.org](https://addons.mozilla.org/developers/):

### Option 1: Using PowerShell (Fastest)

Run this command from your terminal:

```powershell
Compress-Archive -Path "firefox/manifest.json", "firefox/background.js", "firefox/content.js", "firefox/popup.html", "firefox/popup.css", "firefox/popup.js", "firefox/icons" -DestinationPath "seoscoper-firefox-v2.0.2.zip" -Force
```

This creates a clean `seoscoper-firefox-v2.0.2.zip` in the root folder containing only the extension files.

### Option 2: Manual ZIP

1. Open the `firefox/` folder.
2. Select the core extension files:
   - `manifest.json`
   - `background.js`
   - `content.js`
   - `popup.html`
   - `popup.css`
   - `popup.js`
   - `icons/`
3. Right-click -> **Send to** -> **Compressed (zipped) folder** (or use 7-Zip).
4. Name it `seoscoper-firefox-v2.0.2.zip`.

> **Important**: Do **NOT** zip the `firefox` folder itself as the top directory. The `manifest.json` file must be at the root of the `.zip` archive.

---

## 🚀 Step-by-Step AMO Submission Guide

1. Log in to the [Mozilla Add-ons Developer Hub](https://addons.mozilla.org/developers/).
2. Click **"Submit a New Add-on"**.
3. Choose your distribution channel:
   - **"On this site"** (Recommended for public distribution via AMO search).
4. Upload your `seoscoper-firefox-v2.0.2.zip` file.
   - Firefox's automated linter will validate the manifest and files.
5. In the **"Do you need to provide source code?"** step:
   - Select **"No"** (Because SEOscoper uses clean, readable, unminified vanilla JavaScript without obfuscation or bundlers).
6. Fill in the store listing information using the provided copy in [AMO_LISTING.md](AMO_LISTING.md).
7. Paste the permission justification from `AMO_LISTING.md` into the **"Notes to Reviewer"** field.
8. Click **Submit Version**!

Mozilla typically reviews and approves standard vanilla add-ons within a few hours to 1–2 business days.

---

## ⚙️ Key Technical Differences from Chrome Build

| Feature | Chrome Version | Firefox Version |
| :--- | :--- | :--- |
| **Gecko ID** | Not needed | `browser_specific_settings.gecko.id: "seoscoper@rakibalom.com"` |
| **Background Script** | `"service_worker": "background.js"` | `"scripts": ["background.js"]` (Standard MV3 event page) |
| **API Namespace** | `chrome.*` | Unified `browser.*` & `chrome.*` fallback |
| **Restricted URLs** | `chrome://`, `chromewebstore` | `about:`, `addons.mozilla.org`, `moz-extension://`, `chrome://` |
| **Scrollbars** | `-webkit-scrollbar` | `scrollbar-width: thin; scrollbar-color: ...` |
| **ZIP Generation** | Blob / FileReader | Blob object URL with memory cleanup |
