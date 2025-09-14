import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

const monthlyData = [
  { month: "Ene", ingresos: 4000000, gastos: 2400000 },
  { month: "Feb", ingresos: 3000000, gastos: 1398000 },
  { month: "Mar", ingresos: 5000000, gastos: 2800000 },
  { month: "Abr", ingresos: 2780000, gastos: 3908000 },
  { month: "May", ingresos: 1890000, gastos: 4800000 },
  { month: "Jun", ingresos: 2390000, gastos: 3800000 },
  { month: "Jul", ingresos: 7000000, gastos: 1010000 },
];

export const FinancialAnalysis = () => {
  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        Análisis Mensual
      </h4>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} />
            <YAxis
              tick={{ fontSize: 12 }}
              axisLine={false}
              tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
              labelStyle={{ color: "#374151" }}
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="ingresos"
              fill="#10b981"
              name="Ingresos"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="gastos"
              fill="#ef4444"
              name="Gastos"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
