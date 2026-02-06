"use server";
import type { ReactNode } from "react";
import { requireAdminFeedbackRead } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireAdminFeedbackRead();
    return <>{children}</>;
}
