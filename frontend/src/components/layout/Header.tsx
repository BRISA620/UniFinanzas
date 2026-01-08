import { useEffect, useRef, useState } from 'react'
import { Bell, LogOut, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '../../hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showNotifications])

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative p-2 text-gray-400 hover:text-gray-500"
            >
              <Bell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-5 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
                  <span className="text-sm font-semibold text-gray-900">Notificaciones</span>
                  <button
                    type="button"
                    onClick={() => markAllAsRead()}
                    disabled={unreadCount === 0}
                    className="text-xs font-medium text-primary-600 disabled:text-gray-400"
                  >
                    Marcar todas
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      Cargando...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500">
                      No tienes notificaciones
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors ${
                          notification.is_read ? 'bg-white' : 'bg-primary-50'
                        } hover:bg-gray-50`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{notification.title}</p>
                            <p className="mt-0.5 text-xs text-gray-600">{notification.message}</p>
                          </div>
                          {!notification.is_read && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary-600" />
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

          {/* User menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-x-2 p-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                {user?.profile?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="hidden lg:block">
                {user?.profile?.full_name || user?.email}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5">
                <button
                  onClick={() => {
                    setShowUserMenu(false)
                    navigate('/app/settings')
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Settings className="mr-3 h-4 w-4" />
                  Configuración
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
