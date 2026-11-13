import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

export const MAX_HTML_BYTES = 2_000_000;

export type HtmlToPdf = (html: string) => Promise<Uint8Array>;

export function createRendererServer(toPdf: HtmlToPdf): Server {
  return createServer((request, response) => {
    void handle(request, response, toPdf);
  });
}

async function handle(request: IncomingMessage, response: ServerResponse, toPdf: HtmlToPdf): Promise<void> {
  const path = requestPath(request);

  if (request.method === "GET" && path === "/health") {
    sendJson(response, 200, { status: "ok" });
    return;
  }

  if (path !== "/pdf") {
    sendJson(response, 404, { error: "not_found" });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "method_not_allowed" });
    return;
  }

  const contentType = request.headers["content-type"] ?? "";
  if (!contentType.startsWith("text/html")) {
    sendJson(response, 415, { error: "unsupported_media_type" });
    return;
  }

  const declaredLength = Number(request.headers["content-length"] ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_HTML_BYTES) {
    sendJson(response, 413, { error: "payload_too_large" });
    request.resume();
    return;
  }

  try {
    const html = await readBody(request, MAX_HTML_BYTES);
    if (html.trim().length === 0) {
      sendJson(response, 400, { error: "invalid_html" });
      return;
    }
    const pdf = await toPdf(html);
    if (response.destroyed) {
      return;
    }
    response.writeHead(200, {
      "content-type": "application/pdf",
      "content-length": String(pdf.byteLength),
    });
    response.end(pdf);
  } catch (error) {
    if (isTooLarge(error)) {
      sendJson(response, 413, { error: "payload_too_large" });
      return;
    }
    console.error("pdf_failed", error);
    sendJson(response, 500, { error: "pdf_failed" });
  }
}

function requestPath(request: IncomingMessage): string {
  return new URL(request.url ?? "/", "http://renderer.internal").pathname;
}

function readBody(request: IncomingMessage, maxBytes: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;

    const fail = (error: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      reject(error);
    };

    request.on("data", (chunk: Buffer) => {
      if (settled) {
        return;
      }
      size += chunk.length;
      if (size > maxBytes) {
        fail(new Error("payload_too_large"));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    request.on("error", (error: Error) => {
      fail(error);
    });
  });
}

function isTooLarge(error: unknown): boolean {
  return error instanceof Error && error.message === "payload_too_large";
}

function sendJson(response: ServerResponse, status: number, body: unknown): void {
  if (response.writableEnded || response.destroyed) {
    return;
  }
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": String(Buffer.byteLength(payload)),
  });
  response.end(payload);
}
