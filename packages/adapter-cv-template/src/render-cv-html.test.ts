import { confirmProfile, parseProfile, type ConfirmedProfile } from "@cv-tailor/domain";
import { describe, expect, it } from "vitest";

import { createCvHtmlRenderer } from "./render-cv-html.ts";

const ids = {
  profile: "11111111-1111-4111-8111-111111111111",
  experience: "22222222-2222-4222-8222-222222222222",
  bullet: "33333333-3333-4333-8333-333333333333",
  skill: "44444444-4444-4444-8444-444444444444",
  project: "55555555-5555-4555-8555-555555555555",
  projectBullet: "66666666-6666-4666-8666-666666666666",
  education: "77777777-7777-4777-8777-777777777777",
  skillDocker: "88888888-8888-4888-8888-888888888888",
} as const;

function experience(overrides: Record<string, unknown> = {}) {
  return {
    id: ids.experience,
    organization: "Analytical Engines",
    role: "Desarrolladora",
    span: { start: "2020-01", end: null, ongoing: true },
    location: null,
    bullets: [{ id: ids.bullet, text: "Mantuve APIs en TypeScript." }],
    ...overrides,
  };
}

function project(overrides: Record<string, unknown> = {}) {
  return {
    id: ids.project,
    name: "Motor analítico",
    description: null,
    url: null,
    bullets: [{ id: ids.projectBullet, text: "Modelé el cálculo." }],
    ...overrides,
  };
}

function profileInput(overrides: Record<string, unknown> = {}) {
  return {
    id: ids.profile,
    status: "needs_review" as const,
    contact: {
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "+54 11 0000 0000",
      location: "Buenos Aires",
      links: [{ label: "Web", url: "https://example.com" }],
    },
    summary: "Desarrolla servicios con TypeScript.",
    language: "es",
    experiences: [experience()],
    education: [
      {
        id: ids.education,
        institution: "Universidad de Ejemplo",
        title: "Ingeniería",
        span: { start: "2014-03", end: "2019-12", ongoing: false },
      },
    ],
    skills: [{ id: ids.skill, name: "TypeScript", source: "declared_by_user" as const }],
    projects: [project()],
    ...overrides,
  };
}

function profile(overrides: Record<string, unknown> = {}): ConfirmedProfile {
  return confirmProfile(parseProfile(profileInput(overrides)));
}

describe("createCvHtmlRenderer", () => {
  const renderer = createCvHtmlRenderer();

  it("arma una columna con el nombre, el contacto y las secciones del perfil", () => {
    const html = renderer.render(profile());

    expect(html).toContain("<h1>Ada Lovelace</h1>");
    expect(html).toContain("ada@example.com");
    expect(html).toContain("mailto:ada@example.com");
    expect(html).toContain("+54 11 0000 0000");
    expect(html).toContain("Buenos Aires");
    expect(html).toContain('href="https://example.com"');
    expect(html).toContain(">Web</a>");
    expect(html).toContain("<h2>Perfil profesional</h2>");
    expect(html).toContain("Desarrolla servicios con TypeScript.");
    expect(html).toContain("<h3>Desarrolladora | Analytical Engines</h3>");
    expect(html).toContain("Enero 2020 – Actualidad");
    expect(html).toContain("Mantuve APIs en TypeScript.");
    expect(html).toContain("<h2>Proyectos destacados</h2>");
    expect(html).toContain("<h3>Motor analítico</h3>");
    expect(html).toContain("Modelé el cálculo.");
    expect(html).toContain("<h2>Habilidades técnicas</h2>");
    expect(html).toContain("TypeScript.");
    expect(html).not.toContain("declared_by_user");
    expect(html).toContain("<h3>Ingeniería</h3>");
    expect(html).toContain("Universidad de Ejemplo | Marzo 2014 – Diciembre 2019");
    expect(html).toContain("size: A4");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("Idiomas");
  });

  it("separa los párrafos del resumen y resalta el rótulo de un bullet", () => {
    const html = renderer.render(
      profile({
        summary: "Primer párrafo.\n\nSegundo párrafo.",
        experiences: [
          experience({
            bullets: [{ id: ids.bullet, text: "Optimización de rendimiento: reduje el cálculo." }],
          }),
        ],
      }),
    );

    expect(html).toContain("<p>Primer párrafo.</p><p>Segundo párrafo.</p>");
    expect(html).toContain("<strong>Optimización de rendimiento:</strong> reduje el cálculo.");
  });

  it("escapa el texto que viene del perfil", () => {
    const html = renderer.render(
      profile({
        contact: {
          name: "Ada <script>",
          email: null,
          phone: null,
          location: null,
          links: [],
        },
        summary: "Usa A & B.",
      }),
    );

    expect(html).toContain("<h1>Ada &lt;script&gt;</h1>");
    expect(html).toContain("Usa A &amp; B.");
    expect(html).not.toContain("<script>");
  });

  it("omite las secciones que el perfil no tiene", () => {
    const html = renderer.render(
      profile({
        summary: null,
        experiences: [],
        education: [],
        skills: [],
        projects: [],
        contact: {
          name: "Ada Lovelace",
          email: null,
          phone: null,
          location: null,
          links: [],
        },
      }),
    );

    expect(html).toContain("<h1>Ada Lovelace</h1>");
    expect(html).not.toContain("<h2>");
    expect(html).not.toContain("<ul");
  });

  it("usa rótulos y meses en inglés cuando el perfil está en inglés", () => {
    const html = renderer.render(profile({ language: "en" }));

    expect(html).toContain('lang="en"');
    expect(html).toContain("<h2>Professional experience</h2>");
    expect(html).toContain("January 2020 – Present");
    expect(html).toContain("<h2>Education</h2>");
    expect(html).not.toContain("Experiencia profesional");
  });

  it("muestra la url del proyecto y la ubicación del puesto", () => {
    const html = renderer.render(
      profile({
        experiences: [experience({ location: "La Plata" })],
        projects: [project({ url: "https://avilab.dev", description: "Turnos por WhatsApp." })],
      }),
    );

    expect(html).toContain("Enero 2020 – Actualidad · La Plata");
    expect(html).toContain('href="https://avilab.dev"');
    expect(html).toContain(">avilab.dev</a>");
    expect(html).toContain("Turnos por WhatsApp.");
  });

  it("conserva el orden de las habilidades", () => {
    const html = renderer.render(
      profile({
        skills: [
          { id: ids.skillDocker, name: "Docker", source: "declared_by_user" },
          { id: ids.skill, name: "TypeScript", source: "extracted_from_cv" },
        ],
      }),
    );

    expect(html).toContain("Docker, TypeScript.");
  });
});
