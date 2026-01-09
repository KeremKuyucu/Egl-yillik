"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="relative overflow-hidden bg-gradient-to-br from-amber-100 to-orange-200 dark:from-indigo-900 dark:to-purple-900 border-amber-300 dark:border-indigo-500 hover:scale-110 hover:shadow-lg hover:shadow-amber-200/50 dark:hover:shadow-indigo-500/50 transition-all duration-300"
                >
                    <Sun className="h-[1.3rem] w-[1.3rem] rotate-0 scale-100 transition-all duration-500 text-amber-600 dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.3rem] w-[1.3rem] rotate-90 scale-0 transition-all duration-500 text-indigo-200 dark:rotate-0 dark:scale-100" />
                    <Sparkles className="absolute h-2 w-2 top-1 right-1 text-yellow-500 dark:text-purple-300 animate-pulse" />
                    <span className="sr-only">Tema değiştir</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-44 bg-gradient-to-b from-background to-muted/50 backdrop-blur-xl border-border/50 shadow-xl"
            >
                <DropdownMenuLabel className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3" />
                    Tema Seçin
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={() => setTheme("light")}
                    className={`flex items-center gap-3 cursor-pointer transition-all hover:pl-4 ${theme === 'light' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : ''}`}
                >
                    <div className="p-1.5 rounded-full bg-gradient-to-br from-amber-200 to-orange-300 dark:from-amber-800 dark:to-orange-900">
                        <Sun className="h-3.5 w-3.5 text-amber-600 dark:text-amber-300" />
                    </div>
                    <span className="font-medium">Aydınlık</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("dark")}
                    className={`flex items-center gap-3 cursor-pointer transition-all hover:pl-4 ${theme === 'dark' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : ''}`}
                >
                    <div className="p-1.5 rounded-full bg-gradient-to-br from-indigo-200 to-purple-300 dark:from-indigo-800 dark:to-purple-900">
                        <Moon className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <span className="font-medium">Karanlık</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setTheme("system")}
                    className={`flex items-center gap-3 cursor-pointer transition-all hover:pl-4 ${theme === 'system' ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300' : ''}`}
                >
                    <div className="p-1.5 rounded-full bg-gradient-to-br from-slate-200 to-gray-300 dark:from-slate-700 dark:to-gray-800">
                        <Monitor className="h-3.5 w-3.5 text-slate-600 dark:text-slate-300" />
                    </div>
                    <span className="font-medium">Sistem</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}