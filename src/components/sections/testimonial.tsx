import Image from "next/image";
import { avatarLawal, dots, glowEllipse, iconUserQuestion, quote } from "@/assets";
import { ExpandableQuote } from "@/components/shared/expandable-quote";
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
						<SectionBadge icon={iconUserQuestion}>
							Testimonial
						</SectionBadge>
					</RevealItem>
					<RevealItem>
						<SectionHeading>
							What Client Says About Us
						</SectionHeading>
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
								<Image
									src={avatarLawal}
									alt="Portrait of Lawal Halima"
									sizes="(min-width: 640px) 188px, 140px"
									className="size-35 rounded-full object-cover sm:size-47"
								/>
								<div className="flex max-w-76.25 flex-col gap-6.75">
									<div className="flex flex-col gap-2.5 text-white">
										<p className="text-2xl font-medium">
											Lawal Halima
										</p>
										<p className="text-lg">
											CEO - Hamony App
										</p>
									</div>
									<a
										href="https://www.linkedin.com/in/lawal-553807195"
										target="_blank"
										rel="noopener noreferrer"
										className="cursor-pointer break-all text-sm text-brand-accent hover:underline"
									>
										https://www.linkedin.com/in/lawal-553807195
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

							<ExpandableQuote className="lg:w-1/2 lg:px-8">
								Working with Atod has been one of the best
								decisions we&rsquo;ve made for our business.
								From the very first meeting, the team took the
								time to understand our goals and challenges, and
								they translated that into a clear digital
								strategy. They didn&rsquo;t just design a
								beautiful website for us, they built a solution
								that truly supports our day-to-day operations
								and helps us connect better with our customers.
								The attention to detail, creativity, and
								professionalism they brought to the project
								exceeded our expectations. Even after launch,
								their ongoing support and improvements have made
								us feel like we have a true partner in our
								growth.
							</ExpandableQuote>
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
