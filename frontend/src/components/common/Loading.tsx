interface LoadingProps {
  message?: string
  fullScreen?: boolean
}

export function Loading({ message = 'Cargando...', fullScreen = false }: LoadingProps) {
  const content = (
    <div className="flex flex-col items-center justify-center">
      <div className="spinner mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white bg-opacity-75">
        {content}
      </div>
    )
  }

  return <div className="flex items-center justify-center py-12">{content}</div>
}
