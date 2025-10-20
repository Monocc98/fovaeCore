import { Building2 } from "lucide-react";
import { AdminCategoriesButton } from "../actionMenu/AdminCategoriesButton";
import { BudgetButton } from "../actionMenu/BudgetButton";

interface Props {
  mode?: "groups" | "companies" | "accounts";
}

export const ActionMenu = ({ mode }: Props) => {
  return (
    <div className="space-y-3">
      {mode === "accounts" ? (
        <>
          <AdminCategoriesButton /> <BudgetButton />
        </>
      ) : null}
      <button className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
        <div className="flex items-center space-x-3">
          <Building2 className="w-4 h-4 text-green-600" />
          <span className="text-sm font-medium text-green-700">
            Gestionar Cuentas
          </span>
        </div>
      </button>
    </div>
  );
};
