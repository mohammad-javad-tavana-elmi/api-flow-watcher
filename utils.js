// Convert a captured body into a Postman request body
function toPostmanBody(f) {
  const body = f.requestBody;
  if (body === null || body === undefined || body === "") return undefined;

  if (f.bodyType === "formData" && typeof body === "object") {
    // formData values are arrays of strings
    const urlencoded = [];
    Object.entries(body).forEach(([key, values]) => {
      [].concat(values).forEach((value) => urlencoded.push({ key, value: String(value) }));
    });
    return { mode: "urlencoded", urlencoded };
  }

  if (typeof body === "object") {
    return {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } }
    };
  }

  return { mode: "raw", raw: String(body) };
}

export function toPostman(flows) {
  return {
    info: {
      name: "Captured API Flow",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: flows.map((f) => ({
      name: `${f.method} ${f.url}`,
      request: {
        method: f.method,
        header: (f.headers || []).map(h => ({ key: h.name, value: h.value })),
        url: f.url,
        body: toPostmanBody(f)
      }
    }))
  };
}
