"use server";
import type { ReactNode } from "react";
import { requireRemindersRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireRemindersRead();
    return <>{children}</>;
}
