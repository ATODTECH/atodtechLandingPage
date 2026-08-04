import Image from "next/image";
import { Search } from "lucide-react";

import {
	AtodBrandLogo,
	glowEllipse,
	missionPointing,
	missionRing,
} from "@/assets";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";

export function OurMission() {
	return (
		<section className="relative overflow-hidden">
			<Image
				src={glowEllipse}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-37.5 w-330 max-w-none -translate-x-1/2"
			/>

			<div className="relative mx-auto w-full max-w-360 px-6 py-10 md:py-20 xl:px-30">
				<RevealGroup className="flex flex-col items-center gap-6 text-center">
					<RevealItem>
						<SectionBadge icon={Search}>Our Mission</SectionBadge>
					</RevealItem>
					<RevealItem>
						<p className="max-w-247 text-xl leading-relaxed text-white lg:text-2xl">
							We&rsquo;re a team of designers, developers, and
							innovators passionate about turning ideas into
							impactful digital products.
						</p>
					</RevealItem>
				</RevealGroup>

				<Reveal direction="up" className="mt-16">
					<div className="relative overflow-hidden rounded-3xl bg-white">
						<Image
							src={missionRing}
							alt=""
							aria-hidden
							className="pointer-events-none absolute right-0 top-1/2 hidden w-36 -translate-y-1/2 lg:block"
						/>
						<div className="grid items-end gap-0 md:gap-8 lg:grid-cols-2">
							<div className="flex flex-col gap-8 p-6 md:p-8 lg:p-12">
								<div className="w-fit self-start rounded-2xl bg-page px-4 md:px-6 py-2">
									<AtodBrandLogo
										aria-label="ATOD logo"
										role="img"
										className="h-14 md:h-24 w-auto"
									/>
								</div>
								<p className="max-w-100 text-lg leading-normal text-brand">
									We don&rsquo;t just build software we build
									lasting partnerships. Whether you&rsquo;re a
									startup or an established brand, we&rsquo;re
									here to help you grow, one digital product
									at a time.
								</p>
							</div>
							<div className="relative flex items-end justify-end">
								<Image
									src={missionPointing}
									alt="A smiling man pointing toward the viewer"
									className="w-full max-w-140"
								/>
							</div>
						</div>
					</div>
				</Reveal>
			</div>
		</section>
	);
}
