import type {
  EvidenceRef,
  JobMatchReport,
  JobPosting,
  ProfileForModel,
  SuggestionTarget,
} from "@cv-tailor/domain";

export interface ProposedSuggestion {
  target: SuggestionTarget;
  after: string;
  reason: string;
  evidence: EvidenceRef[];
}

export interface TailoringProposalInput {
  profile: ProfileForModel;
  job: JobPosting;
  match: JobMatchReport;
}

export interface TailoringProposer {
  propose(input: TailoringProposalInput): Promise<ProposedSuggestion[]>;
}
