import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts'
import { formatCurrency } from '../../utils/currency'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

interface DailySpending {
  date: string
  daily_amount: number
  accumulated: number
}

interface TrendLineChartProps {
  dailyData: DailySpending[]
  budgetTotal: number
  periodStart: string
  periodEnd: string
  currencyCode: string
}

export function TrendLineChart({
  dailyData,
  budgetTotal,
  periodStart,
  periodEnd,
  currencyCode,
}: TrendLineChartProps) {
  // Calcular la línea de proyección ideal (gasto lineal)
  const totalDays = dailyData.length
  const dailyBudget = budgetTotal / totalDays

  // Preparar datos para el gráfico
  const chartData = dailyData.map((item, index) => {
    const idealSpending = dailyBudget * (index + 1)
    const date = parseISO(item.date)
    const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
    const isOverBudget = item.accumulated > idealSpending

    return {
      date: item.date,
      dateLabel: format(date, 'dd/MM', { locale: es }),
      dayOfWeek: format(date, 'EEE', { locale: es }),
      actual: item.accumulated,
      ideal: idealSpending,
      daily: item.daily_amount,
      isToday,
      isOverBudget,
    }
  })

  // Encontrar el día actual
  const todayIndex = chartData.findIndex((d) => d.isToday)
  const currentAccumulated = todayIndex >= 0 ? chartData[todayIndex].actual : 0
  const currentIdeal = todayIndex >= 0 ? chartData[todayIndex].ideal : 0
  const variance = currentAccumulated - currentIdeal
  const variancePercentage = currentIdeal > 0 ? (variance / currentIdeal) * 100 : 0

  // Tooltip personalizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-3">
          <p className="font-semibold text-gray-900 mb-2">
            {data.dayOfWeek} {data.dateLabel}
            {data.isToday && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Hoy
              </span>
            )}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Gasto del día:</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(data.daily, currencyCode)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Acumulado real:</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatCurrency(data.actual, currencyCode)}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-600">Proyección ideal:</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(data.ideal, currencyCode)}
              </span>
            </div>
            {data.isOverBudget && (
              <div className="pt-2 mt-2 border-t border-gray-200">
                <span className="text-xs text-red-600 font-medium">
                  ⚠️ Por encima del ritmo ideal
                </span>
              </div>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Determinar el color de la línea actual según el estado
  const getActualLineColor = () => {
    const percentage = (currentAccumulated / budgetTotal) * 100
    if (percentage >= 85) return '#EF4444' // red-500
    if (percentage >= 60) return '#F59E0B' // yellow-500
    return '#3B82F6' // blue-500
  }

  return (
    <div className="w-full space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200 shadow-sm">
          <p className="text-xs text-blue-700 font-semibold mb-1.5 uppercase tracking-wide">
            Gasto Actual
          </p>
          <p className="text-xl font-bold text-blue-900">
            {formatCurrency(currentAccumulated, currencyCode)}
          </p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200 shadow-sm">
          <p className="text-xs text-green-700 font-semibold mb-1.5 uppercase tracking-wide">
            Proyección Ideal
          </p>
          <p className="text-xl font-bold text-green-900">
            {formatCurrency(currentIdeal, currencyCode)}
          </p>
        </div>
        <div
          className={`rounded-xl p-4 border shadow-sm ${
            variance > 0
              ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200'
              : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200'
          }`}
        >
          <p
            className={`text-xs font-semibold mb-1.5 uppercase tracking-wide ${
              variance > 0 ? 'text-red-700' : 'text-emerald-700'
            }`}
          >
            Variación
          </p>
          <p
            className={`text-xl font-bold ${
              variance > 0 ? 'text-red-900' : 'text-emerald-900'
            }`}
          >
            {variance >= 0 ? '+' : ''}
            {formatCurrency(variance, currencyCode)}
          </p>
          <p
            className={`text-xs font-semibold mt-0.5 ${
              variance > 0 ? 'text-red-600' : 'text-emerald-600'
            }`}
          >
            {variancePercentage >= 0 ? '+' : ''}
            {variancePercentage.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={getActualLineColor()} stopOpacity={0.1} />
              <stop offset="95%" stopColor={getActualLineColor()} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickLine={{ stroke: '#E5E7EB' }}
            tickFormatter={(value) => `${Math.round(value)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}
            iconType="line"
          />

          {/* Área bajo la línea actual */}
          <Area
            type="monotone"
            dataKey="actual"
            fill="url(#colorActual)"
            stroke="none"
          />

          {/* Línea de proyección ideal (verde, punteada) */}
          <Line
            type="linear"
            dataKey="ideal"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            name="Proyección ideal"
            activeDot={{ r: 6 }}
          />

          {/* Línea de gasto real */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke={getActualLineColor()}
            strokeWidth={3}
            dot={{ fill: getActualLineColor(), r: 4 }}
            name="Gasto real"
            activeDot={{ r: 8 }}
          />

          {/* Línea de referencia del presupuesto total */}
          <ReferenceLine
            y={budgetTotal}
            stroke="#EF4444"
            strokeDasharray="3 3"
            label={{
              value: 'Límite del presupuesto',
              position: 'insideTopRight',
              fill: '#EF4444',
              fontSize: 12,
            }}
          />

          {/* Marcador del día actual */}
          {todayIndex >= 0 && (
            <ReferenceLine
              x={chartData[todayIndex].dateLabel}
              stroke="#3B82F6"
              strokeDasharray="3 3"
              label={{
                value: 'Hoy',
                position: 'top',
                fill: '#3B82F6',
                fontSize: 12,
              }}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend Explanation */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
          Guía de Interpretación
        </p>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <div className="w-4 h-0.5 bg-blue-500 mt-2 flex-shrink-0 rounded" />
            <p className="text-gray-700">
              <span className="font-semibold text-blue-600">Línea azul:</span> Tu gasto
              acumulado real día a día
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-green-500 mt-2 flex-shrink-0" />
            <p className="text-gray-700">
              <span className="font-semibold text-green-600">Línea verde punteada:</span>{' '}
              Proyección ideal de gasto lineal
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-red-500 mt-2 flex-shrink-0" />
            <p className="text-gray-700">
              <span className="font-semibold text-red-600">Línea roja:</span> Límite del
              presupuesto total
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
