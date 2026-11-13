export interface PdfTextReader {
  readText(pdf: Uint8Array): Promise<string>;
}
