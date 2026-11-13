import { ChatOpenAI } from "@langchain/openai";
import { describe, expect, it } from "vitest";

import { createChatModel } from "./model-factory.ts";

describe("createChatModel", () => {
  it("construye el modelo de OpenAI con el identificador configurado", () => {
    const model = createChatModel({
      provider: "openai",
      model: "gpt-6-luna",
      apiKey: "test-key",
      temperature: 0,
    });

    expect(model).toBeInstanceOf(ChatOpenAI);
    expect(model).toMatchObject({ model: "gpt-6-luna", temperature: 0 });
  });
});
