import { PDFDocument, StandardFonts } from "pdf-lib";
import { expect, test } from "@playwright/test";

test("recorre importar, confirmar, analizar, aceptar y descargar", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/perfil$/);
  await expect(page.getByText("API disponible.")).toBeVisible();

  await page.getByRole("button", { name: "Entiendo, continuar" }).click();
  await page.getByLabel("Archivo PDF").setInputFiles({
    name: "cv.pdf",
    mimeType: "application/pdf",
    buffer: await pdfWithText("Ada Lovelace. Experiencia con TypeScript."),
  });
  await page.getByRole("button", { name: "Importar", exact: true }).click();

  await page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "Contacto", exact: true }) })
    .getByLabel("Nombre", { exact: true })
    .fill("Ada Lovelace");
  await page.getByRole("button", { name: "Confirmar perfil" }).click();
  await expect(page.getByText("Perfil confirmado y guardado.")).toBeVisible();

  await page.getByRole("link", { name: "Oferta", exact: true }).click();
  await expect(page).toHaveURL(/\/oferta$/);
  await page.getByLabel("Texto de la oferta").fill("Buscamos experiencia con TypeScript.");
  await page.getByRole("button", { name: "Analizar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Backend" })).toBeVisible();
  await expect(page.getByText("Experiencia con TypeScript", { exact: true })).toBeVisible();
  await expect(page.getByText("Cubierto", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Revisión", exact: true }).click();
  await expect(page).toHaveURL(/\/revision$/);
  await page.getByRole("button", { name: "Proponer cambios" }).click();
  await expect(page.getByText("Nombra el servicio sin agregar herramientas.")).toBeVisible();
  await page.getByRole("button", { name: "Aceptar", exact: true }).click();
  await expect(page.getByText("Aceptada", { exact: true })).toBeVisible();

  const exported = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar PDF" }).click();
  expect(await pdfHeader(await exported)).toBe("%PDF-");
  await expect(page.getByRole("button", { name: "Descargar versión 1" })).toBeVisible();

  const again = page.waitForEvent("download");
  await page.getByRole("button", { name: "Descargar versión 1" }).click();
  expect(await pdfHeader(await again)).toBe("%PDF-");
});

async function pdfWithText(text: string): Promise<Buffer> {
  const document = await PDFDocument.create();
  const page = document.addPage();
  const font = await document.embedFont(StandardFonts.Helvetica);
  page.drawText(text, { x: 50, y: 700, size: 18, font });
  return Buffer.from(await document.save());
}

async function pdfHeader(download: { path: () => Promise<string | null> }): Promise<string> {
  const path = await download.path();
  if (path === null) {
    return "";
  }
  const file = await import("node:fs/promises");
  const bytes = await file.readFile(path);
  return bytes.subarray(0, 5).toString("utf8");
}
