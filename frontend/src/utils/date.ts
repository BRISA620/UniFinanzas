const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const parseDateOnly = (value: string) => {
  if (!value) {
    return new Date()
  }

  if (DATE_ONLY_REGEX.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }

  return new Date(value)
}
