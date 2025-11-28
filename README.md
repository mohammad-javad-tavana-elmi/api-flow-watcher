# API Flow Watcher – Documentation

## Overview

API Flow Watcher is a lightweight Chrome extension designed for developers who need real-time visibility into all API requests triggered by a webpage. It automatically captures and logs network traffic, lets you filter requests by domain, and provides tools to export captured requests into Postman for further testing.

This extension is ideal for debugging frontend integrations, reverse-engineering API flows, and analyzing interactions between web applications and backend services.

---

## Features

### • Real-Time Request Capturing

The extension listens to all outgoing HTTP(S) requests made by the browser and stores them in chronological order.

### • Domain Filtering

You can optionally filter captured requests by specifying a domain (e.g., `example.com`) to reduce noise.

### • Request Viewer

Captured requests are displayed neatly inside the popup, including:

* HTTP method
* URL
* Timestamp
* Headers (optional for export)
* Body (if available)

### • Clear & Refresh Tools

* **Refresh:** Reloads the request view.
* **Clear:** Wipes captured records from the storage.

### • Export to Postman

All captured requests can be exported as a Postman-compatible collection (JSON file).

---

## Project Structure

```
API-Flow-Watcher/
│
├── manifest.json
├── background.js
├── popup.html
├── popup.js
├── styles.css
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## How It Works

### 1. Background Service Worker

The `background.js` file uses Chrome's `webRequest` API to listen for all outgoing requests. Each request is normalized into a structured format and saved into Chrome's `storage.local`.

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

### `webRequest` / 

Allows the extension to observe network requests.

### `tabs`

Required for retrieving the active tab during export or context-specific operations.

### `storage`

Used for storing the request logs.

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

Reloads the display of requests inside the popup.

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

* Ensure requests were captured.
* Check that `popup.js` has permission to download files.

---

## License

This project is open-source and free to modify.

---