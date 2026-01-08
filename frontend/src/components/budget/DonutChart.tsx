import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '../../utils/currency'
import { CategoryIcon } from '../categories/CategoryIcon'

interface CategoryData {
  category_id: string
  name: string
  icon: string
  color: string
  total: number
  percentage?: number
}

interface DonutChartProps {
  data: CategoryData[]
  totalSpent: number
  currencyCode: string
}

export function DonutChart({ data, totalSpent, currencyCode }: DonutChartProps) {
  // Preparar datos para el gráfico - filtrar categorías sin gasto
  const chartData = data
    .filter((cat) => cat.total > 0)
    .map((cat) => ({
      name: cat.name,
      value: cat.total,
      color: cat.color,
      icon: cat.icon,
      percentage: totalSpent > 0 ? (cat.total / totalSpent) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value) // Ordenar por mayor gasto

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3">
          <div className="flex items-center gap-2 mb-1">
            <CategoryIcon icon={data.icon} color={data.color} size={16} />
            <p className="font-semibold text-gray-900">{data.name}</p>
          </div>
          <p className="text-lg font-bold text-gray-900">
            {formatCurrency(data.value, currencyCode)}
          </p>
          <p className="text-sm text-gray-600">
            {data.percentage.toFixed(1)}% del total
          </p>
        </div>
      )
    }
    return null
  }

  // Label personalizado para el centro
  const renderCenterLabel = () => {
    return (
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-gray-900"
      >
        <tspan x="50%" dy="-0.5em" className="text-sm font-medium fill-gray-600">
          Total Gastado
        </tspan>
        <tspan x="50%" dy="1.5em" className="text-2xl font-bold">
          {formatCurrency(totalSpent, currencyCode)}
        </tspan>
      </text>
    )
  }

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No hay datos para mostrar</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Gráfico de Dona */}
        <div className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
                {renderCenterLabel()}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda - Lista de Categorías */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
            Detalle por Categoría
          </h3>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-2">
            {chartData.map((entry, index) => (
              <div
                key={`legend-${index}`}
                className="flex items-center justify-between gap-4 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <CategoryIcon
                    icon={entry.icon}
                    color={entry.color}
                    size={20}
                    className="flex-shrink-0"
                  />
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {entry.name}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-gray-900">
                    {formatCurrency(entry.value, currencyCode)}
                  </p>
                  <p className="text-xs font-semibold text-gray-600">
                    {entry.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
