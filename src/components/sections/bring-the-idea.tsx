import Image from "next/image";

import { sparklePlus } from "@/assets";
import { FancyButton } from "@/components/shared/fancy-button";
import { OverlineBadge } from "@/components/shared/overline-badge";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

export function BringTheIdea() {
	return (
		<section className="relative overflow-hidden">
			<div
				aria-hidden
				className="grid-rules pointer-events-none absolute inset-0"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute left-1/2 top-1/2 size-150 max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/25 blur-[140px]"
			/>
			<Image
				src={sparklePlus}
				alt=""
				aria-hidden
				className="pointer-events-none absolute left-[16%] top-[20%] hidden size-6 opacity-40 md:block"
			/>
			<Image
				src={sparklePlus}
				alt=""
				aria-hidden
				className="pointer-events-none absolute right-[18%] bottom-[24%] hidden size-6 opacity-60 md:block"
			/>

			<div className="relative mx-auto w-full max-w-360 px-6 py-16 md:py-28 xl:px-30">
				<RevealGroup className="mx-auto flex max-w-245 flex-col items-center gap-6 text-center">
					<RevealItem>
						<OverlineBadge variant="eyebrow">Let&rsquo;s work together</OverlineBadge>
					</RevealItem>
					<RevealItem>
						<h2 className="max-w-225 text-[28px] font-bold leading-tight text-white sm:text-[34px] lg:text-[40px]">
							Bring the Idea. We Will Help You Shape the Project
						</h2>
					</RevealItem>
					<RevealItem>
						<p className="max-w-210 text-base leading-7 text-white/65 lg:text-lg">
							You do not need to know every feature, technology, or technical
							term before speaking with us. Start with the problem you want to
							solve, the people you want to serve, or the process you want to
							improve.
						</p>
					</RevealItem>
					<RevealItem>
						<FancyButton href="/contact" className="mt-2">
							Request a Consultation
						</FancyButton>
					</RevealItem>
				</RevealGroup>
			</div>
		</section>
	);
}
