"use server";
import type { ReactNode } from "react";
import { requireSystemLogsRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireSystemLogsRead();
    return <>{children}</>;
}
