import Image from "next/image";
import { ExternalLink } from "lucide-react";

import { featuredKiddiedu, iconFeaturedProject } from "@/assets";
import { FancyButton } from "@/components/shared/fancy-button";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";
import { SectionHeading } from "@/components/shared/section-heading";

export function FeaturedProjects() {
	return (
		<section id="projects" className="relative">
			<div className="mx-auto flex w-full max-w-[1440px] flex-col items-center px-6 py-10 md:py-20 xl:px-[120px]">
				<RevealGroup className="flex max-w-[1151px] flex-col items-center gap-6 text-center">
					<RevealItem>
						<SectionBadge icon={iconFeaturedProject}>
							Featured Project
						</SectionBadge>
					</RevealItem>
					<RevealItem className="flex flex-col gap-3">
						<SectionHeading>Kiddiedu</SectionHeading>
						<p className="text-xl leading-[29px] text-brand-accent lg:text-2xl">
							Education Technology Platform
						</p>
					</RevealItem>
					<RevealItem>
						<p className="text-base leading-[26px] text-white/70">
							Kiddiedu demonstrates ATOD&rsquo;s ability to
							transform an idea into a practical education
							technology product. The project reflects experience
							in product planning, educational workflows,
							information management, user-centered design, mobile
							and web development, parent-teacher-student
							engagement, and institution documentation,
							deployment, and continuous improvement.
						</p>
					</RevealItem>
				</RevealGroup>

				<Reveal className="mt-10 w-full md:mt-14" amount={0.15}>
					<div className="flex justify-center">
						<Image
							src={featuredKiddiedu}
							alt="Kiddiedu dashboards, class booking screens, and mobile app views"
							sizes="(min-width: 1440px) 1200px, (min-width: 1280px) calc(100vw - 240px), calc(100vw - 48px)"
							className="w-full rounded-xl"
						/>
					</div>
				</Reveal>

				<Reveal>
					<FancyButton
						href="https://www.kiddiedu.com/"
						target="_blank"
						icon={null}
						className="mt-10 md:mt-14"
					>
						<span className="inline-flex items-center gap-2">
							View Live Product
							<span className="sr-only">
								(opens in a new tab)
							</span>
							<ExternalLink className="size-4" aria-hidden />
						</span>
					</FancyButton>
				</Reveal>
			</div>
		</section>
	);
}
