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
  type?: "EXPENSE" | "INCOME"; 
};

export function buildHierarchyFromNested(
  categories: Category[] = [],
  budgetsByLeaf: Record<string, MonthlyBudget> = {}
): CategoryWithBudgets[] {

  const toLeaf = (leaf: Subsubcategory, parentType: "EXPENSE" | "INCOME"): CategoryWithBudgets => ({
    kind: "SUBSUBCATEGORY",
    ...leaf,
    budgets: budgetsByLeaf[leaf._id] || {},
    children: [],
    total: 0,
    type: parentType, // 👈 hereda tipo
  });

  const toSub = (sub: Subcategory, parentType: "EXPENSE" | "INCOME"): CategoryWithBudgets => {
    const children = (sub.subsubcategories ?? []).map(ss => toLeaf(ss, parentType));
    return { kind: "SUBCATEGORY", ...sub, budgets: {}, children, total: 0, type: parentType };
  };

  const toCat = (cat: Category): CategoryWithBudgets => {
    const catType = (cat as any).type as ("EXPENSE" | "INCOME") | undefined ?? "EXPENSE";
    const children = (cat.subcategories ?? []).map(s => toSub(s, catType));
    return { kind: "CATEGORY", ...cat, budgets: {}, children, total: 0, type: catType };
  };

  return categories.map(toCat);
}