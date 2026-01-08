import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white shadow-md' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className={`text-2xl font-bold transition-colors ${scrolled ? 'text-primary-600' : 'text-white'}`}>
            UniFinanzas
          </Link>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to="/app/dashboard" className="btn-primary">
                Ir al Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`font-medium transition-colors hidden sm:block ${
                    scrolled ? 'text-gray-700 hover:text-primary-600' : 'text-white hover:text-primary-200'
                  }`}
                >
                  Iniciar Sesión
                </Link>
                <Link to="/register" className="btn-primary">
                  Crear Cuenta
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
