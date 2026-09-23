"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Activity,
	Building2,
	FileText,
	LogOut,
	Users,
	type LucideIcon,
} from "lucide-react";

import { AtodBrandLogo } from "@/assets";
import { signOutAction } from "@/app/portal/actions";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
	documents: FileText,
	clients: Building2,
	team: Users,
	activity: Activity,
};

export type NavItem = { key: keyof typeof ICONS; label: string; href: string };

export function PortalNav({
	items,
	userName,
	userEmail,
	roleLabel,
}: {
	items: NavItem[];
	userName: string;
	userEmail: string;
	roleLabel: string;
}) {
	const pathname = usePathname();
	const isActive = (href: string) =>
		href === "/portal"
			? pathname === "/portal" || pathname.startsWith("/portal/documents")
			: pathname.startsWith(href);

	return (
		<header className="sticky top-0 z-30 border-b border-white/10 bg-page/90 backdrop-blur">
			<div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
				<Link href="/portal" className="flex shrink-0 items-center gap-3">
					<AtodBrandLogo aria-hidden className="h-9 w-auto" />
					<span className="hidden text-sm font-semibold text-white sm:inline">
						Documents
					</span>
				</Link>

				<nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
					{items.map((item) => {
						const Icon = ICONS[item.key];
						return (
							<Link
								key={item.href}
								href={item.href}
								className={cn(
									"flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white",
									isActive(item.href) && "bg-white/10 text-white",
								)}
							>
								<Icon className="size-4" aria-hidden />
								<span className="hidden md:inline">{item.label}</span>
							</Link>
						);
					})}
				</nav>

				<div className="flex shrink-0 items-center gap-3">
					<div className="hidden text-right lg:block">
						<p className="text-sm leading-tight text-white">{userName}</p>
						<p className="text-xs leading-tight text-white/50">
							{roleLabel} · {userEmail}
						</p>
					</div>
					<form action={signOutAction}>
						<button
							type="submit"
							className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
						>
							<LogOut className="size-4" aria-hidden />
							<span className="hidden sm:inline">Sign out</span>
						</button>
					</form>
				</div>
			</div>
		</header>
	);
}
