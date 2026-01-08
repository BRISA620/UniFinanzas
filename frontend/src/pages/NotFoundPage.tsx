import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <p className="mt-4 text-xl text-gray-600">Página no encontrada</p>
        <Link to="/dashboard" className="mt-6 inline-block btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
