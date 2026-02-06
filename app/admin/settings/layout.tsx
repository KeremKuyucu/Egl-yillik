"use server";
import type { ReactNode } from "react";
import { requireSiteSettingsWrite } from "@/lib/auth/permissions";

export default async function Layout({ children }: { children: ReactNode }) {
    await requireSiteSettingsWrite();
    return <>{children}</>;
}
