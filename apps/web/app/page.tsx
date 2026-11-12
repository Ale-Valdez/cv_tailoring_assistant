import { ApiStatus } from "./api-status";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold tracking-tight">CV Tailor</h1>
      <p className="text-neutral-600">
        Esqueleto del monorepo. La interfaz todavía no tiene flujo de producto.
      </p>
      <ApiStatus />
    </main>
  );
}
