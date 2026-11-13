export const MAX_CV_HTML_BYTES = 2_000_000;

export interface PdfGenerator {
  generate(html: string): Promise<Uint8Array>;
}
