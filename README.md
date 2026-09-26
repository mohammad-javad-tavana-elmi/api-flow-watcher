# API Flow Watcher – Documentation

## Overview

API Flow Watcher is a lightweight Chrome extension designed for developers who need real-time visibility into all API requests triggered by a webpage. It automatically captures and logs network traffic, lets you filter requests by domain, and provides tools to export captured requests into Postman for further testing.

This extension is ideal for debugging frontend integrations, reverse-engineering API flows, and analyzing interactions between web applications and backend services.

---

## Features

### • Real-Time Request Capturing

The extension listens to XHR/fetch requests made by web pages and stores them in chronological order. Static assets (scripts, styles, images, fonts, media) and common analytics/ad domains are ignored. The popup updates live while it is open.

Captured requests survive service worker restarts, and the history is capped at the 500 most recent requests.

### • Domain Filtering

You can optionally filter captured requests by specifying a domain (e.g., `example.com`) to reduce noise. The filter matches the domain itself and its subdomains (`example.com` matches `api.example.com`, but not `notexample.com`).

### • Request Viewer

Captured requests are displayed neatly inside the popup, including:

* HTTP method
* URL
* Timestamp
* Status code (or the network error, if the request failed)
* Headers
* Body (if available)

### • Clear & Refresh Tools

* **Refresh:** Reloads the request view (the list also updates automatically).
* **Clear:** Wipes captured records from the storage.

### • Export to Postman

All captured requests can be exported as a Postman-compatible collection (JSON file). JSON bodies are exported as raw JSON, and form submissions as `x-www-form-urlencoded`.

---

## Project Structure

```
API-Flow-Watcher/
│
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── utils.js
└── icons/
    ├── 16.png
    ├── 32.png
    ├── 48.png
    └── 128.png
```

---

## How It Works

### 1. Background Service Worker

The `background.js` file uses Chrome's `webRequest` API to listen for XHR/fetch requests. Each request is normalized into a structured format and saved into Chrome's `storage.local`. Headers, status codes and errors are matched to their request by Chrome's `requestId`, so repeated calls to the same URL are tracked correctly.

### 2. Popup UI

The popup fetches saved requests from storage and renders them. You can filter, refresh, or export directly from the interface.

### 3. Postman Export

The extension converts captured requests into a valid Postman Collection JSON that you can import directly into the Postman app.

---

## Installation (Developer Mode)

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Enable **Developer Mode** (top-right).
4. Click **Load unpacked**.
5. Select the project folder.
6. The extension will now appear in your Chrome toolbar.

---

## Permissions Explained

Your `manifest.json` includes:

### `webRequest`

Allows the extension to observe network requests.

### `storage`

Used for storing the request logs and the domain filter.

### `unlimitedStorage`

Lifts the default storage quota so large request bodies don't cause saving to fail.

### `host_permissions: "<all_urls>"`

Allows capturing requests from all domains.

These permissions are necessary for a developer debugging tool.

---

## Usage Guide

### 1. Open the Popup

Click the extension icon. A UI appears with filters and buttons.

### 2. Optional: Set Domain Filter

Enter something like:

```
api.example.com
```

Requests not matching this domain will be ignored.

### 3. Browse the Website

Navigate the website you're testing. All requests will automatically be logged.

### 4. Refresh

The list updates live while the popup is open; **Refresh** reloads it manually.

### 5. Clear

Deletes all saved network logs.

### 6. Export to Postman

Click **Export** to download a ready-to-import Postman collection.

---

## Troubleshooting

### The extension isn’t logging requests

* Ensure the tab you're testing is not a Chrome internal page (like `chrome://` pages).
* Ensure permissions are correctly applied.
* Try refreshing your tab.

### Export doesn’t work

* Ensure requests were captured (the popup shows "Nothing to export" otherwise).

---

## License

This project is open-source and free to modify.

---
