import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

import { ApplicationError } from "@cv-tailor/application";

import {
  extractedProfileSchema,
  formatSchemaError,
  normalizeExtractedDraft,
  type ParsedExtractedProfile,
} from "./schema.ts";

export const EXTRACT_PROFILE_MAX_ATTEMPTS = 3;

const ExtractState = new StateSchema({
  cvText: z.string(),
  previousError: z.string().nullable(),
  attemptsLeft: z.number(),
  profile: extractedProfileSchema.nullable(),
});

export interface ProfileStructurer {
  structure(input: { cvText: string; previousError: string | null }): Promise<unknown>;
}

const EXTRACTION_FAILED = "No se pudo estructurar el CV.";

export async function runExtractProfileGraph(
  cvText: string,
  structurer: ProfileStructurer,
): Promise<ParsedExtractedProfile> {
  let lastProblem: unknown = null;
  const graph = new StateGraph(ExtractState)
    .addNode("extract", async (state) => {
      try {
        const draft = await structurer.structure({
          cvText: state.cvText,
          previousError: state.previousError,
        });
        const parsed = extractedProfileSchema.safeParse(normalizeExtractedDraft(draft));
        if (!parsed.success) {
          const detail = formatSchemaError(parsed.error);
          lastProblem = detail;
          return {
            previousError: detail,
            attemptsLeft: state.attemptsLeft - 1,
          };
        }
        return { profile: parsed.data, previousError: null };
      } catch (error) {
        lastProblem = error;
        return {
          previousError: "La llamada al modelo falló.",
          attemptsLeft: state.attemptsLeft - 1,
        };
      }
    })
    .addEdge(START, "extract")
    .addConditionalEdges("extract", (state) => {
      if (state.profile !== null) {
        return END;
      }
      if (state.attemptsLeft > 0) {
        return "extract";
      }
      return END;
    })
    .compile();

  const result = await graph.invoke({
    cvText,
    previousError: null,
    attemptsLeft: EXTRACT_PROFILE_MAX_ATTEMPTS,
    profile: null,
  });

  if (result.profile === null) {
    throw new ApplicationError("extraction_failed", EXTRACTION_FAILED, lastProblem);
  }
  return result.profile;
}
