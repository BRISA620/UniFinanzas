import {
  Banknote,
  Briefcase,
  Car,
  CreditCard,
  Film,
  GraduationCap,
  HeartPulse,
  Home,
  MoreHorizontal,
  Package,
  PiggyBank,
  ShoppingBag,
  Tag,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export const DEFAULT_CATEGORY_ICON = 'tag'

export const CATEGORY_ICON_OPTIONS: Array<{ key: string; label: string; Icon: LucideIcon }> = [
  { key: 'utensils', label: 'Alimentacion', Icon: Utensils },
  { key: 'car', label: 'Transporte', Icon: Car },
  { key: 'film', label: 'Entretenimiento', Icon: Film },
  { key: 'wrench', label: 'Servicios', Icon: Wrench },
  { key: 'heart-pulse', label: 'Salud', Icon: HeartPulse },
  { key: 'shopping-bag', label: 'Compras', Icon: ShoppingBag },
  { key: 'graduation-cap', label: 'Educacion', Icon: GraduationCap },
  { key: 'home', label: 'Hogar', Icon: Home },
  { key: 'zap', label: 'Servicios basicos', Icon: Zap },
  { key: 'briefcase', label: 'Trabajo', Icon: Briefcase },
  { key: 'banknote', label: 'Ingreso', Icon: Banknote },
  { key: 'piggy-bank', label: 'Ahorro', Icon: PiggyBank },
  { key: 'credit-card', label: 'Pagos', Icon: CreditCard },
  { key: 'package', label: 'General', Icon: Package },
  { key: 'more-horizontal', label: 'Otros', Icon: MoreHorizontal },
  { key: 'tag', label: 'Etiqueta', Icon: Tag },
]

export const CATEGORY_ICON_MAP = CATEGORY_ICON_OPTIONS.reduce<Record<string, LucideIcon>>((acc, item) => {
  acc[item.key] = item.Icon
  return acc
}, {})
