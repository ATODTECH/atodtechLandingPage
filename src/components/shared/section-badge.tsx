import Image, { type StaticImageData } from "next/image";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type SectionBadgeProps = {
	icon: LucideIcon | StaticImageData;
	className?: string;
	children: React.ReactNode;
};

function BadgeIcon({ icon }: { icon: SectionBadgeProps["icon"] }) {
	if (typeof icon === "object" && "src" in icon) {
		return <Image src={icon} alt="" aria-hidden className="size-5.5" />;
	}
	const Icon = icon;
	return <Icon className="size-5.5 text-brand-accent" aria-hidden />;
}

export function SectionBadge({
	icon,
	className,
	children,
}: SectionBadgeProps) {
	return (
		<div
			className={cn(
				"inline-flex h-12 items-center justify-center gap-2 rounded-full border border-brand bg-brand/15 px-4 py-1.5 backdrop-blur-sm",
				className,
			)}
		>
			<BadgeIcon icon={icon} />
			<span className="text-base leading-5 tracking-[0.64px] text-badge-text">
				{children}
			</span>
		</div>
	);
}
