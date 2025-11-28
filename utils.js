export function toPostman(flows) {
  return {
    info: {
      name: "Captured API Flow",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
    },
    item: flows.map((f) => {
      let body = undefined;

      if (f.requestBody) {
        if (typeof f.requestBody === "object") {
          body = { mode: "raw", raw: JSON.stringify(f.requestBody, null, 2) };
        } else if (typeof f.requestBody === "string") {
          body = { mode: "raw", raw: f.requestBody };
        }
      }

      return {
        name: `${f.method} ${f.url}`,
        request: {
          method: f.method,
          header: (f.headers || []).map(h => ({ key: h.name, value: h.value })),
          url: f.url,
          body
        }
      };
    })
  };
}
