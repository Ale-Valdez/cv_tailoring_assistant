import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "CV Tailor",
  description: "Adaptar un CV a una oferta sin inventar experiencia",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-neutral-50 text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
