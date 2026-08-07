import * as React from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FancyButtonProps = {
	href?: string;
	target?: React.HTMLAttributeAnchorTarget;
	rel?: string;
	icon?: React.ReactNode | null;
	className?: string;
	children: React.ReactNode;
};

export function FancyButton({
	href,
	target,
	rel,
	icon,
	className,
	children,
}: FancyButtonProps) {
	const anchorRel =
		rel ?? (target === "_blank" ? "noopener noreferrer" : undefined);

	return (
		<Button
			render={
				href ? (
					<a href={href} target={target} rel={anchorRel} />
				) : undefined
			}
			nativeButton={!href}
			className={cn(
				"fancy-gradient fancy-shadow h-auto cursor-pointer gap-0 rounded-[50px] border border-white px-8 py-2.5 text-sm font-normal tracking-[0.56px] text-white transition-[filter] hover:brightness-125",
				className,
			)}
		>
			{icon === undefined ? (
				<Sparkles className="size-4" aria-hidden />
			) : (
				icon
			)}
			<span className="px-1 leading-5">{children}</span>
		</Button>
	);
}
