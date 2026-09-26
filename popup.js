import { toPostman } from "./utils.js";

// Create an element with optional text; text is set via textContent so captured data is never parsed as HTML
function el(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function formatBody(body) {
  if (body === null || body === undefined) return "";
  return typeof body === "object" ? JSON.stringify(body, null, 2) : String(body);
}

function formatStatus(f) {
  if (f.error) return `error (${f.error})`;
  return f.statusCode ? String(f.statusCode) : "...";
}

function details(title, content) {
  const d = el("details");
  d.appendChild(el("summary", title));
  d.appendChild(el("pre", content));
  return d;
}

function render(flows) {
  const list = document.getElementById("list");
  list.replaceChildren();

  (flows || []).forEach((f) => {
    const div = el("div");
    div.className = "flow";

    const title = el("div");
    title.appendChild(el("b", f.method));
    title.appendChild(document.createTextNode(" — " + f.url));
    div.appendChild(title);

    div.appendChild(el("small", new Date(f.time).toLocaleTimeString()));

    const status = el("div", "status: " + formatStatus(f));
    if (f.error || f.statusCode >= 400) status.className = "status-error";
    div.appendChild(status);

    div.appendChild(details("Headers", JSON.stringify(f.headers || [], null, 2)));
    div.appendChild(details("Body", formatBody(f.requestBody)));

    list.appendChild(div);
  });
}

function showMessage(text) {
  const msg = document.getElementById("message");
  msg.textContent = text;
  clearTimeout(showMessage.timer);
  showMessage.timer = setTimeout(() => { msg.textContent = ""; }, 2000);
}

const refresh = () => chrome.runtime.sendMessage({ type: "get_flows" }, render);

document.getElementById("refresh").onclick = refresh;

document.getElementById("clear").onclick = () => {
  chrome.runtime.sendMessage({ type: "clear_flows" }, () => render([]));
};

document.getElementById("saveFilter").onclick = () => {
  const domain = document.getElementById("domain").value.trim();
  chrome.runtime.sendMessage({ type: "set_filter", domain }, (saved) => {
    document.getElementById("domain").value = saved || "";
    showMessage(saved ? `Filter saved: ${saved}` : "Filter cleared");
  });
};

document.getElementById("clearFilter").onclick = () => {
  chrome.runtime.sendMessage({ type: "set_filter", domain: null }, () => {
    document.getElementById("domain").value = "";
    showMessage("Filter cleared");
  });
};

document.getElementById("export").onclick = () => {
  chrome.runtime.sendMessage({ type: "get_flows" }, (flows) => {
    if (!flows || !flows.length) {
      showMessage("Nothing to export");
      return;
    }

    const postman = toPostman(flows);
    const blob = new Blob([JSON.stringify(postman, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "api-flow.postman_collection.json";
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
};

// Live update while the popup is open
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.flows) render(changes.flows.newValue);
});

chrome.runtime.sendMessage({ type: "get_filter" }, (domain) => {
  if (domain) document.getElementById("domain").value = domain;
});

refresh();
