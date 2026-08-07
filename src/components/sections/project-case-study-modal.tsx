"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import Image, { type StaticImageData } from "next/image";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useReducedMotion } from "motion/react";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";
import {
	DialogClose,
	DialogContent,
	DialogTitle,
} from "@/components/ui/dialog";
import type { CaseStudyItem, Project } from "@/lib/projects";
import { cn } from "@/lib/utils";

const SLIDE_DURATION = 5_000;

const TONES = {
	solid: {
		panel: "bg-(--case-panel)",
		badge: "bg-white text-(--case-panel)",
		title: "text-white",
		label: "text-white",
		body: "text-white/90",
		marker: "marker:text-white/90",
		dotActive: "bg-(--case-accent)",
		dotIdle: "bg-white/40 hover:bg-white/70",
		nav: "border-transparent bg-white text-(--case-panel) hover:bg-white/85",
		close: "bg-white/15 text-white hover:bg-white/25",
		ring: "focus-visible:outline-white",
	},
	light: {
		panel: "bg-white",
		badge: "bg-(--case-accent) text-white",
		title: "text-(--case-accent)",
		label: "text-neutral-900",
		body: "text-neutral-700",
		marker: "marker:text-neutral-400",
		dotActive: "bg-(--case-accent)",
		dotIdle: "bg-neutral-200 hover:bg-neutral-300",
		nav: "border-transparent bg-(--case-accent) text-white hover:brightness-110",
		close: "bg-(--case-accent) text-white hover:brightness-110",
		ring: "focus-visible:outline-(--case-accent)",
	},
} as const;

/** Long page scrolls are taller than they are wide by a wide margin. */
const isPageScroll = (shot: StaticImageData) => shot.width / shot.height < 0.35;

