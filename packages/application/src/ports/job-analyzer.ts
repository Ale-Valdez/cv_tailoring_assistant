export interface ExtractedRequirement {
  text: string;
  kind: "technical" | "functional";
  priority: "required" | "preferred";
}

export interface ExtractedKeyword {
  canonical: string;
  aliases: string[];
  frequency: number;
  origin: string;
}

export interface ExtractedJobContent {
  title: string | null;
  company: string | null;
  language: string | null;
  requirements: ExtractedRequirement[];
  keywords: ExtractedKeyword[];
}

export interface JobAnalyzer {
  analyze(rawText: string): Promise<ExtractedJobContent>;
}
