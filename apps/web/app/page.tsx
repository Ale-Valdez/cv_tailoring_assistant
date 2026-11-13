import { ApiStatus } from "./api-status";
import { ImportFlow } from "./import-flow";
import { JobFlow } from "./job-flow";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">CV Tailor</h1>
        <p className="text-neutral-600">
          Importá un PDF, confirmá el perfil, pegá una oferta y revisá los cambios que el perfil ya respalda.
        </p>
        <ApiStatus />
      </header>
      <ImportFlow />
      <JobFlow />
    </main>
  );
}
