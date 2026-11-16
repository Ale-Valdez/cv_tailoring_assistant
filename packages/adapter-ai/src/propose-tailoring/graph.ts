import { ApplicationError, type ProposedSuggestion, type TailoringProposalInput } from "@cv-tailor/application";
import { checkFabrication } from "@cv-tailor/domain";
import { END, START, StateGraph, StateSchema } from "@langchain/langgraph";
import { z } from "zod";

import { formatSchemaError, normalizeProposalDraft, proposalSchema } from "./schema.ts";

export const PROPOSE_TAILORING_MAX_ATTEMPTS = 3;

const ProposeState = new StateSchema({
  feedback: z.string().nullable(),
  attemptsLeft: z.number(),
});

export interface TailoringStructurer {
  structure(input: { feedback: string | null }): Promise<unknown>;
}

const PROPOSAL_FAILED = "No se pudieron proponer cambios.";

export async function runProposeTailoringGraph(
  input: TailoringProposalInput,
  structurer: TailoringStructurer,
): Promise<ProposedSuggestion[]> {
  const accepted: ProposedSuggestion[] = [];
  let sawSchema = false;
  let lastProblem: unknown = null;

  const graph = new StateGraph(ProposeState)
    .addNode("propose", async (state) => {
      try {
        const draft = await structurer.structure({ feedback: state.feedback });
        const parsed = proposalSchema.safeParse(normalizeProposalDraft(draft));
        if (!parsed.success) {
          const detail = formatSchemaError(parsed.error);
          lastProblem = detail;
          return { feedback: detail, attemptsLeft: state.attemptsLeft - 1 };
        }
        sawSchema = true;
        const rejected: string[] = [];
        for (const suggestion of parsed.data.suggestions) {
          const validation = checkFabrication(input.profile, input.job, suggestion);
          if (validation.outcome === "valid") {
            remember(accepted, suggestion);
            continue;
          }
          rejected.push(formatRejection(suggestion, validation.reasons));
        }
        if (rejected.length === 0) {
          return { feedback: null, attemptsLeft: state.attemptsLeft - 1 };
        }
        return { feedback: rejected.join("\n"), attemptsLeft: state.attemptsLeft - 1 };
      } catch (error) {
        lastProblem = error;
        return { feedback: "La llamada al modelo falló.", attemptsLeft: state.attemptsLeft - 1 };
      }
    })
    .addEdge(START, "propose")
    .addConditionalEdges("propose", (state) => {
      if (state.feedback === null || state.attemptsLeft <= 0) {
        return END;
      }
      return "propose";
    })
    .compile();

  await graph.invoke({ feedback: null, attemptsLeft: PROPOSE_TAILORING_MAX_ATTEMPTS });

  if (!sawSchema) {
    throw new ApplicationError("proposal_failed", PROPOSAL_FAILED, lastProblem);
  }
  return accepted;
}

function remember(accepted: ProposedSuggestion[], suggestion: ProposedSuggestion): void {
  const key = targetKey(suggestion.target);
  if (accepted.some((item) => targetKey(item.target) === key)) {
    return;
  }
  accepted.push(suggestion);
}

function targetKey(target: ProposedSuggestion["target"]): string {
  if (target.type === "bullet") {
    return `bullet:${target.bulletId}`;
  }
  if (target.type === "bullet_order") {
    const owner = target.owner;
    return owner.type === "experience"
      ? `bullet_order:experience:${owner.experienceId}`
      : `bullet_order:project:${owner.projectId}`;
  }
  return target.type;
}

function formatRejection(suggestion: ProposedSuggestion, reasons: readonly string[]): string {
  const label =
    suggestion.target.type === "bullet"
      ? `bullet ${suggestion.target.bulletId}`
      : suggestion.target.type === "bullet_order"
        ? "orden de bullets"
        : suggestion.target.type;
  return `${label}: ${reasons.join(" ")} Texto rechazado: ${suggestion.after}`;
}
