interface Props {
  balance?: number;
  income?: number;
  expenses?: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const FinancialSummary = ({
  balance = 0,
  income = 0,
  expenses = 0,
}: Props) => {
  console.log(balance, income, expenses);

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Balance Total</span>
          <span className="font-bold text-lg text-blue-900">
            {formatCurrency(balance)}
          </span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Ingresos</span>
          <span className="font-bold text-green-900">
            {formatCurrency(income)}
          </span>
        </div>
      </div>
      <div className="bg-red-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-red-700">Egresos</span>
          <span className="font-bold text-red-900">
            {formatCurrency(expenses)}
          </span>
        </div>
      </div>
      {/* <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Crecimiento Mensual</span>
          <span className="font-bold text-green-900">+5%</span>
        </div>
      </div> */}
    </div>
  );
};
