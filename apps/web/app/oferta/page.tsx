import { JobFlow } from "../job-flow";

export const metadata = { title: "Oferta" };

export default function OfertaPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Oferta</h1>
        <p className="text-neutral-600">Pegá el texto y mirá qué cubre el perfil.</p>
      </header>
      <JobFlow view="offer" />
    </>
  );
}
