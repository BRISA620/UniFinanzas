import { useState, useEffect, useRef } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  Calculator,
  CalendarDays,
  Bell,
  Settings,
  LogOut,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Gastos', href: '/app/expenses', icon: Receipt },
  { name: 'Presupuesto', href: '/app/budget', icon: Wallet },
  { name: 'Pagos', href: '/app/payments', icon: CalendarDays },
  { name: 'Reportes', href: '/app/reports', icon: BarChart3 },
  { name: 'Simulador', href: '/app/simulator', icon: Calculator },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const {
    notifications,
    unreadCount,
    loading: notificationsLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    clear: clearNotifications,
  } = useNotifications()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  useEffect(() => {
    if (!user) {
      clearNotifications()
      return
    }
    fetchNotifications()
  }, [user, fetchNotifications, clearNotifications])

  useEffect(() => {
    if (!showNotifications) return
    fetchNotifications()
  }, [showNotifications, fetchNotifications])

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <NavLink to="/app/dashboard" className="flex items-center space-x-2">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent hidden sm:block">
                UniFinanzas
              </span>
            </NavLink>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>

          {/* Right side - Notifications & User */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
                    <span className="text-sm font-semibold text-primary-900">Notificaciones</span>
                    <button
                      onClick={() => markAllAsRead()}
                      disabled={unreadCount === 0}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 disabled:text-gray-400 transition-colors"
                    >
                      Marcar todas
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center">
                        <div className="spinner mx-auto" />
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-12 text-center">
                        <Bell className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No tienes notificaciones</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => markAsRead(notification.id)}
                          className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 last:border-0 ${
                            notification.is_read
                              ? 'bg-white hover:bg-gray-50'
                              : 'bg-primary-50/50 hover:bg-primary-50'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 text-sm">{notification.title}</p>
                              <p className="mt-1 text-xs text-gray-600">{notification.message}</p>
                            </div>
                            {!notification.is_read && (
                              <span className="mt-1 h-2 w-2 rounded-full bg-primary-600 flex-shrink-0" />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-gray-400">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white font-semibold text-sm shadow-lg">
                  {user?.profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="hidden lg:block text-sm font-medium text-gray-700">
                  {user?.profile?.full_name || user?.email}
                </span>
              </button>

              {/* User Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 border border-gray-100 overflow-hidden">
                  <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.profile?.full_name || 'Usuario'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{user?.email}</p>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowUserMenu(false)
                        navigate('/app/settings')
                      }}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      Configuración
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Cerrar sesión
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
