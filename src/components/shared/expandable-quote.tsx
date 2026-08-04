"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type ExpandableQuoteProps = {
	className?: string;
	children: React.ReactNode;
};

/**
 * Long-form quote that collapses to a few lines on small screens with a
 * "Read more" toggle. Always shown in full from `lg` up, where there is room.
 */
export function ExpandableQuote({ className, children }: ExpandableQuoteProps) {
	const [expanded, setExpanded] = useState(false);

	return (
		<div className={cn("flex flex-col items-start gap-3", className)}>
			<p
				id="testimonial-quote"
				className={cn(
					"text-base leading-[26px] text-white lg:text-lg",
					!expanded &&
						"line-clamp-[8] [mask-image:linear-gradient(to_bottom,black_65%,transparent)] lg:line-clamp-none lg:[mask-image:none]",
				)}
			>
				{children}
			</p>
			<button
				type="button"
				onClick={() => setExpanded((prev) => !prev)}
				aria-expanded={expanded}
				aria-controls="testimonial-quote"
				className="cursor-pointer text-sm text-brand-accent hover:underline lg:hidden"
			>
				{expanded ? "Read less" : "Read more"}
			</button>
		</div>
	);
}
