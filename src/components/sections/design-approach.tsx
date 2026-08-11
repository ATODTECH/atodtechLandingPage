import Image from "next/image";

import { checkCircle, designApproachImg } from "@/assets";
import { OrnamentHeading } from "@/components/shared/ornament-heading";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

const principles = [
	"Intuitive navigation for both artisans and customers.",
	"Clean UI with clear service categories.",
	"Consistent use of Lightbox brand colors.",
	"A seamless flow from service search → booking → confirmation.",
];

export function DesignApproach() {
	return (
		<section className="relative">
			<RevealGroup
				stagger={0.12}
				className="mx-auto grid w-full max-w-360 gap-12 px-6 py-10 md:py-20 lg:grid-cols-[507fr_573fr] lg:items-center lg:gap-30 xl:px-30"
			>
				<RevealItem direction="right" className="flex flex-col items-start">
					<OrnamentHeading>Design Approach</OrnamentHeading>
					<p className="mt-4.25 text-lg leading-normal text-white">
						Our product designs focused on simplicity and trust
					</p>
					<ul className="mt-8 flex flex-col gap-3.5">
						{principles.map((principle) => (
							<li key={principle} className="flex items-center gap-1.25">
								<Image
									src={checkCircle}
									alt=""
									aria-hidden
									className="size-4 shrink-0"
								/>
								<span className="text-xs leading-none text-white">
									{principle}
								</span>
							</li>
						))}
					</ul>
				</RevealItem>

				<RevealItem direction="left">
					<Image
						src={designApproachImg}
						alt="A Sabiwork user booking an artisan from their phone"
						sizes="(min-width: 1024px) 573px, calc(100vw - 48px)"
						className="w-full"
					/>
				</RevealItem>
			</RevealGroup>
		</section>
	);
}
