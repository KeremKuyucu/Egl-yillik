import { LucideIcon } from "lucide-react"

interface StatusItem {
    label: string
    status: boolean
    activeText: string
    inactiveText: string
    icon: LucideIcon
}

interface SystemStatusBarProps {
    items: StatusItem[]
}

export function SystemStatusBar({ items }: SystemStatusBarProps) {
    const allActive = items.every(i => i.status)

    return (
        <div className="space-y-3">
            {/* Overall Status Indicator */}
            <div className="flex items-center gap-2 px-1">
                <div className={`h-2 w-2 rounded-full ${allActive ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
                <span className="text-xs font-medium text-muted-foreground">
                    {allActive ? 'Tüm sistemler çalışıyor' : 'Bazı servisler devre dışı'}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`group relative flex items-center justify-between p-4 rounded-2xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${item.status
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-emerald-500/5'
                            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200/50 dark:border-red-800/30 hover:shadow-red-500/5'
                            }`}>
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.status
                                ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
                                }`}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{item.label}</p>
                                <p className={`text-xs font-medium ${item.status ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                                    }`}>
                                    {item.status ? item.activeText : item.inactiveText}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className={`h-2.5 w-2.5 rounded-full ${item.status ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
