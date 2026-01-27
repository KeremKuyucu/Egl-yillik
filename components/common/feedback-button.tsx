// components/feedback-button.tsx
'use client'

import React, { useState } from 'react';
import { MessageSquarePlus, Bug, Lightbulb, AlertCircle, HelpCircle, Send, X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { submitFeedback, FeedbackType } from '@/app/actions/feedback';

const feedbackTypes = [
    { value: 'bug' as FeedbackType, label: 'Hata Bildirimi', icon: Bug, color: 'text-red-500', bgHover: 'hover:bg-red-50 dark:hover:bg-red-900/20', bgActive: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700' },
    { value: 'suggestion' as FeedbackType, label: 'Öneri', icon: Lightbulb, color: 'text-amber-500', bgHover: 'hover:bg-amber-50 dark:hover:bg-amber-900/20', bgActive: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700' },
    { value: 'complaint' as FeedbackType, label: 'Şikayet', icon: AlertCircle, color: 'text-orange-500', bgHover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20', bgActive: 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700' },
    { value: 'other' as FeedbackType, label: 'Diğer', icon: HelpCircle, color: 'text-blue-500', bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', bgActive: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700' },
];

export default function FeedbackButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedType, setSelectedType] = useState<FeedbackType | null>(null);
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async () => {
        if (!selectedType || !message.trim()) return;

        setIsSubmitting(true);
        setSubmitStatus('idle');
        setErrorMessage('');

        try {
            const result = await submitFeedback(
                selectedType,
                message,
                typeof window !== 'undefined' ? window.location.href : undefined,
                typeof window !== 'undefined' ? navigator.userAgent : undefined
            );

            if (result.success) {
                setSubmitStatus('success');
                setTimeout(() => {
                    setIsOpen(false);
                    setSelectedType(null);
                    setMessage('');
                    setSubmitStatus('idle');
                }, 2000);
            } else {
                setSubmitStatus('error');
                setErrorMessage(result.error || 'Bir hata oluştu');
            }
        } catch {
            setSubmitStatus('error');
            setErrorMessage('Bir hata oluştu');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setSelectedType(null);
            setMessage('');
            setSubmitStatus('idle');
            setErrorMessage('');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <button
                    className="fixed bottom-6 right-6 z-50 group flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-200/80 dark:border-slate-700/80 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 hover:scale-105 transition-all duration-300"
                    aria-label="Geri Bildirim Gönder"
                >
                    <span suppressHydrationWarning>
                        <MessageSquarePlus className="h-4 w-4 text-indigo-600 dark:text-indigo-400 group-hover:rotate-12 transition-transform duration-300" />
                    </span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden sm:inline">
                        Geri Bildirim
                    </span>
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <MessageSquarePlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        Geri Bildirim Gönder
                    </DialogTitle>
                    <DialogDescription>
                        Görüşleriniz bizim için çok değerli! Lütfen geri bildiriminizi paylaşın.
                    </DialogDescription>
                </DialogHeader>

                {submitStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-4">
                        <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                        </div>
                        <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                            Teşekkürler!
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
                            Geri bildiriminiz başarıyla gönderildi.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 pt-4">
                        {/* Tür Seçimi */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Geri bildirim türü
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {feedbackTypes.map((type) => {
                                    const Icon = type.icon;
                                    const isActive = selectedType === type.value;
                                    return (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setSelectedType(type.value)}
                                            className={`flex items-center gap-2 p-3 rounded-lg border transition-all duration-200 ${isActive
                                                ? type.bgActive
                                                : `border-slate-200 dark:border-slate-700 ${type.bgHover}`
                                                }`}
                                        >
                                            <Icon className={`h-4 w-4 ${type.color}`} />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {type.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mesaj */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Mesajınız
                            </label>
                            <Textarea
                                placeholder="Geri bildiriminizi buraya yazın... (min 10 karakter)"
                                value={message}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMessage(e.target.value)}
                                className="min-h-[120px] resize-none"
                                maxLength={2000}
                            />
                            <div className="flex justify-between text-xs text-slate-500">
                                <span>{message.length < 10 ? `En az ${10 - message.length} karakter daha` : ''}</span>
                                <span>{message.length}/2000</span>
                            </div>
                        </div>

                        {/* Hata Mesajı */}
                        {submitStatus === 'error' && (
                            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-600 dark:text-red-400">
                                    {errorMessage}
                                </p>
                            </div>
                        )}

                        {/* Gönder Butonu */}
                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="ghost"
                                onClick={() => handleOpenChange(false)}
                                disabled={isSubmitting}
                            >
                                <X className="h-4 w-4 mr-1" />
                                İptal
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedType || message.trim().length < 10 || isSubmitting}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 mr-1" />
                                )}
                                {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
