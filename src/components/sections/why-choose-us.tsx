import Image from "next/image";
import { Network } from "lucide-react";

import { gridBlue, timeline } from "@/assets";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";
import { SectionHeading } from "@/components/shared/section-heading";

const reasons = [
	"End-to-end delivery, from idea discovery to launch and maintenance",
	"Product enhancement through our Product Intelligence & Innovation Team",
	"Experience serving projects in the United States and Nigeria",
	"Custom software built around real business processes",
];

const reasonPositions = [
	"left-0 w-[236px]",
	"left-[272px] w-[276px]",
	"left-[638px] w-[212px]",
	"left-[921px] w-[206px]",
];

export function WhyChooseUs() {
	return (
		<section id="about" className="relative overflow-hidden">
			<Image
				src={gridBlue}
				alt=""
				aria-hidden
				className="pointer-events-none absolute -top-[72px] left-[calc(50%-753px)] size-[430px] max-w-none"
			/>
			<Image
				src={gridBlue}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-[calc(50%+395px)] top-[69px] size-[430px] max-w-none"
			/>

			<div className="relative mx-auto w-full max-w-[1440px] px-6 py-10 md:py-20 xl:px-[121px]">
				<RevealGroup className="mx-auto flex max-w-[694px] flex-col items-center gap-6 text-center">
					<RevealItem>
						<SectionBadge icon={Network}>
							Why Customer Choose ATOD
						</SectionBadge>
					</RevealItem>
					<RevealItem>
						<SectionHeading>
							We Build Solutions That Moves Business Forward
						</SectionHeading>
					</RevealItem>
				</RevealGroup>

				{/* Desktop: dotted timeline with texts at exact design offsets, centered on the viewport */}
				<div className="relative left-1/2 mt-16 hidden h-[220px] w-[1198px] -translate-x-1/2 min-[1200px]:block">
					<Reveal className="absolute left-[51px] top-[24px]" direction="none">
						<Image
							src={timeline}
							alt=""
							aria-hidden
							className="w-[1096px] max-w-none"
						/>
					</Reveal>
					<RevealGroup
						stagger={0.12}
						delay={0.2}
						className="absolute left-[36px] top-[105px] h-[90px] w-[1127px]"
					>
						{reasons.map((reason, i) => (
							<RevealItem
								key={reason}
								distance={16}
								className={`absolute top-0 ${reasonPositions[i]}`}
							>
								<p className="text-base leading-[30px] tracking-[-0.4px] text-white">
									{reason}
								</p>
							</RevealItem>
						))}
					</RevealGroup>
				</div>

				{/* Mobile / tablet: simple bulleted stack */}
				<Reveal className="min-[1200px]:hidden">
					<ul className="mx-auto mt-10 flex max-w-[480px] flex-col gap-6">
						{reasons.map((reason) => (
							<li key={reason} className="flex items-start gap-4">
								<span
									aria-hidden
									className="mt-2.5 size-2 shrink-0 rounded-full bg-white"
								/>
								<p className="text-lg leading-[30px] tracking-[-0.4px] text-white">
									{reason}
								</p>
							</li>
						))}
					</ul>
				</Reveal>
			</div>
		</section>
	);
}
