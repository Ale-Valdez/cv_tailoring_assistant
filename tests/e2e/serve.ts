import { spawn, type ChildProcess } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { mkdir, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { API_PORT, DATABASE_NAME, PDF_PORT, WEB_PORT } from "./ports.ts";

const require = createRequire(import.meta.url);
const { Client } = require("pg") as typeof import("pg");

const root = fileURLToPath(new URL("../../", import.meta.url));
const filesDir = join(tmpdir(), "cv-tailor-e2e-files");
const children: ChildProcess[] = [];
let stopping = false;

const pdfBytes = Buffer.from("%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n");

try {
  await main();
} catch (error) {
  const message = error instanceof Error ? error.message : "No se pudo preparar la prueba e2e.";
  console.error(message);
  await stop(1);
}

async function main(): Promise<void> {
  const databaseUrl = await prepareDatabase();
  await rm(filesDir, { recursive: true, force: true });
  await mkdir(filesDir, { recursive: true });

  const pdfServer = createServer((request, response) => {
    drain(request, () => writePdf(request, response));
  });
  await listen(pdfServer);

  const api = spawnApi(databaseUrl);
  children.push(api);
  api.on("exit", (code) => {
    if (!stopping && code !== 0) {
      void stop(code ?? 1);
    }
  });
  await waitForOk(`http://127.0.0.1:${API_PORT}/health`);

  const web = spawnWeb();
  children.push(web);
  web.on("exit", (code) => {
    if (!stopping && code !== 0) {
      void stop(code ?? 1);
    }
  });

  process.on("SIGTERM", () => {
    void stop(0);
  });
  process.on("SIGINT", () => {
    void stop(0);
  });
}

async function prepareDatabase(): Promise<string> {
  try {
    process.loadEnvFile(join(root, ".env"));
  } catch {
    throw new Error("Falta .env con DATABASE_URL. Copiá .env.example y levantá Postgres (pnpm compose).");
  }
  const source = process.env.DATABASE_URL?.trim() ?? "";
  if (source.length === 0) {
    throw new Error("Falta DATABASE_URL en .env.");
  }
  const databaseUrl = databaseUrlFor(source, DATABASE_NAME);
  const admin = new Client({ connectionString: databaseUrlFor(source, "postgres") });
  try {
    await admin.connect();
  } catch (error) {
    const detail = error instanceof Error ? error.message : "sin detalle";
    throw new Error(
      `No hay conexión con Postgres (${detail}). pnpm compose publica el puerto de DB_PORT para el host.`,
    );
  }
  const existing = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [DATABASE_NAME]);
  if (existing.rowCount === 0) {
    await admin.query(`CREATE DATABASE ${DATABASE_NAME}`);
  }
  await admin.end();

  const migrated = spawn(
    "pnpm",
    ["--filter", "@cv-tailor/adapter-persistence", "exec", "prisma", "migrate", "deploy"],
    {
      cwd: root,
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: "inherit",
    },
  );
  const code = await exitCode(migrated);
  if (code !== 0) {
    throw new Error("No se pudieron aplicar las migraciones en cv_tailor_e2e.");
  }

  const db = new Client({ connectionString: databaseUrl });
  await db.connect();
  await db.query('TRUNCATE TABLE "Profile", "JobPosting", "TailoredCV"');
  await db.end();
  return databaseUrl;
}

function databaseUrlFor(source: string, name: string): string {
  const url = new URL(source);
  url.pathname = `/${name}`;
  return url.toString();
}

function spawnApi(databaseUrl: string): ChildProcess {
  return spawn("node", ["src/index.ts"], {
    cwd: join(root, "apps/api"),
    env: apiEnv(databaseUrl),
    stdio: "inherit",
  });
}

function apiEnv(databaseUrl: string): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  delete env.LLM_PROVIDER;
  delete env.LLM_MODEL;
  delete env.LLM_TEMPERATURE;
  delete env.LANGSMITH_API_KEY;
  env.E2E_FIXTURES = "true";
  env.LANGSMITH_TRACING = "false";
  env.DATABASE_URL = databaseUrl;
  env.FILES_DIR = filesDir;
  env.RENDERER_URL = `http://127.0.0.1:${PDF_PORT}`;
  env.PORT = String(API_PORT);
  return env;
}

function spawnWeb(): ChildProcess {
  const env = { ...process.env };
  delete env.OPENAI_API_KEY;
  env.API_INTERNAL_URL = `http://127.0.0.1:${API_PORT}`;
  env.PORT = String(WEB_PORT);
  env.HOSTNAME = "127.0.0.1";
  return spawn("pnpm", ["exec", "next", "dev", "--hostname", "127.0.0.1", "--port", String(WEB_PORT)], {
    cwd: join(root, "apps/web"),
    env,
    stdio: "inherit",
  });
}

function drain(request: IncomingMessage, done: () => void): void {
  request.on("data", () => undefined);
  request.on("end", done);
  request.on("error", done);
}

function writePdf(request: IncomingMessage, response: ServerResponse): void {
  if (request.method === "POST" && request.url === "/pdf") {
    response.writeHead(200, { "content-type": "application/pdf" });
    response.end(pdfBytes);
    return;
  }
  response.writeHead(404);
  response.end();
}

function listen(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(PDF_PORT, "127.0.0.1", () => {
      resolve();
    });
  });
}

async function waitForOk(url: string): Promise<void> {
  const deadline = Date.now() + 30_000;
  let last = "sin respuesta";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      last = `HTTP ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : "sin respuesta";
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 200);
    });
  }
  throw new Error(`La API de la prueba no respondió (${last}).`);
}

function exitCode(child: ChildProcess): Promise<number> {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function stop(code: number): Promise<void> {
  if (stopping) {
    return;
  }
  stopping = true;
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(code);
}
