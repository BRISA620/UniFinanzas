import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  BarChart3,
  Calculator,
  CalendarDays,
  Settings,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/app/dashboard', icon: LayoutDashboard },
  { name: 'Gastos', href: '/app/expenses', icon: Receipt },
  { name: 'Presupuesto', href: '/app/budget', icon: Wallet },
  { name: 'Pagos', href: '/app/payments', icon: CalendarDays },
  { name: 'Reportes', href: '/app/reports', icon: BarChart3 },
  { name: 'Simulador', href: '/app/simulator', icon: Calculator },
  { name: 'Ajustes', href: '/app/settings', icon: Settings },
]

export function Sidebar() {
  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex min-h-0 flex-1 flex-col bg-gray-900">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-4">
            <span className="text-2xl font-bold text-white">UniFinanzas</span>
          </div>
          <nav className="mt-8 flex-1 space-y-1 px-2">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}
