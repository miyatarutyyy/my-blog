export type RomajiSegment = {
  mode?: "romaji";
  input: string;
  reading: string;
  output: string;
  convert: boolean;
  candidates?: readonly string[];
};

export type LiteralSegment = {
  mode: "literal";
  input: string;
};

export type SkkInputPlan = readonly (RomajiSegment | LiteralSegment)[];

export type SkkFrame = {
  committed: string;
  composing: string;
  marker: "▽" | "▼" | null;
  phase: "preedit" | "candidate" | "commit" | "direct";
};

export type KeystrokeState = {
  resolved: string;
  pending: string;
  text: string;
};

export class SkkPlanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SkkPlanError";
  }
}
