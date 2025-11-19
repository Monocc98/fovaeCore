import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Budget, Subsubcategory } from "@/types";
import {
  createBudgetAction,
  deleteBudgetAction,
  getBudgetsAction,
  updateBudgetAction,
  type BudgetsByAccountResponse,
} from "@/budget/actions/budget.actions";
import { getId } from "../helpers/ids.helper";

export type MonthlyBudget = { [month: number]: number };
export type UpsertVars = { leafId: string; month: number; amount: number };

const isTempId = (id: string) => String(id).startsWith("temp-");
const keyOf = (b: Budget) =>
  `${b.account}:${getId((b as any).subsubcategory)}:${b.month}:${b.year}`;
const keyFromVars = (
  account: string | undefined,
  leafId: string,
  month: number,
  year: number
) => `${account}:${leafId}:${month}:${year}`;

export const useBudgets = (
  idAccount: string | undefined,
  startMonth: number,
  yearForMonth: (m: number) => number,
  categories: any[]
) => {
  const queryClient = useQueryClient();

  const budgetsQ = useQuery<Budget[]>({
    queryKey: ["v2:budgets", idAccount],
    queryFn: async () => {
      const resp: BudgetsByAccountResponse = await getBudgetsAction(idAccount!);
      return resp.budgets;
    },
    enabled: !!idAccount,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const budgetsResp = budgetsQ.data ?? [];

  const budgetsByLeaf = useMemo<Record<string, MonthlyBudget>>(() => {
    const map: Record<string, MonthlyBudget> = {};

    budgetsResp.forEach((b) => {
      if (b.account !== idAccount) return;

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
  }, [budgetsResp, idAccount, startMonth, yearForMonth]);

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
    // --- llamada real, sin depender de la caché para decidir create/update/delete
    mutationFn: async ({ leafId, month, amount }: UpsertVars) => {
      const targetYear = yearForMonth(month);

      if (amount === 0) {
        // Intentamos localizar un id REAL antes de borrar
        const current =
          queryClient.getQueryData<Budget[]>(["v2:budgets", idAccount]) ?? [];
        const existingReal = current.find(
          (b) =>
            !isTempId(b.id) &&
            b.account === idAccount &&
            b.month === month &&
            b.year === targetYear &&
            getId((b as any).subsubcategory) === leafId
        );
        if (existingReal) {
          await deleteBudgetAction(existingReal.id);
        }
        // Si no hay id real (solo temp), no llamamos al server. Lo limpiaremos tras el éxito “lógico”.
        return { deleted: true, leafId, month, year: targetYear } as any;
      }

      // create o update (si tu backend hace upsert al mismo endpoint, usa create siempre)
      // Aquí conservamos tu lógica: si ya existe real lo actualizas, si no creas
      const current =
        queryClient.getQueryData<Budget[]>(["v2:budgets", idAccount]) ?? [];
      const existingReal = current.find(
        (b) =>
          !isTempId(b.id) &&
          b.account === idAccount &&
          b.month === month &&
          b.year === targetYear &&
          getId((b as any).subsubcategory) === leafId
      );
      if (existingReal) {
        return updateBudgetAction(existingReal.id, {
          ...existingReal,
          amount,
          year: targetYear,
          subsubcategory: getId((existingReal as any).subsubcategory),
        } as any);
      }

      return createBudgetAction({
        year: targetYear,
        month,
        account: idAccount!,
        amount,
        subsubcategory: leafId,
      } as any);
    },

    // --- optimista: solo añadimos temp cuando amount > 0; en delete no tocamos caché
    onMutate: async ({ leafId, month, amount }: UpsertVars) => {
      const targetYear = yearForMonth(month);
      await queryClient.cancelQueries({ queryKey: ["v2:budgets", idAccount] });

      const prev =
        queryClient.getQueryData<Budget[]>(["v2:budgets", idAccount]) ?? [];

      if (amount === 0) {
        // No tocar el cache en delete
        return { prev, leafId, month, year: targetYear } as const;
      }

      // create/update optimista: agrega un temp (sin limpiar)
      const subsub = subsubIndex.get(leafId) ?? ({ _id: leafId } as any);
      const temp: Budget = {
        id: `temp-${Date.now()}:${idAccount}:${leafId}:${month}:${targetYear}`,
        year: targetYear,
        month,
        account: idAccount!,
        amount,
        subsubcategory: subsub,
      };

      queryClient.setQueryData(["v2:budgets", idAccount], [...prev, temp]);
      return { prev, leafId, month, year: targetYear } as const;
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev)
        queryClient.setQueryData(["v2:budgets", idAccount], ctx.prev);
    },

    // --- éxito: limpiamos temps por llave y pedimos refetch
    onSuccess: (_newData, vars) => {
      const logicalKey = keyFromVars(
        idAccount,
        vars.leafId,
        vars.month,
        yearForMonth(vars.month)
      );

      // 1) quitar cualquier TEMP que coincida con esa llave
      queryClient.setQueryData<Budget[]>(
        ["v2:budgets", idAccount],
        (old = []) =>
          old.filter((b) => {
            const sameKey = keyOf(b) === logicalKey;
            return !(sameKey && isTempId(b.id));
          })
      );

      // 2) siempre refetch del server (evita “desaparecer” y asegura datos correctos)
      queryClient.invalidateQueries({ queryKey: ["v2:budgets", idAccount] });
    },
  });

  return { ...budgetsQ, budgetsResp, budgetsByLeaf, upsertBudget } as const;
};
