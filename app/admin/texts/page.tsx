'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    FileText,
    RefreshCw,
    Sparkles,
    Ghost,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import ListView from './list-view'

export interface Profile {
    id: string
    first_name: string
    last_name: string
    school_number: string
    class: string
    user_year: number
}

export interface Text {
    id: string
    content_length: number
    created_at: string
    author: Profile
    recipient: Profile
}

export interface AnonymousText {
    id: string
    content_length: number
    display_name: string
    created_at: string
    recipient: Profile
}

export default function AdminTextsPage() {
    const [texts, setTexts] = useState<Text[]>([])
    const [anonymousTexts, setAnonymousTexts] = useState<AnonymousText[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchTexts = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            const [textsRes, anonRes] = await Promise.all([
                supabase.rpc('get_admin_texts'),
                supabase.rpc('get_admin_anonymous_texts'),
            ])

            if (textsRes.error) throw textsRes.error
            setTexts(textsRes.data || [])

            if (anonRes.error) {
                console.warn('Anonymous texts fetch error:', anonRes.error)
                setAnonymousTexts([])
            } else {
                setAnonymousTexts(anonRes.data || [])
            }
        } catch (error) {
            console.error('Texts fetch error:', error)
            toast.error('Yazılar yüklenemedi')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTexts()
    }, [])

    const uniquePeople = new Set([
        ...texts.flatMap(t => [t.author.id, t.recipient.id]),
        ...anonymousTexts.map(t => t.recipient.id),
    ]).size

    const uniqueClasses = new Set([
        ...texts.flatMap(t => [t.author.class, t.recipient.class]),
        ...anonymousTexts.map(t => t.recipient.class),
    ]).size

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-700 p-6 sm:p-8 text-white shadow-2xl shadow-purple-500/20">
                {/* Dekoratif arka plan */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
                <div className="absolute -top-32 -right-32 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-fuchsia-500/20 rounded-full blur-3xl" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl" />

                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/10">
                            <FileText className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Yazılar</h1>
                            <p className="text-white/70 text-sm mt-1">
                                Kullanıcıların birbirlerine yazdığı mesajlar
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="secondary"
                        onClick={fetchTexts}
                        disabled={isLoading}
                        className="gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border-0 text-white rounded-xl"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">Yenile</span>
                    </Button>
                </div>

                {/* Minik özet */}
                <div className="relative mt-5 flex items-center gap-3 text-sm text-white/60 flex-wrap">
                    <span className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        <strong className="text-white/90">{texts.length}</strong> yazı
                    </span>
                    <span className="w-px h-4 bg-white/20" />
                    <span className="flex items-center gap-1.5">
                        <Ghost className="h-3.5 w-3.5" />
                        <strong className="text-white/90">{anonymousTexts.length}</strong> anonim
                    </span>
                    <span className="w-px h-4 bg-white/20" />
                    <span>
                        <strong className="text-white/90">{uniquePeople}</strong> kişi
                    </span>
                    <span className="w-px h-4 bg-white/20" />
                    <span>
                        <strong className="text-white/90">{uniqueClasses}</strong> sınıf
                    </span>
                </div>
            </div>

            {/* Liste */}
            <ListView
                texts={texts}
                setTexts={setTexts}
                anonymousTexts={anonymousTexts}
                setAnonymousTexts={setAnonymousTexts}
                isLoading={isLoading}
            />
        </div>
    )
}
