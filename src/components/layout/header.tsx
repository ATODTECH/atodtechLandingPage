"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu } from "lucide-react";

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

const approachLinks = [
	{ label: "Solutions", href: "/solutions" },
	{ label: "Industries", href: "/industries" },
	{ label: "AI Automation", href: "/ai-automation" },
	{ label: "Our Process", href: "/our-process" },
];

const navLinks = [
	{ label: "Home", href: "/" },
	{ label: "About Us", href: "/about" },
	{ label: "Our Services", href: "/services" },
	{ label: "Projects", href: "/projects" },
	{ label: "Approach", href: "/our-process", children: approachLinks },
	{ label: "Contact Us", href: "/contact" },
	{ label: "FAQs", href: "/faqs" },
];

function ApproachMenu({ pathname }: { pathname: string }) {
	const [open, setOpen] = useState(false);
	const isActive = approachLinks.some((link) => link.href === pathname);

	return (
		<div
			className="relative"
			onMouseEnter={() => setOpen(true)}
			onMouseLeave={() => setOpen(false)}
			onFocus={() => setOpen(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget)) {
					setOpen(false);
				}
			}}
		>
			<button
				type="button"
				aria-expanded={open}
				aria-haspopup="true"
				onClick={() => setOpen((value) => !value)}
				className={cn(
					"flex cursor-pointer items-center gap-2 text-base leading-6 transition-colors hover:text-white",
					isActive ? "text-brand" : "text-nav-muted",
				)}
			>
				Approach
				<ChevronDown
					className={cn(
						"size-5 transition-transform",
						open && "rotate-180",
					)}
					aria-hidden
				/>
			</button>

			<div
				className={cn(
					"absolute left-0 top-full w-47.25 pt-3 transition-opacity",
					open
						? "opacity-100"
						: "pointer-events-none opacity-0",
				)}
			>
				<ul className="flex flex-col gap-1 rounded-xl border border-white/10 bg-page/95 p-1.5 shadow-[0_16px_40px_rgba(9,14,38,0.55)] backdrop-blur">
					{approachLinks.map((link) => (
						<li key={link.label}>
							<Link
								href={link.href}
								onClick={() => setOpen(false)}
								className={cn(
									"block cursor-pointer rounded-lg px-2 py-1.5 text-sm leading-4.5 transition-colors hover:bg-white/8 hover:text-white",
									pathname === link.href
										? "text-brand-accent"
										: "text-nav-muted",
								)}
							>
								{link.label}
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function Header() {
	const pathname = usePathname();

	return (
		<header className="absolute inset-x-0 top-0 z-30">
			<div className="mx-auto flex h-24 w-full max-w-360 items-center justify-between gap-6 px-6 xl:px-30">
				<div className="flex items-center gap-10">
					<Link
						href="/"
						aria-label="ATOD Tech Agency - Home"
						className="block cursor-pointer"
					>
						<AtodBrandLogo aria-hidden className="h-20 w-auto" />
					</Link>
					<nav className="hidden items-center gap-6 xl:flex xl:gap-7">
						{navLinks.map((link) =>
							link.children ? (
								<ApproachMenu key={link.label} pathname={pathname} />
							) : (
								<Link
									key={link.label}
									href={link.href}
									className={cn(
										"cursor-pointer whitespace-nowrap text-base leading-6 transition-colors hover:text-white",
										pathname === link.href
											? "text-brand"
											: "text-nav-muted",
									)}
								>
									{link.label}
								</Link>
							),
						)}
					</nav>
				</div>

				<div className="hidden xl:block">
					<FancyButton href="/contact">Start Your Project</FancyButton>
				</div>

				{/* Mobile Menu */}
				<Sheet>
					<SheetTrigger
						render={
							<Button
								variant="ghost"
								size="icon"
								className="cursor-pointer text-white hover:bg-white/10 hover:text-white xl:hidden"
							/>
						}
					>
						<Menu className="size-5" />
						<span className="sr-only">Open menu</span>
					</SheetTrigger>
					<SheetContent
						side="right"
						className="overflow-y-auto border-white/10 bg-page text-white"
					>
						<SheetHeader>
							<SheetTitle className="text-white">Menu</SheetTitle>
						</SheetHeader>
						<nav className="flex flex-col gap-6 px-4 pb-8">
							{navLinks.map((link) =>
								link.children ? (
									<div key={link.label} className="flex flex-col gap-4">
										<span className="text-base leading-6 text-white/50">
											{link.label}
										</span>
										<ul className="flex flex-col gap-4 pl-4">
											{link.children.map((child) => (
												<li key={child.label}>
													<Link
														href={child.href}
														className={cn(
															"cursor-pointer text-base leading-6 transition-colors hover:text-white",
															pathname === child.href
																? "text-brand-accent"
																: "text-nav-muted",
														)}
													>
														{child.label}
													</Link>
												</li>
											))}
										</ul>
									</div>
								) : (
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
								),
							)}
							<FancyButton href="/contact" className="self-start">
								Start Your Project
							</FancyButton>
						</nav>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
