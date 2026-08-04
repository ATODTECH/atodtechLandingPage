import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionBadgeProps = {
	icon: LucideIcon;
	className?: string;
	children: React.ReactNode;
};

export function SectionBadge({
	icon: Icon,
	className,
	children,
}: SectionBadgeProps) {
	return (
		<div
			className={cn(
				"fancy-gradient inline-flex h-12 items-center justify-center gap-1 rounded-[50px] border border-white px-6 py-0.5",
				className,
			)}
		>
			<Icon className="size-5.5 text-badge-text" aria-hidden />
			<span className="px-1 text-base leading-5 tracking-[0.64px] text-badge-text">
				{children}
			</span>
		</div>
	);
}
