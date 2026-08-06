"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

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
	{
		question: "Do you build both web and mobile products?",
		answer:
			"Yes. We develop websites, web applications, Android apps, iOS apps, cross-platform apps, backend systems, databases, APIs, dashboards, and integrations.",
	},
	{
		question: "Can you automate our existing business processes?",
		answer:
			"Yes. We review current workflows and identify where software, AI, integration, or automation can reduce manual work and improve speed, accuracy, and customer service.",
	},
	{
		question: "Do you provide documentation?",
		answer:
			"Yes. We provide business, product, functional, technical, user, administrative, API, testing, deployment, and maintenance documentation as agreed.",
	},
	{
		question: "Can you improve an existing application?",
		answer:
			"Yes. We can audit, redesign, fix, optimize, integrate, modernize, expand, or rebuild an existing product.",
	},
	{
		question: "Do you work outside Nigeria?",
		answer:
			"Yes. ATOD has completed projects serving clients and users in both the United States and Nigeria and can collaborate remotely.",
	},
	{
		question: "Do you provide support after launch?",
		answer:
			"Yes. Support, maintenance, monitoring, optimization, updates, and continued development are available under agreed plans.",
	},
	{
		question: "Are the listed prices final?",
		answer:
			"No. They are indicative ranges. Final pricing follows discovery and a confirmed scope.",
	},
];

export function FaqAccordion() {
	const [openIndex, setOpenIndex] = useState(0);
	const baseId = useId();
	const reduced = useReducedMotion();

	return (
		<section className="relative">
			<div className="mx-auto w-full max-w-360 px-6 py-10 md:py-20 xl:px-30">
				<RevealGroup
					stagger={0.07}
					amount={0.05}
					className="rounded-[18px] border border-white/12 bg-white/3 p-4 shadow-[0_8px_24px_rgba(30,51,138,0.102)] backdrop-blur-sm"
				>
					{faqs.map((faq, index) => {
						const isOpen = index === openIndex;
						const panelId = `${baseId}-panel-${index}`;
						const buttonId = `${baseId}-button-${index}`;

						return (
							<RevealItem key={faq.question} distance={16}>
								<div
									className={cn(
										"border-b border-white/8",
										index === faqs.length - 1 && "border-b-transparent",
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
											<span
												aria-hidden
												className={cn(
													"relative size-5 shrink-0 transition-colors duration-300",
													isOpen ? "text-brand-accent" : "text-white/50",
												)}
											>
												<span className="absolute left-1/2 top-1/2 h-0.5 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current" />
												<span
													className={cn(
														"absolute left-1/2 top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current transition-transform duration-300 ease-out",
														isOpen && "scale-y-0",
													)}
												/>
											</span>
										</button>
									</h3>

									<AnimatePresence initial={false}>
										{isOpen && (
											<motion.div
												id={panelId}
												role="region"
												aria-labelledby={buttonId}
												className="overflow-hidden"
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{
													duration: reduced ? 0 : 0.3,
													ease: EASE,
													opacity: { duration: reduced ? 0 : 0.22 },
												}}
											>
												<p className="max-w-245 px-4 pb-6 text-[15px] leading-6 text-white/65">
													{faq.answer}
												</p>
											</motion.div>
										)}
									</AnimatePresence>
								</div>
							</RevealItem>
						);
					})}
				</RevealGroup>
			</div>
		</section>
	);
}
