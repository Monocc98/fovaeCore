import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Budget, Subsubcategory } from "@/types";
import {
  createBudgetAction,
  deleteBudgetAction,
  getBudgetsAction,
  updateBudgetAction,
  type BudgetsByCompanyResponse, // 👈 si renombraste el tipo, cámbialo aquí
} from "@/budget/actions/budget.actions";
import { getId } from "../helpers/ids.helper";

export type MonthlyBudget = { [month: number]: number };
export type UpsertVars = { leafId: string; month: number; amount: number };

const isTempId = (id: string) => String(id).startsWith("temp-");

// 🔁 Ahora la “llave lógica” se basa en company, no en account
const keyOf = (b: Budget) => {
  const companyId = String(
    (b as any).company ?? (b as any).companyId ?? (b as any).account
  );
  const leafId = getId((b as any).subsubcategory);
  return `${companyId}:${leafId}:${b.month}:${b.year}`;
};

const keyFromVars = (
  companyId: string | undefined,
  leafId: string,
  month: number,
  year: number
) => `${companyId}:${leafId}:${month}:${year}`;

export const useBudgets = (
  companyId: string | undefined,
  startMonth: number,
  yearForMonth: (m: number) => number,
  categories: any[]
) => {
  const queryClient = useQueryClient();

  const budgetsQ = useQuery<Budget[]>({
    queryKey: ["v2:budgets", companyId],
    queryFn: async () => {
      const resp: BudgetsByCompanyResponse = await getBudgetsAction(companyId!);
      return resp.budgets;
    },
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const budgetsResp = budgetsQ.data ?? [];

  const budgetsByLeaf = useMemo<Record<string, MonthlyBudget>>(() => {
    const map: Record<string, MonthlyBudget> = {};

    budgetsResp.forEach((b) => {
      const budgetCompanyId = String(
        (b as any).company ?? (b as any).companyId ?? (b as any).account
      );
      if (!companyId || budgetCompanyId !== companyId) return;

      const expectedYear = yearForMonth(b.month);
      if (b.year !== expectedYear) return;

      const monthWithinFY =
        (startMonth <= 12 && b.month >= startMonth) || startMonth > b.month;
      if (!monthWithinFY) return;

      const leafId =
        (b as any).subsubcategory?._id ??
        (b as any).subsubcategory?.id ??
        (b as any).subcategory?._id ??
        (b as any).subcategory?.id;
      if (!leafId) return;

      map[leafId] ||= {};
      map[leafId][b.month] = (map[leafId][b.month] || 0) + b.amount;
    });

    return map;
  }, [budgetsResp, companyId, startMonth, yearForMonth]);

  const subsubIndex = useMemo(() => {
    const map = new Map<string, Subsubcategory>();
    categories.forEach((c: any) =>
      c.subcategories?.forEach((s: any) =>
        s.subsubcategories?.forEach((ss: any) => map.set(ss._id, ss))
      )
    );
    return map;
  }, [categories]);

  const upsertBudget = useMutation({
    // --- llamada real, ahora basada en company ---
    mutationFn: async ({ leafId, month, amount }: UpsertVars) => {
      const targetYear = yearForMonth(month);

      // DELETE lógico si amount === 0
      if (amount === 0) {
        const current =
          queryClient.getQueryData<Budget[]>(["v2:budgets", companyId]) ?? [];
        const existingReal = current.find((b) => {
          if (isTempId(b.id)) return false;

          const budgetCompanyId = String(
            (b as any).company ?? (b as any).companyId ?? (b as any).account
          );

          return (
            budgetCompanyId === companyId &&
            b.month === month &&
            b.year === targetYear &&
            getId((b as any).subsubcategory) === leafId
          );
        });

        if (existingReal) {
          await deleteBudgetAction(existingReal.id);
        }

        return { deleted: true, leafId, month, year: targetYear } as any;
      }

      // create/update (según si ya existe real)
      const current =
        queryClient.getQueryData<Budget[]>(["v2:budgets", companyId]) ?? [];
      const existingReal = current.find((b) => {
        if (isTempId(b.id)) return false;

        const budgetCompanyId = String(
          (b as any).company ?? (b as any).companyId ?? (b as any).account
        );

        return (
          budgetCompanyId === companyId &&
          b.month === month &&
          b.year === targetYear &&
          getId((b as any).subsubcategory) === leafId
        );
      });

      if (existingReal) {
        return updateBudgetAction(existingReal.id, {
          ...existingReal,
          amount,
          year: targetYear,
          company: (existingReal as any).company ?? companyId,
          subsubcategory: getId((existingReal as any).subsubcategory),
        } as any);
      }

      // 👇 aquí ya NO mandamos account, sino company
      return createBudgetAction({
        year: targetYear,
        month,
        company: companyId!,
        amount,
        subsubcategory: leafId,
      } as any);
    },

    // --- optimista ---
    onMutate: async ({ leafId, month, amount }: UpsertVars) => {
      const targetYear = yearForMonth(month);

      await queryClient.cancelQueries({
        queryKey: ["v2:budgets", companyId],
      });

      const prev =
        queryClient.getQueryData<Budget[]>(["v2:budgets", companyId]) ?? [];

      if (amount === 0) {
        // en delete no tocamos cache (lo limpiaremos tras el refetch)
        return { prev, leafId, month, year: targetYear } as const;
      }

      const subsub = subsubIndex.get(leafId) ?? ({ _id: leafId } as any);

      const temp: Budget = {
        id: `temp-${Date.now()}:${companyId}:${leafId}:${month}:${targetYear}`,
        year: targetYear,
        month,
        company: companyId as any, // 👈 si tu tipo Budget aún tiene account, luego lo ajustas
        amount,
        subsubcategory: subsub,
      } as any;

      queryClient.setQueryData(["v2:budgets", companyId], [...prev, temp]);
      return { prev, leafId, month, year: targetYear } as const;
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["v2:budgets", companyId], ctx.prev);
    },

    // --- éxito: limpiamos temps y hacemos refetch ---
    onSuccess: (_newData, vars) => {
      const logicalKey = keyFromVars(
        companyId,
        vars.leafId,
        vars.month,
        yearForMonth(vars.month)
      );

      queryClient.setQueryData<Budget[]>(
        ["v2:budgets", companyId],
        (old = []) =>
          old.filter((b) => {
            const sameKey = keyOf(b) === logicalKey;
            return !(sameKey && isTempId(b.id));
          })
      );

      queryClient.invalidateQueries({ queryKey: ["v2:budgets", companyId] });
    },
  });

  return { ...budgetsQ, budgetsResp, budgetsByLeaf, upsertBudget } as const;
};
