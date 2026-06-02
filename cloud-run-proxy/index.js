const https = require("https");
const http = require("http");

const ORIGIN = "packmetrix--packmetrics-77450.europe-west4.hosted.app";
const SECRET = process.env.PROXY_SECRET || "";
const PORT = parseInt(process.env.PORT || "8080");

http.createServer((req, res) => {
  const tenantDomain = req.headers["host"] || "";

  const headers = { ...req.headers };
  headers["host"] = ORIGIN;
  headers["x-tenant-domain"] = tenantDomain;
  headers["x-proxy-secret"] = SECRET;
  delete headers["connection"];

  const proxyReq = https.request(
    { hostname: ORIGIN, port: 443, path: req.url, method: req.method, headers },
    (proxyRes) => {
      const out = { ...proxyRes.headers };
      delete out["connection"];
      res.writeHead(proxyRes.statusCode, out);
      proxyRes.pipe(res);
    }
  );

  proxyReq.on("error", (err) => {
    console.error(err.message);
    if (!res.headersSent) { res.writeHead(502); res.end("Bad gateway"); }
  });

  req.pipe(proxyReq);
}).listen(PORT, () => console.log(`proxy :${PORT} → ${ORIGIN}`));
