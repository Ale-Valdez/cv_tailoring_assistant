// Fija la dependencia hacia el núcleo. La fábrica de modelos llega con el primer grafo.
import "@cv-tailor/application";
import "@cv-tailor/domain";

export { readModelConfig } from "./model-config.ts";
export type { ModelConfig } from "./model-config.ts";
