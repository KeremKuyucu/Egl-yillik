"use client"

import { useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Activity, Search, Eye, Filter } from "lucide-react"

interface Log {
    id: string
    table_name: string
    operation: 'INSERT' | 'UPDATE' | 'DELETE'
    record_id: string
    old_data: any
    new_data: any
    changed_by: string
    changed_at: string
    profile_first_name: string | null
    profile_last_name: string | null
    profile_class: string | null
}

export default function LogsClient({ logs }: { logs: Log[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedLog, setSelectedLog] = useState<Log | null>(null)
    const [operationFilter, setOperationFilter] = useState<'ALL' | 'INSERT' | 'UPDATE' | 'DELETE'>('ALL')

    const filteredLogs = logs.filter(log => {
        const matchesSearch =
            log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (log.profile_first_name + ' ' + log.profile_last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.record_id?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesOperation = operationFilter === 'ALL' || log.operation === operationFilter

        return matchesSearch && matchesOperation
    })

    const getOperationColor = (op: string) => {
        switch (op) {
            case 'INSERT': return 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200'
            case 'UPDATE': return 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200'
            case 'DELETE': return 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200'
            default: return 'bg-gray-100 text-gray-700'
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Sistem Kayıtları
                            </CardTitle>
                            <CardDescription>
                                Sistem üzerinde yapılan son değişikliklerin detaylı dökümü.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Tablo, kişi veya ID ara..."
                                    className="pl-9 w-full md:w-[250px] bg-white/50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setOperationFilter(prev => {
                                    if (prev === 'ALL') return 'INSERT'
                                    if (prev === 'INSERT') return 'UPDATE'
                                    if (prev === 'UPDATE') return 'DELETE'
                                    return 'ALL'
                                })}
                                className={operationFilter !== 'ALL' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : ''}
                            >
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-white/20 overflow-hidden bg-white/40 dark:bg-slate-900/40">
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-indigo-100/20">
                                    <TableHead>İşlem</TableHead>
                                    <TableHead>Tablo</TableHead>
                                    <TableHead>Kayıt ID</TableHead>
                                    <TableHead>İşlemi Yapan</TableHead>
                                    <TableHead>Tarih</TableHead>
                                    <TableHead className="text-right">Detay</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="hover:bg-indigo-50/10 transition-colors border-indigo-50/10">
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`uppercase text-[10px] font-bold tracking-wider ${getOperationColor(log.operation)}`}
                                                >
                                                    {log.operation}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium font-mono text-xs text-muted-foreground">
                                                {log.table_name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground max-w-[100px] truncate" title={log.record_id}>
                                                {log.record_id}
                                            </TableCell>
                                            <TableCell>
                                                {log.profile_first_name ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">
                                                            {log.profile_first_name} {log.profile_last_name}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {log.profile_class}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm font-medium text-muted-foreground italic">Sistem</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium">
                                                        {new Date(log.changed_at).toLocaleDateString('tr-TR')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {new Date(log.changed_at).toLocaleTimeString('tr-TR')}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => setSelectedLog(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                            Kayıt bulunamadı.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Badge className={selectedLog ? getOperationColor(selectedLog.operation) : ''}>
                                {selectedLog?.operation}
                            </Badge>
                            <span>İşlem Detayı</span>
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog?.table_name} tablosunda {new Date(selectedLog?.changed_at || '').toLocaleString('tr-TR')} tarihinde yapılan değişiklik.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Eski Veri</h4>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[400px]">
                                {selectedLog?.old_data ? (
                                    <pre>{JSON.stringify(selectedLog.old_data, null, 2)}</pre>
                                ) : (
                                    <span className="text-slate-500 italic">Veri yok (INSERT işlemi olabilir)</span>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Yeni Veri</h4>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg text-xs font-mono overflow-auto max-h-[400px]">
                                {selectedLog?.new_data ? (
                                    <pre>{JSON.stringify(selectedLog.new_data, null, 2)}</pre>
                                ) : (
                                    <span className="text-slate-500 italic">Veri yok (DELETE işlemi olabilir)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
