import { expandRomajiKeystrokes } from "./keystrokes";
import { normalizeCandidates, validateRomajiSegment } from "./validation";
import type {
  LiteralSegment,
  RomajiSegment,
  SkkFrame,
  SkkInputPlan,
} from "./types";

export type SafeSkkCompileResult =
  | {
      ok: true;
      frames: SkkFrame[];
      label: string;
    }
  | {
      ok: false;
      frames: [];
      label: string;
      error: unknown;
    };

export function compileSkkFrames(plan: SkkInputPlan): SkkFrame[] {
  const frames: SkkFrame[] = [];
  let committed = "";

  for (const segment of plan) {
    if (segment.mode === "literal") {
      const result = compileLiteralSegment(segment, committed);
      frames.push(...result.frames);
      committed = result.committed;
      continue;
    }

    const result = compileRomajiSegment(segment, committed);
    frames.push(...result.frames);
    committed = result.committed;
  }

  return frames;
}

export function getSkkPlanLabel(plan: SkkInputPlan) {
  return plan
    .map((segment) => {
      return segment.mode === "literal" ? segment.input : segment.output;
    })
    .join("");
}

export function compileSkkFramesSafely(
  plan: SkkInputPlan,
  fallbackLabel = getSkkPlanLabel(plan)
): SafeSkkCompileResult {
  try {
    return {
      ok: true,
      frames: compileSkkFrames(plan),
      label: fallbackLabel,
    };
  } catch (error) {
    return {
      ok: false,
      frames: [],
      label: fallbackLabel,
      error,
    };
  }
}

function compileRomajiSegment(
  segment: RomajiSegment,
  initialCommitted: string
) {
  validateRomajiSegment(segment);

  const frames: SkkFrame[] = [];
  const states = expandRomajiKeystrokes(segment.input, segment.reading);

  if (!segment.convert) {
    for (const state of states) {
      frames.push({
        committed: `${initialCommitted}${state.text}`,
        composing: "",
        marker: null,
        phase: "direct",
      });
    }

    return { frames, committed: `${initialCommitted}${segment.output}` };
  }

  for (const state of states) {
    frames.push({
      committed: initialCommitted,
      composing: state.text,
      marker: "▽",
      phase: "preedit",
    });
  }

  for (const candidate of normalizeCandidates(segment)) {
    frames.push({
      committed: initialCommitted,
      composing: candidate,
      marker: "▼",
      phase: "candidate",
    });
  }

  const committed = `${initialCommitted}${segment.output}`;

  frames.push({
    committed,
    composing: "",
    marker: null,
    phase: "commit",
  });

  return { frames, committed };
}

function compileLiteralSegment(
  segment: LiteralSegment,
  initialCommitted: string
) {
  const frames: SkkFrame[] = [];
  let committed = initialCommitted;

  for (const character of segment.input) {
    committed += character;
    frames.push({
      committed,
      composing: "",
      marker: null,
      phase: "direct",
    });
  }

  return { frames, committed };
}
