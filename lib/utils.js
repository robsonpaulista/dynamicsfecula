import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  // Datas só-dia (ex.: vencimento) vêm como 00:00 UTC e aparecem um dia a menos no fuso local
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0 && d.getUTCMilliseconds() === 0) {
    const local = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
    return new Intl.DateTimeFormat('pt-BR').format(local)
  }
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatDateTime(date) {
  if (!date) return '-'
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(date))
}

