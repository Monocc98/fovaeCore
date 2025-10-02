import { formatCurrency } from "@/helpers";
import { Edit3, Save, X } from "lucide-react";
import { Fragment, useState } from "react";

interface BudgetItem {
  id: string;
  name: string;
  type: "category" | "subcategory" | "subsubcategory";
  parentId?: string;
  values: { [month: string]: number };
  total: number;
}

export const BudgetPage = () => {
  const [selectedYear, setSelectedYear] = useState("2024");
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const months = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  const [budgetData, setBudgetData] = useState<BudgetItem[]>([
    {
      id: "gastos-operativos",
      name: "Gastos Operativos",
      type: "category",
      values: {},
      total: 0,
    },
    {
      id: "oficina",
      name: "Oficina",
      type: "subcategory",
      parentId: "gastos-operativos",
      values: {},
      total: 0,
    },
    {
      id: "renta",
      name: "Renta",
      type: "subsubcategory",
      parentId: "oficina",
      values: {
        Ene: 45000,
        Feb: 45000,
        Mar: 45000,
        Abr: 45000,
        May: 45000,
        Jun: 45000,
        Jul: 45000,
        Ago: 45000,
        Sep: 45000,
        Oct: 45000,
        Nov: 45000,
        Dic: 45000,
      },
      total: 540000,
    },
    {
      id: "servicios",
      name: "Servicios",
      type: "subsubcategory",
      parentId: "oficina",
      values: {
        Ene: 12500,
        Feb: 12500,
        Mar: 12500,
        Abr: 12500,
        May: 12500,
        Jun: 12500,
        Jul: 12500,
        Ago: 12500,
        Sep: 12500,
        Oct: 12500,
        Nov: 12500,
        Dic: 12500,
      },
      total: 150000,
    },
    {
      id: "suministros",
      name: "Suministros",
      type: "subsubcategory",
      parentId: "oficina",
      values: {
        Ene: 32500,
        Feb: 32500,
        Mar: 32500,
        Abr: 32500,
        May: 32500,
        Jun: 32500,
        Jul: 32500,
        Ago: 32500,
        Sep: 32500,
        Oct: 32500,
        Nov: 32500,
        Dic: 32500,
      },
      total: 390000,
    },
    {
      id: "limpieza",
      name: "Limpieza",
      type: "subsubcategory",
      parentId: "oficina",
      values: {
        Ene: 15000,
        Feb: 15000,
        Mar: 15000,
        Abr: 15000,
        May: 15000,
        Jun: 15000,
        Jul: 15000,
        Ago: 15000,
        Sep: 15000,
        Oct: 15000,
        Nov: 15000,
        Dic: 15000,
      },
      total: 180000,
    },
    {
      id: "seguridad",
      name: "Seguridad",
      type: "subsubcategory",
      parentId: "oficina",
      values: {
        Ene: 25000,
        Feb: 25000,
        Mar: 25000,
        Abr: 25000,
        May: 25000,
        Jun: 25000,
        Jul: 25000,
        Ago: 25000,
        Sep: 25000,
        Oct: 25000,
        Nov: 25000,
        Dic: 25000,
      },
      total: 300000,
    },
    // Nueva subcategoría: Personal
    {
      id: "personal",
      name: "Personal",
      type: "subcategory",
      parentId: "gastos-operativos",
      values: {},
      total: 0,
    },
    {
      id: "salarios",
      name: "Salarios",
      type: "subsubcategory",
      parentId: "personal",
      values: {
        Ene: 120000,
        Feb: 120000,
        Mar: 120000,
        Abr: 120000,
        May: 120000,
        Jun: 120000,
        Jul: 120000,
        Ago: 120000,
        Sep: 120000,
        Oct: 120000,
        Nov: 120000,
        Dic: 120000,
      },
      total: 1440000,
    },
    {
      id: "prestaciones",
      name: "Prestaciones",
      type: "subsubcategory",
      parentId: "personal",
      values: {
        Ene: 30000,
        Feb: 30000,
        Mar: 30000,
        Abr: 30000,
        May: 30000,
        Jun: 30000,
        Jul: 30000,
        Ago: 30000,
        Sep: 30000,
        Oct: 30000,
        Nov: 30000,
        Dic: 30000,
      },
      total: 360000,
    },
    {
      id: "capacitacion",
      name: "Capacitación",
      type: "subsubcategory",
      parentId: "personal",
      values: {
        Ene: 8000,
        Feb: 8000,
        Mar: 8000,
        Abr: 8000,
        May: 8000,
        Jun: 8000,
        Jul: 8000,
        Ago: 8000,
        Sep: 8000,
        Oct: 8000,
        Nov: 8000,
        Dic: 8000,
      },
      total: 96000,
    },
    {
      id: "ingresos",
      name: "Ingresos",
      type: "category",
      values: {},
      total: 0,
    },
    {
      id: "ventas",
      name: "Ventas",
      type: "subcategory",
      parentId: "ingresos",
      values: {},
      total: 0,
    },
    {
      id: "productos",
      name: "Productos",
      type: "subsubcategory",
      parentId: "ventas",
      values: {
        Ene: 150000,
        Feb: 150000,
        Mar: 150000,
        Abr: 150000,
        May: 150000,
        Jun: 150000,
        Jul: 150000,
        Ago: 150000,
        Sep: 150000,
        Oct: 150000,
        Nov: 150000,
        Dic: 150000,
      },
      total: 1800000,
    },
    {
      id: "servicios-ventas",
      name: "Servicios",
      type: "subsubcategory",
      parentId: "ventas",
      values: {
        Ene: 60000,
        Feb: 60000,
        Mar: 60000,
        Abr: 60000,
        May: 60000,
        Jun: 60000,
        Jul: 60000,
        Ago: 60000,
        Sep: 60000,
        Oct: 60000,
        Nov: 60000,
        Dic: 60000,
      },
      total: 720000,
    },
  ]);

  const calculateCategoryTotal = (categoryId: string, month?: string) => {
    const subcategories = budgetData.filter(
      (item) => item.type === "subcategory" && item.parentId === categoryId
    );

    let total = 0;
    subcategories.forEach((subcategory) => {
      const subsubcategories = budgetData.filter(
        (item) =>
          item.type === "subsubcategory" && item.parentId === subcategory.id
      );
      subsubcategories.forEach((subsubcat) => {
        if (month) {
          total += subsubcat.values[month] || 0;
        } else {
          total += subsubcat.total;
        }
      });
    });

    return total;
  };

  const handleEditCell = (itemId: string, month: string) => {
    const item = budgetData.find((i) => i.id === itemId);
    if (item && item.type === "subsubcategory") {
      setEditingCell(`${itemId}-${month}`);
      setEditValue((item.values[month] || 0).toString());
    }
  };

  const calculateSubcategoryTotal = (subcategoryId: string, month?: string) => {
    const subsubcategories = budgetData.filter(
      (item) =>
        item.type === "subsubcategory" && item.parentId === subcategoryId
    );

    let total = 0;
    subsubcategories.forEach((subsubcat) => {
      if (month) {
        total += subsubcat.values[month] || 0;
      } else {
        total += subsubcat.total;
      }
    });

    return total;
  };

  const calculateGrandTotal = (month?: string) => {
    const categories = budgetData.filter((item) => item.type === "category");
    let total = 0;
    categories.forEach((category) => {
      total += calculateCategoryTotal(category.id, month);
    });
    return total;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleSaveCell = (itemId: string, month: string) => {
    const newValue = parseFloat(editValue) || 0;
    setBudgetData((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newValues = { ...item.values, [month]: newValue };
          const newTotal = Object.values(newValues).reduce(
            (sum, val) => sum + val,
            0
          );
          return { ...item, values: newValues, total: newTotal };
        }
        return item;
      })
    );
    setEditingCell(null);
    setEditValue("");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Gestión de Presupuestos
          </h2>
          <p className="text-gray-600">
            Administra los presupuestos por categorías para el año fiscal{" "}
            {selectedYear}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Guardar Cambios</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-4 px-6 font-semibold text-gray-900 min-w-[200px]">
                Concepto
              </th>
              {months.map((month) => (
                <th
                  key={month}
                  className="text-center py-4 px-4 font-semibold text-gray-900 min-w-[100px]"
                >
                  {month}
                </th>
              ))}
              <th className="text-center py-4 px-6 font-semibold text-gray-900 min-w-[120px]">
                Total Anual
              </th>
            </tr>
          </thead>
          <tbody>
            {budgetData
              .filter((item) => item.type === "category")
              .map((category) => (
                <Fragment key={category.id}>
                  {/* Category Row */}
                  <tr className="bg-blue-50 border-b border-gray-200">
                    <td className="py-4 px-6 font-bold text-blue-900">
                      {category.name}
                    </td>
                    {months.map((month) => (
                      <td
                        key={month}
                        className="text-center py-4 px-4 font-bold text-blue-900"
                      >
                        {formatCurrency(
                          calculateCategoryTotal(category.id, month)
                        )}
                      </td>
                    ))}
                    <td className="text-center py-4 px-6 font-bold text-blue-900">
                      {formatCurrency(calculateCategoryTotal(category.id))}
                    </td>
                  </tr>

                  {/* Subcategories */}
                  {budgetData
                    .filter(
                      (item) =>
                        item.type === "subcategory" &&
                        item.parentId === category.id
                    )
                    .map((subcategory) => (
                      <Fragment key={subcategory.id}>
                        {/* Subcategory Row */}
                        <tr className="bg-green-50 border-b border-gray-200">
                          <td className="py-3 px-8 font-semibold text-green-900">
                            {subcategory.name}
                          </td>
                          {months.map((month) => (
                            <td
                              key={month}
                              className="text-center py-3 px-4 font-semibold text-green-900"
                            >
                              {formatCurrency(
                                calculateSubcategoryTotal(subcategory.id, month)
                              )}
                            </td>
                          ))}
                          <td className="text-center py-3 px-6 font-semibold text-green-900">
                            {formatCurrency(
                              calculateSubcategoryTotal(subcategory.id)
                            )}
                          </td>
                        </tr>

                        {/* Subsubcategories */}
                        {budgetData
                          .filter(
                            (item) =>
                              item.type === "subsubcategory" &&
                              item.parentId === subcategory.id
                          )
                          .map((subsubcategory) => (
                            <tr
                              key={subsubcategory.id}
                              className="bg-gray-50 border-b border-gray-100 hover:bg-gray-100"
                            >
                              <td className="py-3 px-12 text-gray-700 flex items-center">
                                <span className="w-2 h-2 bg-blue-400 rounded-full mr-3"></span>
                                {subsubcategory.name}
                              </td>
                              {months.map((month) => (
                                <td
                                  key={month}
                                  className="text-center py-3 px-4"
                                >
                                  {editingCell ===
                                  `${subsubcategory.id}-${month}` ? (
                                    <div className="flex items-center justify-center space-x-1">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) =>
                                          setEditValue(e.target.value)
                                        }
                                        className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        onKeyPress={(e) => {
                                          if (e.key === "Enter") {
                                            handleSaveCell(
                                              subsubcategory.id,
                                              month
                                            );
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <button
                                        onClick={() =>
                                          handleSaveCell(
                                            subsubcategory.id,
                                            month
                                          )
                                        }
                                        className="text-green-600 hover:text-green-800"
                                      >
                                        <Save className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={() => setEditingCell(null)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center space-x-2">
                                      <span className="text-gray-700">
                                        {formatCurrency(
                                          subsubcategory.values[month] || 0
                                        )}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleEditCell(
                                            subsubcategory.id,
                                            month
                                          )
                                        }
                                        className="text-gray-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              ))}
                              <td className="text-center py-3 px-6 font-semibold text-gray-900">
                                {formatCurrency(subsubcategory.total)}
                              </td>
                            </tr>
                          ))}
                      </Fragment>
                    ))}
                </Fragment>
              ))}

            {/* Grand Total Row */}
            <tr className="bg-red-50 border-t-2 border-red-200">
              <td className="py-4 px-6 font-bold text-red-900 text-lg">
                Total General
              </td>
              {months.map((month) => (
                <td
                  key={month}
                  className="text-center py-4 px-4 font-bold text-red-900 text-lg"
                >
                  {formatCurrency(calculateGrandTotal(month))}
                </td>
              ))}
              <td className="text-center py-4 px-6 font-bold text-red-900 text-lg">
                {formatCurrency(calculateGrandTotal())}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
