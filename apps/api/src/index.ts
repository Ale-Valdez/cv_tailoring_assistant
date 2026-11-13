import { readPort, readRuntimeConfig } from "./config.ts";
import { compose } from "./compose.ts";
import { createServer } from "./http/create-server.ts";
import { logger } from "./logger.ts";

try {
  const runtime = readRuntimeConfig(process.env);
  const services = compose({
    model: runtime.model,
    langsmithTracing: runtime.langsmithTracing,
    filesDir: runtime.filesDir,
    rendererUrl: runtime.rendererUrl,
  });
  const port = readPort(process.env.PORT);
  const host = "0.0.0.0";

  createServer(services).listen(port, host, () => {
    logger.info({ port, host, langsmithTracing: runtime.langsmithTracing }, "api listening");
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "Configuración inválida.";
  console.error(message);
  process.exit(1);
}
