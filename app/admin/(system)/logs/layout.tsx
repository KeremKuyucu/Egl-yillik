"use server";
import type { ReactNode } from "react";
import { requirePermission } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requirePermission("system.logs.read");
    return <>{children}</>;
}
