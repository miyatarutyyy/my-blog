import { SkkPlanError, type RomajiSegment } from "./types";

export function normalizeCandidates(segment: RomajiSegment): readonly string[] {
  if (!segment.convert) {
    return [];
  }

  if (!segment.candidates) {
    return [segment.output];
  }

  if (segment.candidates.length === 0) {
    throw new SkkPlanError("Converted segment candidates must not be empty.");
  }

  if (segment.candidates[segment.candidates.length - 1] !== segment.output) {
    throw new SkkPlanError(
      "Converted segment candidates must end with the output."
    );
  }

  return segment.candidates;
}

export function validateRomajiSegment(segment: RomajiSegment) {
  if (!segment.convert && segment.reading !== segment.output) {
    throw new SkkPlanError(
      "Direct romaji segment reading must match output when convert is false."
    );
  }

  if (!segment.convert && segment.okuriKey) {
    throw new SkkPlanError("Okuri key requires conversion.");
  }

  if (segment.okuriKey && !/^[a-z]$/.test(segment.okuriKey)) {
    throw new SkkPlanError("Okuri key must be a single lowercase romaji key.");
  }
}
