import type { Browser } from "playwright";

const PDF_TIMEOUT_MS = 15_000;

export async function renderHtmlToPdf(browser: Browser, html: string): Promise<Uint8Array> {
  const page = await browser.newPage();
  try {
    page.setDefaultTimeout(PDF_TIMEOUT_MS);
    await page.emulateMedia({ media: "print" });
    await page.setContent(html, { waitUntil: "load" });
    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await page.close();
  }
}
