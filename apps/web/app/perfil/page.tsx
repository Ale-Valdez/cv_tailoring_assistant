import { ImportFlow } from "../import-flow";

export const metadata = { title: "Perfil" };

export default function PerfilPage() {
  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Perfil</h1>
        <p className="text-neutral-600">Importá un PDF y confirmá los datos que el CV ya tiene.</p>
      </header>
      <ImportFlow />
    </>
  );
}
