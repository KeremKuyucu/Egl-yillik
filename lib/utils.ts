import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * İsim ve soyismi düzgün birleştirir (boşluk sorununu çözer)
 * Null, undefined veya boş string değerleri filtreler
 */
export function getFullName(firstName?: string | null, lastName?: string | null): string {
  return [firstName, lastName]
    .filter((n): n is string => Boolean(n && n.trim()))
    .join(' ')
}

/**
 * İsim ve soyismin baş harflerini döndürür
 */
export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = (firstName || '').trim().charAt(0)
  const last = (lastName || '').trim().charAt(0)
  return `${first}${last}`.toUpperCase()
}
