import { cn } from "@/lib/utils";

type SplitBadgeProps = {
	label: string;
	className?: string;
	children: React.ReactNode;
};

/**
 * Pill above the page heroes. Below `sm` it collapses to a single compact
 * pill so the filled chip is not nested inside a second rounded container.
 */
export function SplitBadge({ label, className, children }: SplitBadgeProps) {
	return (
		<div
			className={cn(
				"fancy-gradient fancy-shadow flex w-fit max-w-full items-center justify-center rounded-[50px] border border-white px-3.5 py-1 text-center",
				"sm:border-transparent sm:bg-none sm:py-1 sm:pl-2 sm:pr-4",
				className,
			)}
		>
			<span className="fancy-gradient hidden shrink-0 rounded-[50px] border border-white px-3.5 py-0.5 text-sm leading-5 tracking-[0.56px] text-badge-text sm:inline-block">
				{label}
			</span>
			<span className="min-w-0 text-xs leading-5 tracking-[0.4px] text-white sm:px-2 sm:text-sm sm:tracking-[0.56px]">
				{children}
			</span>
		</div>
	);
}
