import { Modal } from './Modal'
import { AlertTriangle, Info, Trash2 } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
  details?: React.ReactNode
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
  details,
}: ConfirmDialogProps) {
  const variantConfig = {
    danger: {
      buttonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
      iconBgClass: 'bg-red-100',
      iconClass: 'text-red-600',
      Icon: Trash2,
    },
    warning: {
      buttonClass: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
      iconBgClass: 'bg-yellow-100',
      iconClass: 'text-yellow-600',
      Icon: AlertTriangle,
    },
    info: {
      buttonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
      iconBgClass: 'bg-blue-100',
      iconClass: 'text-blue-600',
      Icon: Info,
    },
  }

  const config = variantConfig[variant]
  const IconComponent = config.Icon

  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title="" size="sm">
      <div className="text-center">
        {/* Icono */}
        <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full ${config.iconBgClass} mb-4`}>
          <IconComponent className={`h-8 w-8 ${config.iconClass}`} />
        </div>

        {/* Título */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>

        {/* Mensaje */}
        <p className="text-gray-600 mb-4">{message}</p>

        {/* Detalles adicionales (si existen) */}
        {details && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            {details}
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-center gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="btn-secondary w-full sm:w-auto px-6"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`btn ${config.buttonClass} text-white w-full sm:w-auto px-6 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Procesando...
            </span>
          ) : (
            confirmText
          )}
        </button>
      </div>
    </Modal>
  )
}
