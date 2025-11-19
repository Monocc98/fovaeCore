// totals.helper.ts
import type { CategoryWithBudgets } from "./buildHierarchy.helper";

export function calculateTotals(nodes: CategoryWithBudgets[]): number {
  let total = 0;

  nodes.forEach((n) => {
    if (n.children && n.children.length) {
      // hijos ya vienen firmados por sus hojas
      n.total = calculateTotals(n.children);
    } else {
      const leafSum = Object.values(n.budgets).reduce((acc, v) => acc + v, 0);
      const sign = n.type === "EXPENSE" ? -1 : 1;
      n.total = leafSum * sign; // 👈 signo solo en hoja
    }
    total += n.total || 0;
  });

  return total;
}

export function getMonthTotal(nodes: CategoryWithBudgets[], month: number): number {
  let sum = 0;

  for (const n of nodes) {
    if (n.children && n.children.length) {
      // los hijos ya retornan firmado desde su hoja
      sum += getMonthTotal(n.children, month);
    } else {
      const sign = n.type === "EXPENSE" ? -1 : 1;
      sum += (n.budgets[month] || 0) * sign; // 👈 signo solo en hoja
    }
  }

  return sum;
}
