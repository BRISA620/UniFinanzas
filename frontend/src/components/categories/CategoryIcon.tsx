import { CATEGORY_ICON_MAP, DEFAULT_CATEGORY_ICON } from '../../utils/categoryIcons'

interface CategoryIconProps {
  icon?: string | null
  color?: string
  size?: number
  className?: string
}

export function CategoryIcon({ icon, color, size = 16, className = '' }: CategoryIconProps) {
  const mappedIcon = icon ? CATEGORY_ICON_MAP[icon] : CATEGORY_ICON_MAP[DEFAULT_CATEGORY_ICON]

  if (mappedIcon) {
    const IconComponent = mappedIcon
    return <IconComponent className={className} style={{ color }} size={size} />
  }

  if (icon) {
    return (
      <span className={className} style={{ color }}>
        {icon}
      </span>
    )
  }

  return (
    <span className={className} style={{ color }}>
      ?
    </span>
  )
}
