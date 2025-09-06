
export interface RawPaperSummary {
  title: string;
  mainObjective: string;
  methodology: string;
  keyFindings: string;
  implications: string;
}

export interface PaperSummary extends RawPaperSummary {
  id: string;
  createdAt: number;
}

export interface MultiPaperResponse {
  individualSummaries: RawPaperSummary[];
  comparativeSummary: string;
}
