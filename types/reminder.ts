// types/reminder.ts veya src/types/reminder.ts

/**
 * Kullanıcının sınıf içindeki yazı istatistikleri
 */
export interface ClassStats {
    user_id: string
    class: string
    total_classmates: number
    messages_sent_to_classmates: number
    remaining_classmates: number
    completion_percentage: number
}

/**
 * Kullanıcının anket istatistikleri
 */
export interface SurveyStats {
    total: number
    completed: number
    remaining: number
    percentage: number
}

/**
 * Mail gönderim sonucu
 */
export interface EmailResult {
    success?: boolean
    error?: string
    data?: any
}

/**
 * Tüm istatistikleri içeren kullanıcı objesi
 */
export interface UserWithStats {
    id: string
    first_name: string
    last_name: string
    class: string
    level: number
    email: string | null
    stats: ClassStats
    surveyStats: SurveyStats
    statsError: string | null
    is_opted_out?: boolean
}

/**
 * Supabase RPC'den dönen ham veri formatı
 */
export interface BulkStatsRPCResponse {
    user_id: string
    first_name: string
    last_name: string
    class: string
    level: number
    email: string | null
    total_classmates: number
    messages_sent_to_classmates: number
    remaining_classmates: number
    text_completion_percentage: number
    total_survey_categories: number
    completed_surveys: number
    remaining_surveys: number
    survey_completion_percentage: number
    is_opted_out: boolean
}

/**
 * Filtre durumları
 */
export type FilterStatus =
    | 'all'
    | 'texts_incomplete'
    | 'texts_complete'
    | 'survey_incomplete'
    | 'any_incomplete'

/**
 * Sınıf filtreleri (constants'tan import)
 */
import { FilterClassType } from '@/lib/constants'
export type FilterClass = FilterClassType

/**
 * Email gönderim durumları
 */
export type EmailStatus = 'pending' | 'success' | 'error'

/**
 * Sınıf bazlı istatistikler
 */
export interface ClassStatsSummary {
    total: number
    textsComplete: number
    surveysComplete: number
}