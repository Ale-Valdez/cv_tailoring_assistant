import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { TailoringProposer } from "@cv-tailor/application";

import { createChatModel } from "../model-factory.ts";
import type { ModelConfig } from "../model-config.ts";
import { runProposeTailoringGraph } from "./graph.ts";
import { buildProposeTailoringPrompt } from "./prompt.ts";
import { modelProposalSchema } from "./schema.ts";

export function createTailoringProposer(config: ModelConfig): TailoringProposer {
  const structured = createChatModel(config).withStructuredOutput(modelProposalSchema);
  return {
    async propose(input) {
      return runProposeTailoringGraph(input, {
        async structure({ feedback }) {
          const prompt = buildProposeTailoringPrompt({ ...input, feedback });
          return structured.invoke([new SystemMessage(prompt.system), new HumanMessage(prompt.user)]);
        },
      });
    },
  };
}
