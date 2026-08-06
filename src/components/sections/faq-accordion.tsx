"use client";

import { useId, useState } from "react";
import { Minus, Plus } from "lucide-react";

import { Reveal } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

type Faq = {
	question: string;
	answer: string;
};

const faqs: Faq[] = [
	{
		question: "Can ATOD help when I only have an idea?",
		answer:
			"Yes. We can brainstorm with you, clarify the problem and target users, recommend enhancements, prepare documentation, prototype the solution, build it, and support launch.",
	},
	{ question: "Do you build both web and mobile products?", answer: "" },
	{ question: "Can you automate our existing business processes?", answer: "" },
	{ question: "Do you provide documentation?", answer: "" },
	{ question: "Can you improve an existing application?", answer: "" },
	{ question: "Do you work outside Nigeria?", answer: "" },
	{ question: "Do you provide support after launch?", answer: "" },
	{ question: "Are the listed prices final?", answer: "" },
];

export function FaqAccordion() {
	const [openIndex, setOpenIndex] = useState(0);
	const baseId = useId();

	return (
		<section className="relative">
			<div className="mx-auto w-full max-w-360 px-6 py-10 md:py-20 xl:px-30">
				<Reveal amount={0.05}>
					<div className="rounded-[18px] border border-white/12 bg-white/3 p-4 shadow-[0_8px_24px_rgba(30,51,138,0.102)] backdrop-blur-sm">
						{faqs.map((faq, index) => {
							const isOpen = index === openIndex;
							const panelId = `${baseId}-panel-${index}`;
							const buttonId = `${baseId}-button-${index}`;

							return (
								<div
									key={faq.question}
									className={cn(
										"border-b border-white/8 last:border-b-0",
										isOpen && "rounded-xl border-b-transparent bg-white/5",
									)}
								>
									<h3>
										<button
											type="button"
											id={buttonId}
											aria-expanded={isOpen}
											aria-controls={panelId}
											onClick={() => setOpenIndex(isOpen ? -1 : index)}
											className="flex w-full cursor-pointer items-center justify-between gap-6 px-4 py-6 text-left"
										>
											<span className="text-base font-semibold leading-[26px] text-white lg:text-lg">
												{faq.question}
											</span>
											{isOpen ? (
												<Minus
													className="size-5 shrink-0 text-brand-accent"
													aria-hidden
												/>
											) : (
												<Plus
													className="size-5 shrink-0 text-white/50"
													aria-hidden
												/>
											)}
										</button>
									</h3>

									{isOpen && faq.answer && (
										<div
											id={panelId}
											role="region"
											aria-labelledby={buttonId}
											className="px-4 pb-6"
										>
											<p className="max-w-245 text-[15px] leading-6 text-white/65">
												{faq.answer}
											</p>
										</div>
									)}
								</div>
							);
						})}
					</div>
				</Reveal>
			</div>
		</section>
	);
}
