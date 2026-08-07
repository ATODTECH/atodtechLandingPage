import Image from "next/image";

import { spiceIslandGrill } from "@/assets";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

const detailBlocks = [
	{
		title: "Challenges",
		body: "Finding reliable artisans is often time-consuming and stressful. Customers face issues with trust, availability, and quality of work. On the other side, skilled artisans often lack visibility and opportunities to showcase their skills to a wider audience.",
	},
	{
		title: "Solutions",
		items: [
			"Makes it easy for customers to discover, book, and review artisans.",
			"Provides artisans with more visibility and consistent job opportunities.",
			"Ensures trust and reliability through a rating and review system.",
		],
	},
	{
		title: "Key Features",
		items: [
			"Browse artisans by category (plumbing, electrical, carpentry).",
			"Schedule services at your convenience.",
			"Seamless communication between users and artisans.",
			"Pay directly through the app.",
		],
	},
	{
		title: "Product Impact",
		items: [
			"Helped hundreds of customers connect with verified artisans.",
			"Increased visibility for skilled workers in local communities.",
			"Improved trust and convenience in accessing handyman services.",
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
							alt="Spice Island Gril - website and app screens"
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
