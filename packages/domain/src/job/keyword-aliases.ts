export interface AliasGroup {
  canonical: string;
  forms: readonly string[];
}

export const ALIAS_GROUPS: readonly AliasGroup[] = [
  { canonical: "PostgreSQL", forms: ["PostgreSQL", "Postgres", "Postgre SQL"] },
  { canonical: "JavaScript", forms: ["JavaScript", "JS"] },
  { canonical: "TypeScript", forms: ["TypeScript", "TS"] },
  { canonical: "Node.js", forms: ["Node.js", "NodeJS", "Node JS"] },
  { canonical: "Java", forms: ["Java"] },
  { canonical: "SQL", forms: ["SQL"] },
  { canonical: "Kubernetes", forms: ["Kubernetes", "K8s"] },
  { canonical: "React", forms: ["React", "React.js", "ReactJS"] },
  { canonical: "Next.js", forms: ["Next.js", "NextJS", "Next JS"] },
  { canonical: "Amazon Web Services", forms: ["Amazon Web Services", "AWS"] },
  { canonical: "CI/CD", forms: ["CI/CD", "CICD", "CI CD"] },
  { canonical: "C", forms: ["C"] },
  { canonical: "C#", forms: ["C#", "CSharp", "C Sharp"] },
  { canonical: "C++", forms: ["C++", "Cpp"] },
  { canonical: "Go", forms: ["Go", "Golang", "Go lang"] },
  { canonical: "Docker", forms: ["Docker"] },
  { canonical: "Git", forms: ["Git"] },
  { canonical: "Python", forms: ["Python"] },
  { canonical: "GraphQL", forms: ["GraphQL", "Graph QL"] },
  { canonical: "REST", forms: ["REST", "RESTful"] },
  { canonical: "HTML", forms: ["HTML"] },
  { canonical: "CSS", forms: ["CSS"] },
  { canonical: "Tailwind", forms: ["Tailwind", "TailwindCSS", "Tailwind CSS"] },
];
