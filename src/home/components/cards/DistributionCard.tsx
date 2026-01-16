import { Activity } from "lucide-react";
import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Props {
  income: number;
  expenses: number;
}

const COLORS = ["#10b981", "#ef4444"];

export const DistributionCard = ({ income, expenses }: Props) => {
  console.log(income, expenses);

  const total = income + expenses;

  const pieData = [
    {
      name: "Ingresos",
      value: income,
      percentage: ((income / total) * 100).toFixed(1),
    },
    {
      name: "Gastos",
      value: expenses,
      percentage: ((expenses / total) * 100).toFixed(1),
    },
  ];
  return (
    <div>
      {total === 0 ? (
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="text-gray-400" size={40} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            No hay datos disponibles
          </h2>
          <p className="text-gray-600 mb-6">
            Las gráficas aparecerán cuando comiences a registrar transacciones.
          </p>
        </div>
      ) : (
        <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    "",
                  ]}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center space-x-6 mt-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Ingresos: {pieData[0].percentage}%
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600">
                Gastos: {pieData[1].percentage}%
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
