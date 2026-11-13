import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { ProfileExtractor } from "@cv-tailor/application";

import { buildExtractProfilePrompt } from "./prompt.ts";
import { runExtractProfileGraph } from "./graph.ts";
import { modelProfileSchema } from "./schema.ts";
import { createChatModel } from "../model-factory.ts";
import type { ModelConfig } from "../model-config.ts";

export function createProfileExtractor(config: ModelConfig): ProfileExtractor {
  const structured = createChatModel(config).withStructuredOutput(modelProfileSchema);
  return {
    async extract(cvText: string) {
      const profile = await runExtractProfileGraph(cvText, {
        async structure(input) {
          const prompt = buildExtractProfilePrompt(input.cvText, input.previousError);
          return structured.invoke([new SystemMessage(prompt.system), new HumanMessage(prompt.user)]);
        },
      });
      return profile;
    },
  };
}
