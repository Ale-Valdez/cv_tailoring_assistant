import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import type { JobAnalyzer } from "@cv-tailor/application";

import { createChatModel } from "../model-factory.ts";
import type { ModelConfig } from "../model-config.ts";
import { runAnalyzeJobGraph } from "./graph.ts";
import { buildAnalyzeJobPrompt } from "./prompt.ts";
import { modelJobSchema } from "./schema.ts";

export function createJobAnalyzer(config: ModelConfig): JobAnalyzer {
  const structured = createChatModel(config).withStructuredOutput(modelJobSchema);
  return {
    async analyze(rawText: string) {
      return runAnalyzeJobGraph(rawText, {
        async structure(input) {
          const prompt = buildAnalyzeJobPrompt(input.rawText, input.previousError);
          return structured.invoke([new SystemMessage(prompt.system), new HumanMessage(prompt.user)]);
        },
      });
    },
  };
}
