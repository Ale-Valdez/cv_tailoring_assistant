const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const PHONE_WITH_SEPARATORS = /(?:\+\d{1,3}[\s.-]*)?(?:\(\d{2,4}\)[\s.-]*)?\d{2,4}[\s.-]\d{3,4}[\s.-]\d{3,4}/g;
const COMPACT_INTERNATIONAL_PHONE = /\+\d{8,15}/g;

export function redactContactFromCvText(text: string): string {
  const withoutContact = text
    .replace(EMAIL, " ")
    .replace(PHONE_WITH_SEPARATORS, " ")
    .replace(COMPACT_INTERNATIONAL_PHONE, " ");
  return withoutContact
    .split("\n")
    .map((line) => line.replace(/[ \t]{2,}/g, " ").trim())
    .join("\n")
    .trim();
}
