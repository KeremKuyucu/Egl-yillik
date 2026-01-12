"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { sendReminderEmail } from "./actions"
import { toast } from "sonner"
import { Loader2, Mail, CheckCircle, AlertCircle } from "lucide-react"

interface ReminderClientPageProps {
    users: any[]
}

export default function ReminderClientPage({ users }: ReminderClientPageProps) {
    const [selectedUsers, setSelectedUsers] = useState<string[]>([])
    const [isSending, setIsSending] = useState(false)
    const [results, setResults] = useState<Record<string, 'success' | 'error' | 'pending'>>({})

    const toggleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([])
        } else {
            setSelectedUsers(users.map(u => u.id))
        }
    }

    const toggleUser = (id: string) => {
        if (selectedUsers.includes(id)) {
            setSelectedUsers(selectedUsers.filter(u => u !== id))
        } else {
            setSelectedUsers([...selectedUsers, id])
        }
    }

    const handleSendEmails = async () => {
        if (selectedUsers.length === 0) return

        if (!confirm(`${selectedUsers.length} kullanıcıya mail gönderilecek. Onaylıyor musunuz?`)) return

        setIsSending(true)
        const currentResults = { ...results }

        // Reset status for selected
        selectedUsers.forEach(id => currentResults[id] = 'pending')
        setResults(currentResults)

        let sent = 0
        let errors = 0

        for (const userId of selectedUsers) {
            const user = users.find(u => u.id === userId)
            if (!user) continue

            // Eğer istatistik yoksa veya hata varsa atla
            if (!user.stats || user.statsError) {
                setResults(prev => ({ ...prev, [userId]: 'error' }))
                errors++
                continue
            }

            // Email alanı kontrolü (profiles tablosunda email olduğu varsayımıyla)
            // Eğer profile'da email yoksa, bu kod çalışmayabilir, fallback gerekebilir.
            const userEmail = user.email

            if (!userEmail) {
                toast.error(`${user.first_name} ${user.last_name} için email bulunamadı`)
                setResults(prev => ({ ...prev, [userId]: 'error' }))
                errors++
                continue
            }

            const userName = `${user.first_name} ${user.last_name}`.trim()
            const res = await sendReminderEmail(userId, userEmail, userName, user.stats)

            if (res.success) {
                setResults(prev => ({ ...prev, [userId]: 'success' }))
                sent++
            } else {
                setResults(prev => ({ ...prev, [userId]: 'error' }))
                errors++
                console.error(`Error sending to ${userEmail}:`, res.error)
            }

            // Rate limiting prevention (polite delay)
            await new Promise(r => setTimeout(r, 200))
        }

        setIsSending(false)
        toast.info(`İşlem tamamlandı. Başarılı: ${sent}, Hata: ${errors}`)
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Mail Hatırlatma Paneli</h1>
                <div className="flex gap-4">
                    <div className="text-sm text-slate-500 self-center">
                        {selectedUsers.length} kişi seçildi
                    </div>
                    <Button
                        onClick={handleSendEmails}
                        disabled={isSending || selectedUsers.length === 0}
                        className={isSending ? "opacity-80" : ""}
                    >
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                        {isSending ? "Gönderiliyor..." : "Seçilenlere Gönder"}
                    </Button>
                </div>
            </div>

            <div className="rounded-md border bg-white dark:bg-slate-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]">
                                <Checkbox
                                    checked={selectedUsers.length === users.length && users.length > 0}
                                    onCheckedChange={toggleSelectAll}
                                />
                            </TableHead>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Sınıf</TableHead>
                            <TableHead>İstatistikler</TableHead>
                            <TableHead>Durum</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => {
                            const isSelected = selectedUsers.includes(user.id)
                            const status = results[user.id]
                            const stats = user.stats

                            return (
                                <TableRow key={user.id} className={isSelected ? "bg-slate-50 dark:bg-slate-800/50" : ""}>
                                    <TableCell>
                                        <Checkbox
                                            checked={isSelected}
                                            onCheckedChange={() => toggleUser(user.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">{user.first_name} {user.last_name}</TableCell>
                                    <TableCell className="text-slate-500 text-sm">{user.email || 'Yok'}</TableCell>
                                    <TableCell>{user.class}</TableCell>
                                    <TableCell>
                                        {stats ? (
                                            <div className="flex flex-col gap-1 text-xs">
                                                <div className="flex gap-2">
                                                    <span className="text-slate-500">Yazılan:</span>
                                                    <span className="font-bold">{stats.messages_sent_to_classmates}/{stats.total_classmates}</span>
                                                </div>
                                                <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${stats.remaining_classmates === 0 ? 'bg-emerald-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${stats.completion_percentage}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`${stats.remaining_classmates === 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                                    %{stats.completion_percentage}
                                                </span>
                                            </div>
                                        ) : (
                                            <Badge variant="destructive">Veri Yok</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {status === 'success' && <CheckCircle className="text-emerald-500 h-5 w-5" />}
                                        {status === 'error' && <AlertCircle className="text-red-500 h-5 w-5" />}
                                        {status === 'pending' && <Loader2 className="text-blue-500 h-5 w-5 animate-spin" />}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
