import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function MainLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-6 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
