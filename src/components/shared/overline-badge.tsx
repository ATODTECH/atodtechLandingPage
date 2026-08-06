import { cn } from "@/lib/utils";

type OverlineBadgeProps = {
	variant?: "dot" | "eyebrow";
	className?: string;
	children: React.ReactNode;
};

/**
 * Slim pill used above the newer section headings. The `dot` variant carries a
 * small status dot in navy; the `eyebrow` variant is the uppercase accent pill.
 */
export function OverlineBadge({
	variant = "dot",
	className,
	children,
}: OverlineBadgeProps) {
	if (variant === "eyebrow") {
		return (
			<div
				className={cn(
					"inline-flex items-center justify-center rounded-full border border-brand-accent/40 bg-brand-accent/8 px-4 py-1.5",
					className,
				)}
			>
				<span className="text-xs font-semibold uppercase leading-[15px] tracking-[1.2px] text-brand-accent">
					{children}
				</span>
			</div>
		);
	}

	return (
		<div
			className={cn(
				"inline-flex h-9 items-center justify-center gap-2 rounded-full border border-brand/70 bg-brand/15 px-4",
				className,
			)}
		>
			<span aria-hidden className="size-2 shrink-0 rounded-full bg-[#12b76a]" />
			<span className="text-sm leading-5 text-white">{children}</span>
		</div>
	);
}
