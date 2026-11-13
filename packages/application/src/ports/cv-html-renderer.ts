import type { ConfirmedProfile } from "@cv-tailor/domain";

export interface CvHtmlRenderer {
  render(profile: ConfirmedProfile): string;
}
