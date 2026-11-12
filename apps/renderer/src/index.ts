import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 3002);
const host = "0.0.0.0";

const server = createServer((request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ status: "ok" }));
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, host, () => {
  console.log(`renderer listening on ${host}:${port}`);
});
