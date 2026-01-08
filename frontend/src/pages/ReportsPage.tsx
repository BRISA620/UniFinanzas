import { useState, useEffect } from 'react'
import apiClient from '../api/client'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { parseDateOnly } from '../utils/date'
import { FileText, Download, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type ReportPeriod = 'current_month' | 'last_month' | 'last_3_months' | 'custom'

export function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('current_month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [isExportingCsv, setIsExportingCsv] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-hide error messages after 3 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [error])

  const getDateRange = () => {
    const today = new Date()

    switch (reportPeriod) {
      case 'current_month':
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        }
      case 'last_month':
        const lastMonth = subMonths(today, 1)
        return {
          start: format(startOfMonth(lastMonth), 'yyyy-MM-dd'),
          end: format(endOfMonth(lastMonth), 'yyyy-MM-dd'),
        }
      case 'last_3_months':
        return {
          start: format(startOfMonth(subMonths(today, 2)), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        }
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate,
        }
      default:
        return {
          start: format(startOfMonth(today), 'yyyy-MM-dd'),
          end: format(endOfMonth(today), 'yyyy-MM-dd'),
        }
    }
  }

  const handleGeneratePdf = async () => {
    const { start, end } = getDateRange()
    if (!start || !end) {
      setError('Selecciona las fechas del reporte')
      return
    }

    try {
      setIsGeneratingPdf(true)
      setError(null)

      const response = await apiClient.get('/reports/pdf', {
        params: { start_date: start, end_date: end },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `reporte_gastos_${start}_${end}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al generar el PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const handleExportCsv = async () => {
    const { start, end } = getDateRange()
    if (!start || !end) {
      setError('Selecciona las fechas del reporte')
      return
    }

    try {
      setIsExportingCsv(true)
      setError(null)

      const response = await apiClient.get('/reports/export/csv', {
        params: { start_date: start, end_date: end },
        responseType: 'blob',
      })

      const blob = new Blob([response.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `gastos_${start}_${end}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError('Error al exportar CSV')
    } finally {
      setIsExportingCsv(false)
    }
  }

  const getPeriodLabel = () => {
    const { start, end } = getDateRange()
    if (!start || !end) return 'Selecciona un periodo'

    return `${format(parseDateOnly(start), 'dd MMM yyyy', { locale: es })} - ${format(
      parseDateOnly(end),
      'dd MMM yyyy',
      { locale: es }
    )}`
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes y Exportacion</h1>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative overflow-hidden bg-gradient-to-r from-red-50 to-red-100 border border-red-300 text-red-800 rounded-xl shadow-lg mb-6"
          >
            <div className="px-4 py-3 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-200 rounded-lg flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-700" />
              </div>
              <span className="font-medium flex-1">{error}</span>
            </div>
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: 3, ease: 'linear' }}
              className="h-1 bg-red-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Period Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecciona el periodo</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <button
            onClick={() => setReportPeriod('current_month')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              reportPeriod === 'current_month'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Mes actual</span>
          </button>

          <button
            onClick={() => setReportPeriod('last_month')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              reportPeriod === 'last_month'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Mes anterior</span>
          </button>

          <button
            onClick={() => setReportPeriod('last_3_months')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              reportPeriod === 'last_3_months'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Ultimos 3 meses</span>
          </button>

          <button
            onClick={() => setReportPeriod('custom')}
            className={`p-3 rounded-lg border-2 transition-colors ${
              reportPeriod === 'custom'
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Calendar className="h-5 w-5 mx-auto mb-1" />
            <span className="text-sm font-medium">Personalizado</span>
          </button>
        </div>

        {reportPeriod === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="input"
              />
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Periodo seleccionado:</strong> {getPeriodLabel()}
          </p>
        </div>
      </div>

      {/* Report Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PDF Report */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <FileText className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Reporte PDF</h3>
              <p className="text-sm text-gray-500">Reporte visual y ordenado</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Resumen general del periodo</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Gastos por categoria</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Resumen diario de gastos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Detalle de gastos (hasta 200 registros)</span>
            </div>
          </div>

          <button
            onClick={handleGeneratePdf}
            disabled={isGeneratingPdf || (reportPeriod === 'custom' && (!customStartDate || !customEndDate))}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGeneratingPdf ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar PDF
              </>
            )}
          </button>
        </div>

        {/* CSV Export */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Exportar CSV</h3>
              <p className="text-sm text-gray-500">Detalle listo para Excel y Sheets</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Incluye fecha, hora, categoria y moneda</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Compatible con Excel y Google Sheets</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Tags, recurrencia y descripcion completa</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>Ordenado por fecha y hora</span>
            </div>
          </div>

          <button
            onClick={handleExportCsv}
            disabled={isExportingCsv || (reportPeriod === 'custom' && (!customStartDate || !customEndDate))}
            className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExportingCsv ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Descargar CSV
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Informacion sobre los reportes</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>Los reportes PDF se generan con un diseno claro y resumido.</li>
          <li>El CSV incluye todos los datos para analisis detallado en hojas de calculo.</li>
          <li>Los datos exportados respetan tu configuracion de moneda.</li>
          <li>Solo se incluyen los gastos dentro del periodo seleccionado.</li>
        </ul>
      </div>
    </div>
  )
}
