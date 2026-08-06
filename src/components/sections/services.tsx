import Image from "next/image";
import { glowEllipse, gridCard, iconUserQuestion, sparkleSquare } from "@/assets";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

type SquareColor = "orange" | "blue";

/** The three decorative square slots shared by every white card (from Figma). */
const squareSlots = {
	left: "left-[8.16%] top-[41%]",
	right: "left-[84.3%] top-[41%]",
	top: "left-[70.3%] top-[18.2%]",
} as const;

type ServiceCardProps = {
	description: string;
	squares: Record<keyof typeof squareSlots, SquareColor>;
	className?: string;
};

function ServiceCard({ description, squares, className }: ServiceCardProps) {
	return (
		<div
			className={cn(
				"relative min-h-[280px] overflow-hidden rounded-[18px] bg-white sm:h-[353px]",
				className,
			)}
		>
			<Image
				src={gridCard}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[-97px] size-[430px] max-w-none -translate-x-1/2"
			/>
			{(Object.keys(squareSlots) as (keyof typeof squareSlots)[]).map(
				(slot) => (
					<div
						key={slot}
						aria-hidden
						className={cn(
							"absolute h-[27px] w-[27px]",
							squareSlots[slot],
							squares[slot] === "orange" ? "bg-brand-accent" : "bg-brand/15",
						)}
					/>
				),
			)}
			<p className="absolute inset-x-5 bottom-8 text-base leading-[22px] text-black">
				{description}
			</p>
		</div>
	);
}

function GhostCard({ description }: { description: string }) {
	return (
		<div className="relative min-h-[180px] overflow-hidden rounded-[18px] border border-white/10 bg-white/5 backdrop-blur-sm sm:h-[212px]">
			<Image
				src={sparkleSquare}
				alt=""
				aria-hidden
				className="absolute left-7 top-[30px] size-6"
			/>
			<Image
				src={sparkleSquare}
				alt=""
				aria-hidden
				className="absolute bottom-[24px] right-7 size-6"
			/>
			<p className="absolute inset-x-5 bottom-8 max-w-[310px] text-base leading-[22px] text-white">
				{description}
			</p>
		</div>
	);
}

export function Services() {
	return (
		<section className="relative overflow-hidden">
			{/* Blue radial glow behind the cards */}
			<Image
				src={glowEllipse}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-[150px] w-[1320px] max-w-none -translate-x-1/2"
			/>

			<div className="relative mx-auto w-full max-w-[1440px] px-6 pb-16 md:pb-20 pt-10 md:pt-20 xl:px-[120px]">
				<RevealGroup className="flex max-w-[1030px] flex-col items-start gap-6">
					<RevealItem>
						<SectionBadge icon={iconUserQuestion}>
							We Do More Than Write Code
						</SectionBadge>
					</RevealItem>
					<RevealItem>
						<SectionHeading>
							A successful digital product begins with a clear understanding of
							the problem it must solve.
						</SectionHeading>
					</RevealItem>
				</RevealGroup>

				<RevealGroup
					stagger={0.12}
					className="mt-10 grid items-start gap-4 md:grid-cols-2 lg:grid-cols-3"
				>
					<RevealItem>
						<ServiceCard
							description="ATOD combines product strategy, business analysis, product design, engineering, documentation, and automation."
							squares={{ left: "blue", right: "orange", top: "orange" }}
						/>
					</RevealItem>
					<RevealItem className="grid gap-4">
						<GhostCard description="Seamless, intuitive, and delightful user experiences." />
						<ServiceCard
							description="We do post-launch support to create useful systems, not just impressive screens."
							squares={{ left: "orange", right: "orange", top: "blue" }}
						/>
					</RevealItem>
					<RevealItem>
						<ServiceCard
							description="Whether you have a complete specification, a sketch, a spoken idea, or an existing system that needs improvement, we can help you move forward with structure and confidence."
							squares={{ left: "orange", right: "blue", top: "orange" }}
						/>
					</RevealItem>
				</RevealGroup>
			</div>
		</section>
	);
}
