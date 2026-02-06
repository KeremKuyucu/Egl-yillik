"use server";
import type { ReactNode } from "react";
import { requireAdminTextsRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireAdminTextsRead();
    return <>{children}</>;
}
