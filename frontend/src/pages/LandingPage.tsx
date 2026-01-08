import { useEffect } from 'react'
import { PublicHeader } from '../components/landing/PublicHeader'
import { Hero } from '../components/landing/Hero'
import { Benefits } from '../components/landing/Benefits'
import { Features } from '../components/landing/Features'

export function LandingPage() {
  useEffect(() => {
    // Set page title and meta description for SEO
    document.title = 'UniFinanzas - Control Inteligente de Finanzas Personales'
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute(
        'content',
        'Gestiona tus gastos, presupuestos y metas financieras con UniFinanzas. Herramientas profesionales para universitarios y profesionales.'
      )
    }
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <Hero />
      <Benefits />
      <Features />
    </div>
  )
}
