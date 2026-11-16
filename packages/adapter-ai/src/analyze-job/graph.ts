import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

import { ApplicationError } from "@cv-tailor/application";

import { extractedJobSchema, formatSchemaError, normalizeJobDraft, type ParsedExtractedJob } from "./schema.ts";

export const ANALYZE_JOB_MAX_ATTEMPTS = 3;

const AnalyzeState = new StateSchema({
  rawText: z.string(),
  previousError: z.string().nullable(),
  attemptsLeft: z.number(),
  job: extractedJobSchema.nullable(),
});

export interface JobStructurer {
  structure(input: { rawText: string; previousError: string | null }): Promise<unknown>;
}

const ANALYSIS_FAILED = "No se pudo analizar la oferta.";



export async function runAnalyzeJobGraph(rawText: string, structurer: JobStructurer): Promise<ParsedExtractedJob> {
  let lastProblem: unknown = null;
  const graph = new StateGraph(AnalyzeState)
    .addNode("analyze", async (state) => {
      try {
        const draft = await structurer.structure({
          rawText: state.rawText,
          previousError: state.previousError,
        });
        const parsed = extractedJobSchema.safeParse(normalizeJobDraft(draft));
        if (!parsed.success) {
          const detail = formatSchemaError(parsed.error);
          lastProblem = detail;
          return {
            previousError: detail,
            attemptsLeft: state.attemptsLeft - 1,
          };
        }
        return { job: parsed.data, previousError: null };
      } catch (error) {
        lastProblem = error;
        return {
          previousError: "La llamada al modelo falló.",
          attemptsLeft: state.attemptsLeft - 1,
        };
      }
    })
    .addEdge(START, "analyze")
    .addConditionalEdges("analyze", (state) => {
      if (state.job !== null) {
        return END;
      }
      if (state.attemptsLeft > 0) {
        return "analyze";
      }
      return END;
    })
    .compile();
    //graph.getGraphViz();
  const result = await graph.invoke({
    rawText,
    previousError: null,
    attemptsLeft: ANALYZE_JOB_MAX_ATTEMPTS,
    job: null,
  });
  
  if (result.job === null) {
    throw new ApplicationError("analysis_failed", ANALYSIS_FAILED, lastProblem);
  }
  return result.job;
}
