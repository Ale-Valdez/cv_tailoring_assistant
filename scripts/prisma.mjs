import { spawn } from "node:child_process";

try {
  process.loadEnvFile(new URL("../.env", import.meta.url));
} catch {
  console.error("Falta .env con DATABASE_URL. Copiá .env.example.");
  process.exit(1);
}

const child = spawn(
  "pnpm",
  ["--filter", "@cv-tailor/adapter-persistence", "exec", "prisma", ...process.argv.slice(2)],
  { stdio: "inherit" },
);

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
