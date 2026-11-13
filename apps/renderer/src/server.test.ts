import { once } from "node:events";
import type { AddressInfo } from "node:net";

import { afterEach, describe, expect, it } from "vitest";

import { createRendererServer, MAX_HTML_BYTES, type HtmlToPdf } from "./server.ts";

const pdfBytes = Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d]);

async function listen(toPdf: HtmlToPdf): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createRendererServer(toPdf);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

describe("renderer HTTP", () => {
  const closers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closers.splice(0).map((close) => close()));
  });

  it("responde el healthcheck", async () => {
    const running = await listen(async () => pdfBytes);
    closers.push(running.close);

    const response = await fetch(`${running.url}/health`);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("devuelve el PDF del HTML recibido", async () => {
    let received = "";
    const running = await listen(async (html) => {
      received = html;
      return pdfBytes;
    });
    closers.push(running.close);

    const response = await fetch(`${running.url}/pdf`, {
      method: "POST",
      headers: { "content-type": "text/html; charset=utf-8" },
      body: "<html><body>Ada</body></html>",
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(pdfBytes);
    expect(received).toBe("<html><body>Ada</body></html>");
  });

  it("rechaza HTML vacío, un tipo distinto y un cuerpo demasiado grande", async () => {
    const running = await listen(async () => pdfBytes);
    closers.push(running.close);

    const empty = await fetch(`${running.url}/pdf`, {
      method: "POST",
      headers: { "content-type": "text/html" },
      body: "   ",
    });
    const otherType = await fetch(`${running.url}/pdf`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "<html></html>",
    });
    const huge = await fetch(`${running.url}/pdf`, {
      method: "POST",
      headers: { "content-type": "text/html" },
      body: "a".repeat(MAX_HTML_BYTES + 1),
    });

    expect(empty.status).toBe(400);
    expect(await empty.json()).toEqual({ error: "invalid_html" });
    expect(otherType.status).toBe(415);
    expect(huge.status).toBe(413);
    expect(await huge.json()).toEqual({ error: "payload_too_large" });
  });

  it("responde 500 si la conversión falla y 404 en otra ruta", async () => {
    const running = await listen(async () => {
      throw new Error("chromium");
    });
    closers.push(running.close);

    const failed = await fetch(`${running.url}/pdf`, {
      method: "POST",
      headers: { "content-type": "text/html" },
      body: "<html></html>",
    });
    const missing = await fetch(`${running.url}/otra`);

    expect(failed.status).toBe(500);
    expect(await failed.json()).toEqual({ error: "pdf_failed" });
    expect(missing.status).toBe(404);
  });
});
