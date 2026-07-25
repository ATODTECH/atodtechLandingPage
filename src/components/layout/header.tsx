"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { AtodBrandLogo } from "@/assets";
import { FancyButton } from "@/components/shared/fancy-button";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navLinks = [
	{ label: "Home", href: "/" },
	{ label: "Projects", href: "/projects" },
	{ label: "About Us", href: "/about" },
	{ label: "Contact Us", href: "/contact" },
];

export function Header() {
	const pathname = usePathname();

	return (
		<header className="absolute inset-x-0 top-0 z-30">
			<div className="mx-auto flex h-24 w-full max-w-360 items-center justify-between px-6 xl:px-30">
				<div className="flex items-center gap-10">
					<Link
						href="/"
						aria-label="ATOD Tech Agency - Home"
						className="block cursor-pointer"
					>
						<AtodBrandLogo aria-hidden className="h-20 w-auto" />
					</Link>
					<nav className="hidden items-center gap-8 lg:flex">
						{navLinks.map((link) => (
							<Link
								key={link.label}
								href={link.href}
								className={cn(
									"cursor-pointer text-base leading-6 transition-colors hover:text-white",
									pathname === link.href ? "text-brand" : "text-nav-muted",
								)}
							>
								{link.label}
							</Link>
						))}
					</nav>
				</div>

				<div className="hidden lg:block">
					<FancyButton href="/contact">Contact Us</FancyButton>
				</div>

				{/* Mobile Menu */}
				<Sheet>
					<SheetTrigger
						render={
							<Button
								variant="ghost"
								size="icon"
								className="cursor-pointer text-white hover:bg-white/10 hover:text-white lg:hidden"
							/>
						}
					>
						<Menu className="size-5" />
						<span className="sr-only">Open menu</span>
					</SheetTrigger>
					<SheetContent
						side="right"
						className="border-white/10 bg-page text-white"
					>
						<SheetHeader>
							<SheetTitle className="text-white">Menu</SheetTitle>
						</SheetHeader>
						<nav className="flex flex-col gap-6 px-4">
							{navLinks.map((link) => (
								<Link
									key={link.label}
									href={link.href}
									className={cn(
										"cursor-pointer text-base leading-6 transition-colors hover:text-white",
										pathname === link.href
											? "text-brand-accent"
											: "text-nav-muted",
									)}
								>
									{link.label}
								</Link>
							))}
							<FancyButton href="/contact" className="self-start">
								Contact Us
							</FancyButton>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
