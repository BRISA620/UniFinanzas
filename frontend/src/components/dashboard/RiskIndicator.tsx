import { useMemo } from 'react'
import { RiskIndicator as RiskIndicatorType } from '../../types'
import { formatCurrency } from '../../utils/currency'

interface RiskIndicatorProps {
  data: RiskIndicatorType
  onClick?: () => void
  currencyCode?: string
}

export function RiskIndicator({ data, onClick, currencyCode = 'USD' }: RiskIndicatorProps) {
  const { bgColor, textColor, ringColor } = useMemo(() => {
    switch (data.level) {
      case 'green':
        return {
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          ringColor: 'ring-green-500',
        }
      case 'yellow':
        return {
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          ringColor: 'ring-yellow-500',
        }
      case 'red':
        return {
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          ringColor: 'ring-red-500',
        }
      default:
        return {
          bgColor: 'bg-gray-50',
          textColor: 'text-gray-700',
          ringColor: 'ring-gray-500',
        }
    }
  }, [data.level])

  const getEmoji = () => {
    switch (data.level) {
      case 'green':
        return '🟢'
      case 'yellow':
        return '🟡'
      case 'red':
        return '🔴'
      default:
        return '⚪'
    }
  }

  return (
    <div
      onClick={onClick}
      className={`${bgColor} rounded-lg p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ring-2 ${ringColor} ring-opacity-50`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-sm font-medium ${textColor}`}>Estado del Presupuesto</h3>
        <span className="text-2xl">{getEmoji()}</span>
      </div>

      <div className="text-center">
        <div className={`text-4xl font-bold ${textColor} mb-1`}>
          {data.percentage.toFixed(1)}%
        </div>
        <div className="text-sm text-gray-600">
          {formatCurrency(data.spent, currencyCode, { minimumFractionDigits: 0, maximumFractionDigits: 0 })} /{' '}
          {formatCurrency(data.budget, currencyCode, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </div>
      </div>

      <div className="mt-3 w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            data.level === 'green'
              ? 'bg-green-500'
              : data.level === 'yellow'
              ? 'bg-yellow-500'
              : 'bg-red-500'
          }`}
          style={{ width: `${Math.min(data.percentage, 100)}%` }}
        />
      </div>

      <p className={`mt-3 text-xs ${textColor} text-center font-medium`}>{data.message}</p>

      <div className="mt-2 text-center">
        <span className="text-xs text-gray-500">Disponible: </span>
        <span className={`text-sm font-semibold ${textColor}`}>
          {formatCurrency(data.remaining, currencyCode, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  )
}
