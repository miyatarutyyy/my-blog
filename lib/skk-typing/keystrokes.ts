import { isRomajiRulePrefix, resolveRomajiRule } from "./romaji-rules";
import { SkkPlanError, type KeystrokeState } from "./types";

export function expandRomajiKeystrokes(
  input: string,
  expectedReading: string
): KeystrokeState[] {
  const states: KeystrokeState[] = [];
  let resolved = "";
  let pending = "";

  for (const key of input) {
    if (!isSupportedKey(key)) {
      throw new SkkPlanError(`Unsupported romaji sequence: ${input}`);
    }

    pending += key;
    ({ resolved, pending } = resolvePending({ input, resolved, pending }));
    states.push(toState(resolved, pending));
  }

  if (pending === "n") {
    resolved += "ん";
    pending = "";
    states.push(toState(resolved, pending));
  } else if (pending !== "") {
    throw new SkkPlanError(`Unsupported romaji sequence: ${input}`);
  }

  if (resolved !== expectedReading) {
    throw new SkkPlanError(
      `Romaji input "${input}" resolved to "${resolved}", but expected "${expectedReading}".`
    );
  }

  return states;
}

function resolvePending({
  input,
  resolved,
  pending,
}: {
  input: string;
  resolved: string;
  pending: string;
}) {
  let currentResolved = resolved;
  let currentPending = pending;

  while (currentPending !== "") {
    const resolvedRule = resolveRomajiRule(currentPending);
    if (resolvedRule) {
      currentResolved += resolvedRule;
      currentPending = "";
      continue;
    }

    if (currentPending.length >= 2 && currentPending.startsWith("n")) {
      const rest = currentPending.slice(1);

      if (!isRomajiRulePrefix(currentPending) && isRomajiRulePrefix(rest)) {
        currentResolved += "ん";
        currentPending = rest;
        continue;
      }
    }

    if (isSokuonPending(currentPending)) {
      currentResolved += "っ";
      currentPending = currentPending.slice(1);
      continue;
    }

    if (isRomajiRulePrefix(currentPending) || currentPending === "n") {
      break;
    }

    throw new SkkPlanError(`Unsupported romaji sequence: ${input}`);
  }

  return { resolved: currentResolved, pending: currentPending };
}

function isSokuonPending(pending: string) {
  if (pending.length < 2) {
    return false;
  }

  const [first, second] = pending;

  return (
    first === second &&
    first !== "n" &&
    isConsonant(first) &&
    isRomajiRulePrefix(pending.slice(1))
  );
}

function isConsonant(input: string) {
  return /^[bcdfghjklmnpqrstvwxyz]$/.test(input);
}

function isSupportedKey(input: string) {
  return /^[a-z]$/.test(input);
}

function toState(resolved: string, pending: string): KeystrokeState {
  return {
    resolved,
    pending,
    text: `${resolved}${pending}`,
  };
}
