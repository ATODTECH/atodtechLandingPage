import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import {
	dots,
	glowEllipse,
	iconUserQuestion,
	quote,
	testimonialLogo,
} from "@/assets";
import { Reveal, RevealGroup, RevealItem } from "@/components/shared/reveal";
import { SectionBadge } from "@/components/shared/section-badge";
import { SectionHeading } from "@/components/shared/section-heading";

export function Testimonial() {
	return (
		<section className="relative overflow-hidden">
			<Image
				src={glowEllipse}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-0 w-330 max-w-none -translate-x-1/2"
			/>

			<div className="relative mx-auto w-full max-w-360 px-6 pb-32 pt-10 md:pt-20 xl:px-30">
				<RevealGroup className="flex max-w-218.25 flex-col items-start gap-6">
					<RevealItem>
						<SectionBadge icon={iconUserQuestion}>Testimonial</SectionBadge>
					</RevealItem>
					<RevealItem>
						<SectionHeading>What Client Says About Us</SectionHeading>
					</RevealItem>
				</RevealGroup>

				<Reveal className="relative mt-9" amount={0.15}>
					<div className="relative min-h-111.25 overflow-hidden rounded-[18px] bg-white/3">
						<Image
							src={dots}
							alt=""
							aria-hidden
							className="absolute left-1/2 top-3.5 hidden h-2.5 w-12.25 -translate-x-15.75 lg:block"
						/>

						<div className="flex flex-col gap-10 p-8 lg:h-111.25 lg:flex-row lg:items-center lg:gap-0 lg:p-0">
							<div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center sm:gap-10.5 lg:w-1/2 lg:pl-8">
								<div className="flex size-35 shrink-0 items-center justify-center rounded-full bg-white/6 p-5 ring-1 ring-white/10 sm:size-47 sm:p-6.5">
									<Image
										src={testimonialLogo}
										alt="KiddiEdu"
										className="w-full"
									/>
								</div>
								<div className="flex max-w-76.25 flex-col gap-6.75">
									<div className="flex flex-col gap-2.5 text-white">
										<p className="text-2xl font-medium">Yemi Owas</p>
										<p className="text-lg">CEO - KiddiEdu</p>
									</div>
									<a
										href="https://www.kiddiedu.com/"
										target="_blank"
										rel="noopener noreferrer"
										aria-label="Visit the KiddiEdu website"
										className="group/site flex w-fit cursor-pointer items-center gap-2 whitespace-nowrap rounded-full border border-white/15 bg-white/5 py-2.5 pr-4 pl-4.5 transition duration-300 ease-out hover:border-brand-accent/60 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent"
									>
										<span className="text-sm text-white/70 transition-colors duration-300 ease-out group-hover/site:text-white motion-reduce:transition-none">
											Visit KiddiEdu
										</span>
										<ArrowUpRight
											className="size-4 text-brand-accent transition-transform duration-300 ease-out group-hover/site:translate-x-0.5 group-hover/site:-translate-y-0.5 motion-reduce:transition-none"
											aria-hidden
										/>
									</a>
								</div>
							</div>

							<div
								aria-hidden
								className="hidden h-88.75 w-px shrink-0 bg-linear-to-b from-transparent via-white/40 to-transparent lg:block"
							/>
							<div
								aria-hidden
								className="h-px w-full bg-linear-to-r from-transparent via-white/40 to-transparent lg:hidden"
							/>

							<p className="text-base leading-6.5 text-white lg:w-1/2 lg:px-8 lg:text-lg">
								Working with Atod has been one of the best decisions we&rsquo;ve
								made for KiddiEdu. They took the time to understand our goals,
								then built more than a beautiful website, a solution that
								genuinely supports our day-to-day. Even after launch, their
								support has made them feel like a true partner in our growth.
							</p>
						</div>
					</div>

					<Image
						src={quote}
						alt=""
						aria-hidden
						className="absolute -bottom-24 right-3 hidden w-58.75 lg:block"
					/>
				</Reveal>
			</div>
		</section>
	);
}
