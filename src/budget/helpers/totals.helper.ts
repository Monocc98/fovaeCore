import type { CategoryWithBudgets } from "./buildHierarchy.helper";


export function calculateTotals(nodes: CategoryWithBudgets[]): number {
let total = 0;
nodes.forEach((n) => {
if (n.children && n.children.length) {
n.total = calculateTotals(n.children);
} else {
n.total = Object.values(n.budgets).reduce((acc, v) => acc + v, 0);
}
total += n.total || 0;
});
return total;
}


export function getMonthTotal(nodes: CategoryWithBudgets[], month: number): number {
let sum = 0;
for (const n of nodes) {
if (n.children && n.children.length) sum += getMonthTotal(n.children, month);
else sum += n.budgets[month] || 0;
}
return sum;
}