"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type Industry = {
	label: string;
	coreFocus?: boolean;
};

const rowOne: Industry[] = [
	{ label: "Education" },
	{ label: "Healthcare" },
	{ label: "Financial Services & FinTech" },
	{ label: "Retail & E-commerce" },
	{ label: "Logistics & Transportation" },
	{ label: "Real Estate & Construction" },
	{ label: "Hospitality" },
	{ label: "Professional Services" },
	{ label: "Government & Public Admin" },
];

const rowTwo: Industry[] = [
	{ label: "Nonprofit & Social Impact" },
	{ label: "Agriculture" },
	{ label: "Manufacturing" },
	{ label: "Media & Entertainment" },
	{ label: "Membership & Religious Org" },
	{ label: "Technology Startups", coreFocus: true },
	{ label: "Small & Medium Businesses" },
];

/**
 * Pixels per second each row drifts. The rows travel in opposite directions —
 * a negative speed scrolls back toward the start, so row two reads right-to-left
 * against row one.
 */
const ROW_ONE_SPEED = 22;
const ROW_TWO_SPEED = -16;
/** How far an arrow press nudges both rows. */
const STEP = 320;
/**
 * How many times the chip list is repeated.
 *
 * Wrapping needs the track to be scrollable by a full period, so it must hold
 * one viewport *plus* one period of chips. Two copies is not enough: on a 1440
 * viewport the period is ~1240px but the max scroll would only be ~1027px, and
 * the row would stall against the end instead of looping. Four covers viewports
 * up to roughly 3700px.
 */
const COPIES = 4;

function IndustryChip({
	label,
	coreFocus,
	...rest
}: Industry & { "aria-hidden"?: boolean }) {
	return (
		<li
			{...rest}
			className={cn(
				"flex h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full border px-3.5 text-[15px] leading-none text-white",
				coreFocus
					? "border-brand-accent bg-[#161D30] shadow-[0_0_20px_rgba(245,111,70,0.35)]"
					: "border-brand/30 bg-[#111524]",
			)}
		>
			{label}
			{coreFocus && (
				<span className="text-[11px] font-bold uppercase tracking-[0.5px] text-brand-accent">
					Core focus
				</span>
			)}
		</li>
	);
}

/**
 * Distance from the first chip to its duplicate — one full loop.
 *
 * Not `scrollWidth / 2`: the two copies sit in one flex row, so the track holds
 * `2n` chips but only `2n - 1` gaps. Halving it would land half a gap short and
 * make every wrap jump.
 */
function loopPeriod(track: HTMLUListElement, count: number) {
	const first = track.children[0] as HTMLElement | undefined;
	const copy = track.children[count] as HTMLElement | undefined;
	return first && copy ? copy.offsetLeft - first.offsetLeft : 0;
}

/**
 * Drifts the track by mutating `scrollLeft`, wrapping after one period.
 * The chip list is rendered twice, so the wrap is invisible.
 */
function useAutoScroll(
	ref: RefObject<HTMLUListElement | null>,
	count: number,
	speed: number,
	paused: boolean,
) {
	const reduced = useReducedMotion();

	useEffect(() => {
		const track = ref.current;
		if (!track || paused || reduced) return;

		let frame = 0;
		let previous = performance.now();

		const tick = (now: number) => {
			const elapsed = (now - previous) / 1000;
			previous = now;

			const period = loopPeriod(track, count);
			if (period > 0) {
				const next = track.scrollLeft + speed * elapsed;
				// Wrap before assigning: a negative scrollLeft clamps to 0 rather
				// than wrapping, which would stall a right-to-left row at the start.
				track.scrollLeft =
					next >= period ? next - period : next < 0 ? next + period : next;
			}

			frame = requestAnimationFrame(tick);
		};

		frame = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(frame);
	}, [ref, count, speed, paused, reduced]);
}

function MarqueeRow({
	items,
	trackRef,
	speed,
	paused,
	label,
}: {
	items: Industry[];
	trackRef: RefObject<HTMLUListElement | null>;
	speed: number;
	paused: boolean;
	label: string;
}) {
	useAutoScroll(trackRef, items.length, speed, paused);

	return (
		<ul
			ref={trackRef}
			aria-label={label}
			className="flex gap-3 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
		>
			{Array.from({ length: COPIES }, (_, copy) =>
				items.map((industry) => (
					<IndustryChip
						key={`${industry.label}-${copy}`}
						// Only the first pass is real content — the rest exist to
						// keep the loop seamless.
						aria-hidden={copy > 0}
						{...industry}
					/>
				)),
			)}
		</ul>
	);
}

export function IndustryMarquee() {
	const rowOneRef = useRef<HTMLUListElement>(null);
	const rowTwoRef = useRef<HTMLUListElement>(null);
	const [paused, setPaused] = useState(false);
	const [dragging, setDragging] = useState(false);

	// Touch users get no hover, so a swipe would fight the drift. Hold the row
	// still for as long as a pointer is down, wherever it ends up being released.
	useEffect(() => {
		if (!dragging) return;

		const release = () => setDragging(false);
		window.addEventListener("pointerup", release);
		window.addEventListener("pointercancel", release);

		return () => {
			window.removeEventListener("pointerup", release);
			window.removeEventListener("pointercancel", release);
		};
	}, [dragging]);

	const nudge = useCallback((direction: -1 | 1) => {
		const tracks = [
			[rowOneRef.current, rowOne.length] as const,
			[rowTwoRef.current, rowTwo.length] as const,
		];

		for (const [track, count] of tracks) {
			if (!track) continue;

			// Jump forward a whole loop first so a backward nudge never hits 0,
			// where the scroll would clamp instead of wrapping.
			if (direction === -1 && track.scrollLeft - STEP < 0) {
				track.scrollLeft += loopPeriod(track, count);
			}

			track.scrollBy({ left: direction * STEP, behavior: "smooth" });
		}
	}, []);

	return (
		<section className="relative overflow-hidden py-10 md:py-20">
			<div
				className="relative flex flex-col gap-4"
				onMouseEnter={() => setPaused(true)}
				onMouseLeave={() => setPaused(false)}
				onFocusCapture={() => setPaused(true)}
				onBlurCapture={() => setPaused(false)}
				onPointerDown={() => setDragging(true)}
			>
				<MarqueeRow
					items={rowOne}
					trackRef={rowOneRef}
					speed={ROW_ONE_SPEED}
					paused={paused || dragging}
					label="Industries we serve, first row"
				/>
				<MarqueeRow
					items={rowTwo}
					trackRef={rowTwoRef}
					speed={ROW_TWO_SPEED}
					paused={paused || dragging}
					label="Industries we serve, second row"
				/>

				<span
					aria-hidden
					className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-page to-transparent"
				/>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-page to-transparent"
				/>

				<button
					type="button"
					onClick={() => nudge(-1)}
					aria-label="Show previous industries"
					className="absolute left-4 top-1/2 flex h-7.75 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[5px] border border-[#334066]/50 bg-[#1F2438]/80 text-white transition-colors hover:bg-[#1F2438] xl:left-16"
				>
					<ChevronLeft className="size-4" aria-hidden />
				</button>
				<button
					type="button"
					onClick={() => nudge(1)}
					aria-label="Show more industries"
					className="absolute right-4 top-1/2 flex h-7.75 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-[5px] border border-[#334066]/50 bg-[#1F2438]/80 text-white transition-colors hover:bg-[#1F2438] xl:right-16"
				>
					<ChevronRight className="size-4" aria-hidden />
				</button>
			</div>
		</section>
	);
}
