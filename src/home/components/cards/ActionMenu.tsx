import { AdminCategoriesButton } from "../actionMenu/AdminCategoriesButton";
import { BudgetButton } from "../actionMenu/BudgetButton";
import { AdminAccountsButton } from "../actionMenu/AdminAccountsButton";
import { ImportDataButton } from "../actionMenu/ImportDataButton";
import { GraphDropdownButton } from "../actionMenu/GraphDropdownButton";
import { DividendsButton } from "../actionMenu/DividendsButton";

interface Props {
  mode?: "groups" | "companies" | "accounts";
  onImportDataClick?: () => void;
}

export const ActionMenu = ({ mode, onImportDataClick }: Props) => {
  return (
    <div className="space-y-3">
      {mode === "accounts" ? (
        <>
          <ImportDataButton onClick={onImportDataClick ?? (() => {})} />
        </>
      ) : mode === "companies" ? (
        <>
          <DividendsButton />
          <GraphDropdownButton />
          <AdminAccountsButton />
          <BudgetButton />
          <AdminCategoriesButton />
        </>
      ) : null}
    </div>
  );
};
