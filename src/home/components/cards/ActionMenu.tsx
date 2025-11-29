import { AdminCategoriesButton } from "../actionMenu/AdminCategoriesButton";
import { BudgetButton } from "../actionMenu/BudgetButton";
import { AdminAccountsButton } from "../actionMenu/AdminAccountsButton";

interface Props {
  mode?: "groups" | "companies" | "accounts";
}

export const ActionMenu = ({ mode }: Props) => {
  return (
    <div className="space-y-3">
      {mode === "accounts" ? (
        <></>
      ) : mode === "companies" ? (
        <>
          <AdminAccountsButton /> <BudgetButton /> <AdminCategoriesButton />
        </>
      ) : null}
    </div>
  );
};
