import { Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const monthlyData = [
  { month: "Ene", ingresos: 4000000, gastos: 2400000 },
  { month: "Feb", ingresos: 3000000, gastos: 1398000 },
  { month: "Mar", ingresos: 5000000, gastos: 2800000 },
  { month: "Abr", ingresos: 2780000, gastos: 3908000 },
  { month: "May", ingresos: 1890000, gastos: 4800000 },
  { month: "Jun", ingresos: 2390000, gastos: 3800000 },
  { month: "Jul", ingresos: 7000000, gastos: 1010000 },
];

const totalIngresos = monthlyData.reduce((sum, item) => sum + item.ingresos, 0);
const totalGastos = monthlyData.reduce((sum, item) => sum + item.gastos, 0);
const totalGeneral = totalIngresos + totalGastos;

const pieData = [
  {
    name: "Ingresos",
    value: totalIngresos,
    percentage: ((totalIngresos / totalGeneral) * 100).toFixed(1),
  },
  {
    name: "Gastos",
    value: totalGastos,
    percentage: ((totalGastos / totalGeneral) * 100).toFixed(1),
  },
];

const COLORS = ["#10b981", "#ef4444"];

export const DistributionCard = () => {
  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={5}
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
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
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
    </div>
  );
};
