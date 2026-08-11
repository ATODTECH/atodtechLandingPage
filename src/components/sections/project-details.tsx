import Image from "next/image";

import { spiceIslandGrill } from "@/assets";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

type DetailBlock = {
	title: string;
	body?: string;
	items?: string[];
};

const detailBlocks: DetailBlock[] = [
	{
		title: "Challenges",
		items: [
			"Limited online visibility and digital presence.",
			"Customers lacked a convenient way to browse the menu or make reservations online.",
			"Manual handling of reservations and customer inquiries increased operational workload.",
		],
	},
	{
		title: "Solutions",
		items: [
			"Developed a modern, responsive restaurant website with an intuitive user interface.",
			"Implemented an online reservation system to simplify table bookings.",
			"Created a digital menu with organized food categories and item details.",
		],
	},
	{
		title: "Key Features",
		items: [
			"Responsive and mobile-friendly design.",
			"Gallery for food, drinks, and restaurant ambience.",
			"Table reservation/booking system.",
			"Contact Us page with contact form and Google Maps integration.",
			"Admin dashboard for managing restaurant content.",
		],
	},
	{
		title: "Product Impact",
		items: [
			"Increase online orders through a seamless and user-friendly ordering experience.",
			"Improve customer satisfaction with faster ordering, real time tracking, and secure payments.",
			"Boost customer retention by offering personalized recommendations, promotions, and an easy reordering process.",
		],
	},
];

export function ProjectDetails() {
	return (
		<section className="relative">
			<div className="mx-auto grid w-full max-w-360 gap-12 px-6 py-10 md:py-20 lg:grid-cols-2 lg:items-start lg:gap-8 xl:px-30">
				<RevealGroup className="flex items-start justify-center">
					<RevealItem className="w-full max-w-170">
						<Image
							src={spiceIslandGrill}
							alt="Spice Island Grill - website and app screens"
							sizes="(min-width: 1024px) 680px, calc(100vw - 48px)"
							className="w-full"
						/>
					</RevealItem>
				</RevealGroup>

				<RevealGroup
					stagger={0.12}
					amount={0.1}
					className="relative flex flex-col gap-14.5 pl-5"
				>
					<span
						aria-hidden
						className="absolute inset-y-0 left-0 top-4.5 w-px bg-brand-accent"
					/>
					{detailBlocks.map((block) => (
						<RevealItem
							key={block.title}
							className="relative flex flex-col gap-3.75"
						>
							<span
								aria-hidden
								className="absolute -left-5 top-3.5 size-2.25 -translate-x-1/2 -translate-y-1/2 rounded-full border border-brand-accent bg-page"
							/>
							<h2 className="text-[22px] font-semibold leading-tight text-white">
								{block.title}
							</h2>
							{block.body && (
								<p className="text-base leading-normal text-white/80">
									{block.body}
								</p>
							)}
							{block.items && (
								<ul className="flex list-disc flex-col gap-2 pl-5">
									{block.items.map((item) => (
										<li
											key={item}
											className="text-base leading-normal text-white/80 marker:text-white"
										>
											{item}
										</li>
									))}
								</ul>
							)}
						</RevealItem>
					))}
				</RevealGroup>
			</div>
		</section>
	);
}
