export type ModelConfig = {
  provider: "openai";
  model: string;
  apiKey: string;
  temperature?: number;
};

type Env = Record<string, string | undefined>;

export function readModelConfig(env: Env): ModelConfig {
  const provider = env.LLM_PROVIDER?.trim() ?? "";
  if (provider.length === 0) {
    throw new Error('Falta LLM_PROVIDER. El valor esperado es "openai".');
  }
  if (provider !== "openai") {
    throw new Error('LLM_PROVIDER debe ser "openai".');
  }

  const model = env.LLM_MODEL?.trim() ?? "";
  if (model.length === 0) {
    throw new Error("Falta LLM_MODEL.");
  }

  const apiKey = env.OPENAI_API_KEY?.trim() ?? "";
  if (apiKey.length === 0) {
    throw new Error("Falta OPENAI_API_KEY.");
  }

  const config: ModelConfig = {
    provider: "openai",
    model,
    apiKey,
  };

  const rawTemperature = env.LLM_TEMPERATURE?.trim() ?? "";
  if (rawTemperature.length > 0) {
    const temperature = Number(rawTemperature);
    if (!Number.isFinite(temperature)) {
      throw new Error("LLM_TEMPERATURE debe ser un número.");
    }
    config.temperature = temperature;
  }

  return config;
}
