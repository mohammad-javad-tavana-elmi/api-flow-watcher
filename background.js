const IGNORE_EXT = [
  ".css", ".js", ".png", ".jpg", ".jpeg", ".gif",
  ".svg", ".webp", ".ico", ".ttf", ".woff", ".woff2",
  ".map", ".mp4", ".mp3", ".zip", ".rar"
];

const IGNORE_DOMAINS = [
  "yandex.ru",
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "ads.yahoo.com"
];

// Checking that the url should be ignored
function shouldIgnore(url) {
  const lower = url.toLowerCase();
  return IGNORE_EXT.some(ext => lower.endsWith(ext)) ||
    IGNORE_DOMAINS.some(domain => lower.includes(domain));
}

//  Checking that the request is probably a real API call
function isLikelyAPI(details) {
  if (details.type && ["xmlhttprequest", "fetch"].includes(details.type)) {
    return true;
  }

  const headers = details.requestHeaders || [];
  const ct = headers.find(h => h.name.toLowerCase() === "content-type");

  if (!ct) return false;

  const val = ct.value.toLowerCase();
  return (
    val.includes("application/json") ||
    val.includes("application/x-www-form-urlencoded") ||
    val.includes("multipart/form-data")
  );
}

let flows = [];
let domainFilter = null;

// Load saved domain filter
chrome.storage.local.get(["domainFilter"], (res) => {
  domainFilter = res.domainFilter || null;
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg.type === "set_filter") {
    domainFilter = msg.domain;
    chrome.storage.local.set({ domainFilter });
    respond(true);
  } else if (msg.type === "get_filter") {
    respond(domainFilter);
  } else if (msg.type === "get_flows") {
    respond(flows);
  } else if (msg.type === "clear_flows") {
    flows = [];
    chrome.storage.local.set({ flows });
    respond(true);
  }
});

// Capture API requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === "OPTIONS") return;
    if (domainFilter && !details.url.includes(domainFilter)) return;
    if (shouldIgnore(details.url)) return;

    if (!["xmlhttprequest", "fetch"].includes(details.type)) return;

    // Parse request body
    let body = null;
    if (details.requestBody) {
      if (details.requestBody.raw && details.requestBody.raw.length) {
        try {
          // Chrome API: raw array of ArrayBuffer
          body = JSON.parse(new TextDecoder().decode(details.requestBody.raw[0].bytes));
        } catch (e) {
          // Not JSON
          body = new TextDecoder().decode(details.requestBody.raw[0].bytes);
        }
      } else if (details.requestBody.formData) {
        body = details.requestBody.formData;
      }
    }

    flows.push({
      id: crypto.randomUUID(),
      time: Date.now(),
      method: details.method,
      url: details.url,
      requestBody: body
    });

    chrome.storage.local.set({ flows });
  },
  { urls: ["<all_urls>"] },
  ["requestBody"]
);

// Capture headers
chrome.webRequest.onBeforeSendHeaders.addListener(
  (details) => {
    if (domainFilter && !details.url.includes(domainFilter)) return;
    if (shouldIgnore(details.url)) return;
    if (!isLikelyAPI(details)) return;

    const item = flows.find(f => f.url === details.url && !f.headers);
    if (item) {
      item.headers = details.requestHeaders;
      chrome.storage.local.set({ flows });
    }
  },
  { urls: ["<all_urls>"] },
  ["requestHeaders"]
);

// Capture response status
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (domainFilter && !details.url.includes(domainFilter)) return;
    if (shouldIgnore(details.url)) return;

    const item = flows.find(f => f.url === details.url && !f.statusCode);
    if (item) {
      item.statusCode = details.statusCode;
      chrome.storage.local.set({ flows });
    }
  },
  { urls: ["<all_urls>"] }
);
