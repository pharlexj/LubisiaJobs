import { useMemo } from "react";
import { canProgress, QualificationLevel, InheritanceRule } from "@/lib/inheritanceUtils";

export function useInheritance(
  current: QualificationLevel,
  target: QualificationLevel,
  doca: Date,
  rules: InheritanceRule[],
  now: Date = new Date()
) {
  return useMemo(() => canProgress(current, target, doca, rules, now), [
    current,
    target,
    doca?.toISOString(),
    rules,
    now?.toISOString(),
  ]);
}