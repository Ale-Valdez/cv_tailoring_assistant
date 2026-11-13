import type { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

import type { ModelConfig } from "./model-config.ts";

type ChatModelBuilder = (config: ModelConfig) => BaseChatModel;

const builders: Record<ModelConfig["provider"], ChatModelBuilder> = {
  openai: (config) => {
    const fields: ConstructorParameters<typeof ChatOpenAI>[0] = {
      model: config.model,
      apiKey: config.apiKey,
    };
    if (config.temperature !== undefined) {
      fields.temperature = config.temperature;
    }
    return new ChatOpenAI(fields);
  },
};

export function createChatModel(config: ModelConfig): BaseChatModel {
  const build = builders[config.provider];
  return build(config);
}
