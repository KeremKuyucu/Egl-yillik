import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, ChevronRight, LucideIcon } from "lucide-react"
import Link from "next/link"

interface QuickAction {
    label: string
    description: string
    href: string
    icon: LucideIcon
    gradient: string
}

interface QuickActionsCardProps {
    actions: QuickAction[]
}

export function QuickActionsCard({ actions }: QuickActionsCardProps) {
    return (
        <Card className="border-0 shadow-xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Zap className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Hızlı Erişim</CardTitle>
                            <CardDescription>Yönetim araçlarına hızlı geçiş</CardDescription>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full font-medium">
                        {actions.length} araç
                    </span>
                </div>
            </CardHeader>
            <CardContent className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {actions.map((action, idx) => (
                        <Link key={idx} href={action.href}>
                            <div className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
                                <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${action.gradient} text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <h3 className="font-bold text-sm mb-0.5">{action.label}</h3>
                                <p className="text-[11px] text-muted-foreground leading-snug">{action.description}</p>
                                <ChevronRight className="absolute top-4 right-3 h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-300" />
                            </div>
                        </Link>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