export function ProjectCaseStudyModal({ project }: { project: Project }) {
	const [copyApi, setCopyApi] = useState<CarouselApi>();
	const [galleryApi, setGalleryApi] = useState<CarouselApi>();
	const [activeSlide, setActiveSlide] = useState(0);
	const reducedMotion = useReducedMotion();

	const [autoplay] = useState(() =>
		Autoplay({
			delay: SLIDE_DURATION,
			stopOnInteraction: false,
			stopOnMouseEnter: true,
		}),
	);
	const copyPlugins = useMemo(
		() => (reducedMotion ? [] : [autoplay]),
		[reducedMotion, autoplay],
	);

	useEffect(() => {
		if (!copyApi) return;

		const syncActiveSlide = () =>
			setActiveSlide(copyApi.selectedScrollSnap());

		copyApi.on("select", syncActiveSlide);
		copyApi.on("reInit", syncActiveSlide);

		return () => {
			copyApi.off("select", syncActiveSlide);
			copyApi.off("reInit", syncActiveSlide);
		};
	}, [copyApi]);

	useEffect(() => {
		const timer = setTimeout(() => {
			copyApi?.reInit();
			galleryApi?.reInit();
		}, 250);

		return () => clearTimeout(timer);
	}, [copyApi, galleryApi]);

	const goToSlide = (target: number | "prev" | "next") => {
		if (target === "prev") copyApi?.scrollPrev();
		else if (target === "next") copyApi?.scrollNext();
		else copyApi?.scrollTo(target);

		copyApi?.plugins().autoplay?.reset();
	};

	const tone = TONES[project.theme.tone];
	const hasGallery = project.mockups.length > 0;
	const isPageGallery = project.galleryLayout === "page";

	return (
		<DialogContent
			showCloseButton={false}
			overlayClassName="bg-page/80 supports-backdrop-filter:backdrop-blur-sm"
			style={
				{
					"--case-panel": project.theme.panel ?? "#1e338a",
					"--case-accent": project.theme.accent ?? "#f56f46",
				} as CSSProperties
			}
			className={cn(
				"block max-h-[92dvh] w-[calc(100%-1.5rem)] max-w-[calc(100%-1.5rem)] gap-0 overflow-y-auto rounded-2xl p-0 ring-0 sm:max-w-310",
				tone.panel,
			)}
		>
			<DialogClose
				aria-label="Close case study"
				className={cn(
					"absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full transition-[filter,background-color] focus-visible:outline-2 focus-visible:outline-offset-2 lg:right-6 lg:top-6",
					tone.close,
					tone.ring,
				)}
			>
				<X className="size-4.5" aria-hidden />
			</DialogClose>

			<div
				className={cn(
					"grid items-center gap-10 px-6 pb-10 pt-16 lg:gap-8 lg:py-14 lg:pl-14 lg:pr-0",
					hasGallery &&
						"lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]",
				)}
			>
				<div className="flex min-w-0 flex-col">
					<span
						className={cn(
							"w-fit rounded-full px-4 py-1.5 text-xs font-bold uppercase leading-4 tracking-[1.2px]",
							tone.badge,
						)}
					>
						Featured Case Study
					</span>

					<DialogTitle
						className={cn(
							"mt-5 font-heading text-[34px] font-bold leading-[1.12] tracking-[-0.5px] sm:text-[42px] lg:text-[48px]",
							tone.title,
						)}
					>
						{project.caseStudyTitle}
					</DialogTitle>

					<Carousel
						setApi={setCopyApi}
						opts={{ loop: true }}
						plugins={copyPlugins}
						aria-label={`${project.name} case study details`}
						className="mt-8"
					>
						<CarouselContent className="ml-0">
							{project.slides.map((slide) => (
								<CarouselItem
									key={slide.label}
									className="pl-0 lg:min-h-52"
									aria-label={slide.label}
								>
									<h3
										className={cn(
											"text-sm font-bold uppercase leading-5 tracking-[1.4px]",
											tone.label,
										)}
									>
										{slide.label}
									</h3>
									{slide.body && (
										<p
											className={cn(
												"mt-3.5 max-w-160 text-base leading-7",
												tone.body,
											)}
										>
											{slide.body}
										</p>
									)}
									{slide.items && (
										<ul className="mt-3.5 flex max-w-160 list-disc flex-col gap-1.5 pl-5">
											{slide.items.map((item) => (
												<li
													key={itemKey(item)}
													className={cn(
														"text-base leading-7",
														tone.body,
														tone.marker,
													)}
												>
													{typeof item ===
													"string" ? (
														item
													) : (
														<>
															<strong className="font-semibold">
																{item.lead}
															</strong>{" "}
															{item.text}
														</>
													)}
												</li>
											))}
										</ul>
									)}
								</CarouselItem>
							))}
						</CarouselContent>
					</Carousel>

					<div className="mt-9 flex items-center justify-between gap-6">
						<div className="flex items-center gap-2.5">
							{project.slides.map((slide, index) => (
								<button
									key={slide.label}
									type="button"
									onClick={() => goToSlide(index)}
									aria-label={`Show ${slide.label}`}
									aria-current={index === activeSlide}
									className={cn(
										"size-2.5 cursor-pointer rounded-full transition-colors",
										index === activeSlide
											? tone.dotActive
											: tone.dotIdle,
									)}
								/>
							))}
						</div>

						<div className="flex items-center gap-3">
							<CopyNavButton
								label="Previous section"
								onClick={() => goToSlide("prev")}
								className={cn(tone.nav, tone.ring)}
							>
								<ChevronLeft className="size-5" aria-hidden />
							</CopyNavButton>
							<CopyNavButton
								label="Next section"
								onClick={() => goToSlide("next")}
								className={cn(tone.nav, tone.ring)}
							>
								<ChevronRight className="size-5" aria-hidden />
							</CopyNavButton>
						</div>
					</div>
				</div>

				{hasGallery && (
					<div
						className={cn(
							"relative min-w-0",
							// The shots are far taller than the panel, so on large screens the
							// carousel is taken out of flow: the copy alone sets the panel
							// height and the frame stretches to it, bleeding past the bottom
							// padding so the pages run to the very edge.
							isPageGallery &&
								"h-100 sm:h-125 lg:-mb-14 lg:h-auto lg:self-stretch",
						)}
					>
						<Carousel
							setApi={setGalleryApi}
							opts={{
								align: "start",
								containScroll: "trimSnaps",
							}}
							tabIndex={0}
							aria-label={`${project.name} screens`}
							className={cn(
								"cursor-grab rounded-lg outline-none focus-visible:outline-2 focus-visible:outline-offset-4 active:cursor-grabbing",
								tone.ring,
								isPageGallery &&
									"h-full lg:absolute lg:inset-0",
							)}
						>
							<CarouselContent
								viewportClassName={
									isPageGallery ? "h-full" : undefined
								}
								className={cn(
									"-ml-5",
									isPageGallery && "h-full items-start",
								)}
							>
								{project.mockups.map((mockup, index) => (
									<CarouselItem
										key={mockup.src}
										className={cn(
											"pl-5",
											isPageGallery
												? pageSlideWidth(mockup)
												: project.mockups.length > 1
													? "basis-[78%] sm:basis-1/2"
													: "basis-full [&_img]:mx-auto [&_img]:max-w-105",
											// Landscape shots sit in the middle of the frame rather
											// than stranded at the top with dead space beneath.
											isPageGallery &&
												!isPageScroll(mockup) &&
												"self-center",
										)}
									>
										<Image
											src={mockup}
											alt={`${project.name} screen ${index + 1} of ${project.mockups.length}`}
											className="h-auto w-full select-none rounded-lg"
											draggable={false}
										/>
									</CarouselItem>
								))}
							</CarouselContent>
						</Carousel>
					</div>
				)}
			</div>
		</DialogContent>
	);
}

/** Tall scrolls stay narrow so two sit side by side; wide shots get more room. */
function pageSlideWidth(shot: StaticImageData) {
	return isPageScroll(shot)
		? "basis-[78%] sm:basis-[54%]"
		: "basis-[92%] sm:basis-[86%]";
}

function itemKey(item: CaseStudyItem) {
	return typeof item === "string" ? item : item.lead;
}

function CopyNavButton({
	label,
	onClick,
	className,
	children,
}: {
	label: string;
	onClick: () => void;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			className={cn(
				"flex size-12 cursor-pointer items-center justify-center rounded-full border transition-[filter,background-color] focus-visible:outline-2 focus-visible:outline-offset-2",
				className,
			)}
		>
			{children}
		</button>
	);
}
