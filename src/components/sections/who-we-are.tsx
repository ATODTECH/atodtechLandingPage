import Image from "next/image";
import { Search } from "lucide-react";

import { aboutTeamGroup, aboutTeamLaptop, aboutTeamTablet } from "@/assets";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";
import { cn } from "@/lib/utils";

const paragraphs = [
	"We're a team of designers, developers, and innovators passionate about turning ideas into impactful digital products.",
	"From mobile apps and websites to enterprise software, we help businesses of all sizes build solutions that works beautifully and efficiently.",
	"At Atod, we believe great products start with great collaboration. That's why we take the time to understand your goals, challenges, and users before crafting solutions that truly deliver results.",
];

export function WhoWeAre() {
	return (
		<section className="relative">
			<div className="mx-auto grid w-full max-w-360 gap-12 px-6 py-10 md:py-20 lg:grid-cols-2 lg:items-center lg:gap-8 xl:px-30">
				<RevealGroup className="flex flex-col items-start gap-6">
					<RevealItem>
						<SectionBadge icon={Search}>Who We Are?</SectionBadge>
					</RevealItem>
					{paragraphs.map((paragraph, i) => (
						<RevealItem key={paragraph}>
							<p
								className={cn(
									"max-w-164.5 text-lg leading-normal text-white",
									i === 0 && "text-xl leading-relaxed",
								)}
							>
								{paragraph}
							</p>
						</RevealItem>
					))}
				</RevealGroup>

				<RevealGroup stagger={0.12} className="flex flex-col gap-4">
					<RevealItem>
						<div className="relative h-61.75 w-full overflow-hidden rounded-xl">
							<Image
								src={aboutTeamGroup}
								alt="The Atod team gathered around a tablet"
								fill
								sizes="(min-width: 1440px) 584px, (min-width: 1024px) calc((100vw - 80px) / 2), calc(100vw - 48px)"
								placeholder="blur"
								className="object-cover"
							/>
						</div>
					</RevealItem>
					<RevealItem className="grid grid-cols-2 gap-4">
						<div className="relative aspect-square overflow-hidden rounded-xl">
							<Image
								src={aboutTeamTablet}
								alt="A designer reviewing work on a tablet"
								fill
								sizes="(min-width: 1440px) 284px, (min-width: 1024px) calc((100vw - 96px) / 4), calc((100vw - 64px) / 2)"
								placeholder="blur"
								className="object-cover"
							/>
						</div>
						<div className="relative aspect-square overflow-hidden rounded-xl">
							<Image
								src={aboutTeamLaptop}
								alt="A developer working on a laptop"
								fill
								sizes="(min-width: 1440px) 284px, (min-width: 1024px) calc((100vw - 96px) / 4), calc((100vw - 64px) / 2)"
								placeholder="blur"
								className="object-cover"
							/>
						</div>
					</RevealItem>
				</RevealGroup>
			</div>
		</section>
	);
}
