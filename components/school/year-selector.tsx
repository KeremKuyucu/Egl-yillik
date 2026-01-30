'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"

interface YearSelectorProps {
    uniqueYears: (string | number)[]
    targetYear: number
}

export function YearSelector({ uniqueYears, targetYear }: YearSelectorProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const handleYearChange = (selectedYear: string) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('year', selectedYear)
        router.push(`/school?${params.toString()}`)
    }

    return (
        <div className="w-full sm:w-40">
            <Select
                defaultValue={targetYear.toString()}
                onValueChange={handleYearChange}
            >
                <SelectTrigger className="w-full h-11 bg-white/80 dark:bg-slate-900/80 border-indigo-200 dark:border-indigo-800 rounded-xl">
                    <Calendar className="h-4 w-4 mr-2 text-indigo-500" />
                    <SelectValue placeholder="Yıl Seç" />
                </SelectTrigger>
                <SelectContent>
                    {uniqueYears.map(y => (
                        <SelectItem key={y} value={y.toString()}>
                            {y} Mezunları
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
