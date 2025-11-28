import { toPostman } from "./utils.js";

function render(flows) {
  const list = document.getElementById("list");
  list.innerHTML = "";

  flows.forEach((f) => {
    const div = document.createElement("div");
    div.style = "margin-bottom:10px; padding:5px; border:1px solid #ccc; background:#fafafa;";
    div.innerHTML = `
      <b>${f.method}</b> — ${f.url}<br/>
      <small>${new Date(f.time).toLocaleTimeString()}</small><br/>
      status: ${f.statusCode || "..."}

      <details>
        <summary>Headers</summary>
        <pre>${JSON.stringify(f.headers, null, 2)}</pre>
      </details>
      <details>
        <summary>Body</summary>
        <pre>${typeof f.requestBody === "object" ? JSON.stringify(f.requestBody, null, 2) : f.requestBody || ""}</pre>
      </details>
    `;
    list.appendChild(div);
  });
}

const refresh = () => chrome.runtime.sendMessage({ type: "get_flows" }, render);

document.getElementById("refresh").onclick = refresh;

document.getElementById("clear").onclick = () => {
  chrome.runtime.sendMessage({ type: "clear_flows" }, () => render([]));
};

document.getElementById("saveFilter").onclick = () => {
  const domain = document.getElementById("domain").value.trim();
  chrome.runtime.sendMessage({ type: "set_filter", domain }, () => { });
};

document.getElementById("clearFilter").onclick = () => {
  chrome.runtime.sendMessage({ type: "set_filter", domain: null }, () => {
    document.getElementById("domain").value = "";
  });
};

document.getElementById("export").onclick = () => {
  chrome.runtime.sendMessage({ type: "get_flows" }, (flows) => {
    const postman = toPostman(flows);
    const blob = new Blob([JSON.stringify(postman, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "api-flow.postman_collection.json";
    a.click();

    URL.revokeObjectURL(url);
  });
};

chrome.runtime.sendMessage({ type: "get_filter" }, (domain) => {
  if (domain) document.getElementById("domain").value = domain;
});

refresh();
