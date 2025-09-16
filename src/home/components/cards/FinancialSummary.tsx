interface Props {
  totalBalance: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
  }).format(amount);
}

export const FinancialSummary = ({ totalBalance }: Props) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Balance Total</span>
          <span className="font-bold text-lg text-blue-900">
            {formatCurrency(totalBalance)}
          </span>
        </div>
      </div>
      <div className="bg-green-50 p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-green-700">Crecimiento Mensual</span>
          <span className="font-bold text-green-900">+5%</span>
        </div>
      </div>
    </div>
  );
};
