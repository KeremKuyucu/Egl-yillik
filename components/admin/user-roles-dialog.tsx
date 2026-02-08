"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Shield, Loader2, Crown, X, Plus } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import {
    adminGetUserRoles,
    adminAddUserRole,
    adminRemoveUserRole
} from "@/app/actions/admin"

interface Role {
    key: string
    label: string
    level: number
    description: string
    badge_color: string
}

interface UserRolesDialogProps {
    userId: string
    userName: string
    availableRoles: Role[] // Dinamik roller
    trigger?: React.ReactNode
}

export function UserRolesDialog({
    userId,
    userName,
    availableRoles,
    trigger
}: UserRolesDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isFetching, setIsFetching] = useState(false)
    const [userRoles, setUserRoles] = useState<string[]>([])

    // Fetch user roles when dialog opens
    useEffect(() => {
        if (isOpen) {
            fetchUserRoles()
        }
    }, [isOpen])

    const fetchUserRoles = async () => {
        setIsFetching(true)
        try {
            const result = await adminGetUserRoles(userId)
            if (result.success && result.data) {
                setUserRoles(result.data.map(r => r.role_key))
            } else {
                toast.error(result.error || "Roller yüklenemedi")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsFetching(false)
        }
    }

    const handleToggleRole = async (roleKey: string, hasRole: boolean) => {
        setIsLoading(true)
        try {
            let result
            if (hasRole) {
                result = await adminRemoveUserRole(userId, roleKey)
                if (result.success) {
                    setUserRoles(prev => prev.filter(r => r !== roleKey))
                    toast.success("Rol kaldırıldı")
                }
            } else {
                result = await adminAddUserRole(userId, roleKey)
                if (result.success) {
                    setUserRoles(prev => [...prev, roleKey])
                    toast.success("Rol eklendi")
                }
            }

            if (!result.success) {
                toast.error(result.error || "İşlem başarısız")
            }
        } catch {
            toast.error("Bir hata oluştu")
        } finally {
            setIsLoading(false)
        }
    }

    // Sort roles by level descending
    const sortedRoles = [...availableRoles].sort((a, b) => b.level - a.level)

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Roller
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        Kullanıcı Rolleri
                    </DialogTitle>
                    <DialogDescription>
                        <span className="font-medium text-foreground">{userName}</span> kullanıcısının rollerini yönetin.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {isFetching ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {/* Current Roles */}
                            <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Mevcut Roller:</p>
                                <div className="flex flex-wrap gap-2">
                                    {userRoles.length > 0 ? (
                                        userRoles.map(roleKey => {
                                            const role = availableRoles.find(r => r.key === roleKey)
                                            return (
                                                <Badge
                                                    key={roleKey}
                                                    className={cn(
                                                        "gap-1 border",
                                                        role?.badge_color || ""
                                                    )}
                                                >
                                                    {role?.label || roleKey}
                                                    <button
                                                        onClick={() => handleToggleRole(roleKey, true)}
                                                        disabled={isLoading}
                                                        className="ml-1 hover:bg-black/10 rounded-full p-0.5"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            )
                                        })
                                    ) : (
                                        <span className="text-sm text-muted-foreground">Rol yok</span>
                                    )}
                                </div>
                            </div>

                            {/* All Roles Checkboxes */}
                            <div className="border rounded-lg divide-y">
                                {sortedRoles.map(role => {
                                    const hasRole = userRoles.includes(role.key)
                                    return (
                                        <div
                                            key={role.key}
                                            className={cn(
                                                "flex items-center justify-between p-3 transition-colors",
                                                hasRole ? "bg-green-50 dark:bg-green-950" : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Checkbox
                                                    id={`role-${role.key}`}
                                                    checked={hasRole}
                                                    disabled={isLoading}
                                                    onCheckedChange={() => handleToggleRole(role.key, hasRole)}
                                                />
                                                <label
                                                    htmlFor={`role-${role.key}`}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <span className="font-medium">{role.label}</span>
                                                    <code className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        {role.key}
                                                    </code>
                                                </label>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                className={cn("font-mono text-xs", role.badge_color)}
                                            >
                                                L{role.level}
                                            </Badge>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Kapat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
