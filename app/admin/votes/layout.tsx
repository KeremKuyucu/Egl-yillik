"use server";
import type { ReactNode } from "react";
import { requireAdminVotesRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireAdminVotesRead();
    return <>{children}</>;
}
