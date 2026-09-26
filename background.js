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

// Oldest entries are dropped once this many flows are stored
const MAX_FLOWS = 500;

// Delay before flushing flows to storage, to batch bursts of requests
const SAVE_DELAY_MS = 300;

// True if host equals domain or is a subdomain of it
function hostMatches(host, domain) {
  return host === domain || host.endsWith("." + domain);
}

function parseUrl(url) {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
}

// Normalize user input like "https://api.example.com/path" to "api.example.com"
function normalizeDomain(input) {
  if (!input) return null;
  const value = String(input).trim().toLowerCase();
  if (!value) return null;
  const parsed = parseUrl(value.includes("://") ? value : "http://" + value);
  return parsed ? parsed.hostname : value;
}

// Checking that the url should be ignored
function shouldIgnore(url) {
  const parsed = parseUrl(url);
  if (!parsed) return true;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  return IGNORE_EXT.some(ext => path.endsWith(ext)) ||
    IGNORE_DOMAINS.some(domain => hostMatches(host, domain));
}

// Checking that the url passes the domain filter
function passesFilter(url) {
  if (!domainFilter) return true;
  const parsed = parseUrl(url);
  return !!parsed && hostMatches(parsed.hostname.toLowerCase(), domainFilter);
}

// Join all raw chunks of a request body into one byte array
function joinRaw(raw) {
  const parts = raw.filter(r => r.bytes).map(r => new Uint8Array(r.bytes));
  const size = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(size);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

// Parse request body into { body, bodyType }
function parseBody(requestBody) {
  if (!requestBody) return { body: null, bodyType: null };

  if (requestBody.formData) {
    return { body: requestBody.formData, bodyType: "formData" };
  }

  if (requestBody.raw && requestBody.raw.length) {
    const text = new TextDecoder().decode(joinRaw(requestBody.raw));
    if (!text) return { body: null, bodyType: null };
    try {
      return { body: JSON.parse(text), bodyType: "json" };
    } catch (e) {
      // Not JSON
      return { body: text, bodyType: "text" };
    }
  }

  return { body: null, bodyType: null };
}

let flows = [];
let domainFilter = null;
let saveTimer = null;

// The service worker can be stopped at any time, so state is restored from storage on every start
const ready = new Promise((resolve) => {
  chrome.storage.local.get(["flows", "domainFilter"], (res) => {
    flows = Array.isArray(res.flows) ? res.flows : [];
    domainFilter = normalizeDomain(res.domainFilter);
    resolve();
  });
});

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    chrome.storage.local.set({ flows });
  }, SAVE_DELAY_MS);
}

function findFlow(requestId) {
  for (let i = flows.length - 1; i >= 0; i--) {
    if (flows[i].requestId === requestId) return flows[i];
  }
  return null;
}

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  ready.then(() => {
    if (msg.type === "set_filter") {
      domainFilter = normalizeDomain(msg.domain);
      chrome.storage.local.set({ domainFilter });
      respond(domainFilter);
    } else if (msg.type === "get_filter") {
      respond(domainFilter);
    } else if (msg.type === "get_flows") {
      respond(flows);
    } else if (msg.type === "clear_flows") {
      flows = [];
      clearTimeout(saveTimer);
      saveTimer = null;
      chrome.storage.local.set({ flows }, () => respond(true));
    }
  });
  // Keep the channel open for the async response
  return true;
});

// Capture API requests
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.method === "OPTIONS") return;
    if (details.type !== "xmlhttprequest") return;
    if (shouldIgnore(details.url)) return;

    const { body, bodyType } = parseBody(details.requestBody);

    ready.then(() => {
      if (!passesFilter(details.url)) return;

      flows.push({
        id: crypto.randomUUID(),
        requestId: details.requestId,
        time: details.timeStamp || Date.now(),
        method: details.method,
        url: details.url,
        requestBody: body,
        bodyType
      });

      if (flows.length > MAX_FLOWS) {
        flows.splice(0, flows.length - MAX_FLOWS);
      }

      scheduleSave();
    });
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestBody"]
);

// Capture headers
chrome.webRequest.onSendHeaders.addListener(
  (details) => {
    ready.then(() => {
      const item = findFlow(details.requestId);
      if (item) {
        item.headers = details.requestHeaders || [];
        scheduleSave();
      }
    });
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] },
  ["requestHeaders", "extraHeaders"]
);

// Capture response status
chrome.webRequest.onCompleted.addListener(
  (details) => {
    ready.then(() => {
      const item = findFlow(details.requestId);
      if (item) {
        item.statusCode = details.statusCode;
        scheduleSave();
      }
    });
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] }
);

// Capture failed requests (network errors, blocked, aborted)
chrome.webRequest.onErrorOccurred.addListener(
  (details) => {
    ready.then(() => {
      const item = findFlow(details.requestId);
      if (item) {
        item.error = details.error;
        scheduleSave();
      }
    });
  },
  { urls: ["<all_urls>"], types: ["xmlhttprequest"] }
);
