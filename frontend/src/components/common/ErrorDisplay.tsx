import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorDisplayProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorDisplay({ title = 'Error', message, onRetry, className = '' }: ErrorDisplayProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-1">{title}</h3>
          <p className="text-red-700 mb-4">{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function InlineError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-sm text-red-700">{message}</span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-red-700 hover:text-red-900 font-medium flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  )
}
