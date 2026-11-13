import { chromium, type Browser } from "playwright";

import { renderHtmlToPdf } from "./playwright-pdf.ts";
import { createRendererServer } from "./server.ts";

const port = Number(process.env.PORT ?? 3002);
const host = "0.0.0.0";

let browserPromise: Promise<Browser> | undefined;

function openBrowser(): Promise<Browser> {
  browserPromise ??= chromium.launch().catch((error: unknown) => {
    browserPromise = undefined;
    throw error;
  });
  return browserPromise;
}

const server = createRendererServer(async (html) => renderHtmlToPdf(await openBrowser(), html));

server.listen(port, host, () => {
  console.log(`renderer listening on ${host}:${port}`);
});

async function shutdown(): Promise<void> {
  server.close();
  const browser = await browserPromise?.catch(() => undefined);
  await browser?.close();
  process.exit(0);
}

process.on("SIGTERM", () => {
  void shutdown();
});
process.on("SIGINT", () => {
  void shutdown();
});
