import type { Category, Subcategory, Subsubcategory } from "@/types";

export type MonthlyBudget = { [month: number]: number };

export type NodeBase =
  | ({ kind: "CATEGORY" } & Category)
  | ({ kind: "SUBCATEGORY" } & Subcategory)
  | ({ kind: "SUBSUBCATEGORY" } & Subsubcategory);

export type CategoryWithBudgets = NodeBase & {
  budgets: MonthlyBudget;
  children?: CategoryWithBudgets[];
  total?: number;
};

export function buildHierarchyFromNested(
  categories: Category[] = [],
  budgetsByLeaf: Record<string, MonthlyBudget> = {}
): CategoryWithBudgets[] {
  const toLeaf = (leaf: Subsubcategory): CategoryWithBudgets => ({
    kind: "SUBSUBCATEGORY",
    ...leaf,
    budgets: budgetsByLeaf[leaf._id] || {},
    children: [],
    total: 0,
  });

  const toSub = (sub: Subcategory): CategoryWithBudgets => {
    const children = (sub.subsubcategories ?? []).map(toLeaf);
    return { kind: "SUBCATEGORY", ...sub, budgets: {}, children, total: 0 };
  };

  const toCat = (cat: Category): CategoryWithBudgets => {
    const children = (cat.subcategories ?? []).map(toSub);
    return { kind: "CATEGORY", ...cat, budgets: {}, children, total: 0 };
  };

  return categories.map(toCat);
}
