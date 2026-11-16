import type { ReactNode } from "react";
import "./globals.css";
import { SiteHeader } from "./site-header";

export const metadata = {
  title: { default: "CV Tailor", template: "%s · CV Tailor" },
  description: "Adaptar un CV a una oferta sin inventar experiencia",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900 antialiased">
        <SiteHeader />
        <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
