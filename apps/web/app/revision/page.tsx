import { JobFlow } from "../job-flow";

export const metadata = { title: "Revisión" };

export default function RevisionPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Revisión</h1>
        <p className="text-neutral-600">Aceptá, editá o rechazá cada cambio y exportá el PDF.</p>
      </header>
      <JobFlow view="review" />
    </>
  );
}
