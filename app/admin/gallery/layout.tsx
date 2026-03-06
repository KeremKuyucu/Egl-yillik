"use server";
import type { ReactNode } from "react";
import { requirePermission, PAGE_PERMS } from "@/lib/auth/permissions"

export default async function Layout({ children }: { children: ReactNode }) {
    await requirePermission(PAGE_PERMS.PAGE_ADMIN_GALLERY);
    return <>{children}</>;
}