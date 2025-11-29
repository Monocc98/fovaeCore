import { useState } from "react";

export const useExpandedTree = () => {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const toggle = (key: string) => {
    const next = new Set(expanded);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpanded(next);
  };
  const isExpanded = (key: string) => expanded.has(key);
  return { expanded, toggle, isExpanded } as const;
};
