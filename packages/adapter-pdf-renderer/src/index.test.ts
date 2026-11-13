import { once } from "node:events";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";

import { ApplicationError } from "@cv-tailor/application";
import { afterEach, describe, expect, it } from "vitest";

import { createPdfGenerator } from "./index.ts";

const pdf = Buffer.from("%PDF-1.4\n");

async function listen(): Promise<{ url: string; close: () => Promise<void> }> {
  const server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    request.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      if (body.includes("falla")) {
        response.writeHead(500, { "content-type": "application/json" });
        response.end(JSON.stringify({ error: "pdf_failed" }));
        return;
      }
      if (body.includes("no-pdf")) {
        response.writeHead(200, { "content-type": "text/plain" });
        response.end("hola");
        return;
      }
      response.writeHead(200, { "content-type": "application/pdf" });
      response.end(pdf);
    });
  });
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

describe("createPdfGenerator", () => {
  const closers: Array<() => Promise<void>> = [];

  afterEach(async () => {
    await Promise.all(closers.splice(0).map((close) => close()));
  });

  it("envía el HTML y devuelve los bytes del PDF", async () => {
    const running = await listen();
    closers.push(running.close);
    const generator = createPdfGenerator({ baseUrl: `${running.url}/` });

    const bytes = await generator.generate("<html>Ada</html>");

    expect(Buffer.from(bytes).toString("utf8")).toBe("%PDF-1.4\n");
  });

  it("no llama al renderer si el HTML está vacío o supera el tope", async () => {
    const generator = createPdfGenerator({
      baseUrl: "http://renderer.invalid",
      fetch: async () => {
        throw new Error("no debía llamar");
      },
    });

    await expect(generator.generate("  ")).rejects.toMatchObject({ code: "invalid_html" });
    await expect(generator.generate("a".repeat(2_000_001))).rejects.toMatchObject({ code: "html_too_large" });
  });

  it("traduce un fallo del renderer y un cuerpo que no es PDF", async () => {
    const running = await listen();
    closers.push(running.close);
    const generator = createPdfGenerator({ baseUrl: running.url });

    await expect(generator.generate("<html>falla</html>")).rejects.toBeInstanceOf(ApplicationError);
    await expect(generator.generate("<html>falla</html>")).rejects.toMatchObject({ code: "pdf_failed" });
    await expect(generator.generate("<html>no-pdf</html>")).rejects.toMatchObject({ code: "pdf_failed" });
  });

  it("exige la URL del renderer", () => {
    expect(() => createPdfGenerator({ baseUrl: "  " })).toThrow(/renderer/);
  });
});
