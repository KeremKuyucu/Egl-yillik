"use server";
import type { ReactNode } from "react";
import { requireAdminUsersRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireAdminUsersRead();
    return <>{children}</>;
}
