export function formatDateKey(date) {
  return date.toISOString().slice(0, 10)
}

export function todayKey() {
  return formatDateKey(new Date())
}

export function parseDateKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) || formatDateKey(date) !== value ? null : date
}

export function addDays(dateKey, amount) {
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  date.setUTCDate(date.getUTCDate() + amount)
  return formatDateKey(date)
}

export function addMonths(dateKey, amount) {
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  date.setUTCDate(1)
  date.setUTCMonth(date.getUTCMonth() + amount)
  return formatDateKey(date)
}

export function getWeekStart(dateKey) {
  const date = parseDateKey(dateKey) ?? new Date()
  const day = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1))
  return formatDateKey(date)
}

export function getWeekEnd(dateKey) {
  return addDays(getWeekStart(dateKey), 6)
}

export function getMonthKey(dateKey) {
  return dateKey.slice(0, 7)
}

export function getNavigationDate(monthKey, currentDate = todayKey()) {
  return monthKey === getMonthKey(currentDate) ? currentDate : `${monthKey}-01`
}

export function getMonthBounds(monthKey) {
  const [year, month] = (monthKey ?? '').split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) return null
  const first = new Date(Date.UTC(year, month - 1, 1))
  const last = new Date(Date.UTC(year, month, 0))
  return { start: formatDateKey(first), end: formatDateKey(last) }
}

export function getCalendarDays(monthKey) {
  const bounds = getMonthBounds(monthKey)
  if (!bounds) return []
  const first = parseDateKey(bounds.start)
  const offset = (first.getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first)
    date.setUTCDate(1 - offset + index)
    return {
      date: formatDateKey(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === first.getUTCMonth(),
    }
  })
}
