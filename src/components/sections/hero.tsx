import Image, { type StaticImageData } from "next/image";
import { ArrowRight, LifeBuoy, type LucideIcon } from "lucide-react";

import {
	flowConnector,
	flowCurveLeft,
	flowCurveRight,
	flowDesign,
	flowDevelop,
	flowDiscover,
	flowStrategy,
} from "@/assets";
import { FancyButton } from "@/components/shared/fancy-button";
import { HeroBackdrop } from "@/components/shared/hero-backdrop";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";
import Link from "next/link";

const capabilities = [
	"Custom Software",
	"Mobile Apps",
	"AI Automation",
	"Web Platforms",
	"Product Documentation",
	"Ongoing Support",
];

type FlowStep = {
	icon: StaticImageData | LucideIcon;
	label: string;
	className: string;
};

const flowSteps: FlowStep[] = [
	{ icon: flowDiscover, label: "Discover Needs", className: "left-0 top-0" },
	{
		icon: LifeBuoy,
		label: "Support & Scale",
		className: "left-254.5 top-0",
	},
	{
		icon: flowStrategy,
		label: "Strategy & Planning",
		className: "left-71.75 top-31.75",
	},
	{
		icon: flowDesign,
		label: "Design Interface",
		className: "left-128.25 top-31.75",
	},
	{
		icon: flowDevelop,
		label: "Develop Solutions",
		className: "left-178.25 top-31.75",
	},
];

const flowMilestones = [
	{ label: "Goals", className: "left-45.75 top-17.5" },
	{ label: "Launch Product", className: "left-222.25 top-17.5" },
];

function FlowChipIcon({ icon }: { icon: FlowStep["icon"] }) {
	if ("src" in icon) {
		return <Image src={icon} alt="" aria-hidden className="size-4" />;
	}
	const Icon = icon;
	return <Icon className="size-4 text-white" aria-hidden />;
}

function FlowChip({
	icon,
	label,
	className,
}: Partial<FlowStep> & { label: string }) {
	return (
		<div
			className={cn(
				"flex items-center gap-1 rounded-lg border border-white/10 bg-linear-to-b from-white/7 to-white/2 p-2.75 shadow-[0_8px_18px_rgba(0,0,0,0.35)]",
				className,
			)}
		>
			{icon && (
				<div className="rounded-xs border-[0.5px] border-brand-accent/40 bg-white/2 p-1">
					<FlowChipIcon icon={icon} />
				</div>
			)}
			<span className="whitespace-nowrap px-1 text-sm leading-5 tracking-[0.56px] text-white">
				{label}
			</span>
		</div>
	);
}

function FlowMilestone({
	label,
	className,
}: {
	label: string;
	className?: string;
}) {
	return (
		<div
			className={cn(
				"whitespace-nowrap rounded-sm bg-white px-4.5 py-2.25 text-center text-sm leading-3.75 tracking-[0.56px] text-brand",
				className,
			)}
		>
			{label}
		</div>
	);
}

export function Hero() {
	return (
		<section id="home" className="relative overflow-hidden bg-page">
			<HeroBackdrop priority />

			<RevealGroup
				trigger="mount"
				stagger={0.12}
				className="relative mx-auto flex w-full max-w-360 flex-col items-center px-6 pb-10 md:pb-20 pt-33 xl:px-30"
			>
				<RevealItem>
					<Link
						href="#projects"
						className="fancy-shadow flex w-fit max-w-full cursor-pointer items-center justify-center rounded-[50px] py-1 pl-1.5 pr-2.5 transition-[filter] hover:brightness-125 sm:pl-2 sm:pr-4"
					>
						<span className="fancy-gradient shrink-0 rounded-[50px] border border-white px-2.5 py-0.5 text-xs leading-5 tracking-[0.4px] text-badge-text sm:px-3.5 sm:text-sm sm:tracking-[0.56px]">
							New Projects
						</span>
						<span className="min-w-0 truncate px-1.5 text-xs leading-5 tracking-[0.4px] text-white sm:px-2 sm:text-sm sm:tracking-[0.56px]">
							<span className="sm:hidden">
								See our new products
							</span>
							<span className="hidden sm:inline">
								Check out our new products
							</span>
						</span>
						<ArrowRight
							className="size-3.5 shrink-0 text-white sm:size-4"
							aria-hidden
						/>
					</Link>
				</RevealItem>

				<RevealItem>
					<h1 className="heading-gradient mt-6.75 max-w-290.5 text-center text-[40px] font-medium leading-tight tracking-[-1.44px] sm:text-[56px] lg:text-[72px] lg:leading-22.25">
						Build Better. Automate Smarter. Grow Faster.
					</h1>
				</RevealItem>

				<RevealItem>
					<p className="mt-4 max-w-240 text-center text-lg leading-7.5 text-white lg:text-xl">
						ATOD designs and develops custom software, mobile
						applications, AI-powered automation, websites, and
						information systems for startups, businesses,
						institutions, and public-sector organizations.
					</p>
				</RevealItem>

				<RevealItem>
					<FancyButton href="/contact" className="mt-6.75">
						Start Your Project
					</FancyButton>
				</RevealItem>

				<RevealItem className="mt-10 flex flex-col items-center gap-2">
					<ul className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm leading-6 text-white/60 lg:text-base">
						{capabilities.map((capability, index) => (
							<li key={capability} className="flex items-center gap-2">
								{index > 0 && (
									<span aria-hidden className="text-white/35">
										&bull;
									</span>
								)}
								{capability}
							</li>
						))}
					</ul>
					<p className="max-w-160 text-center text-base leading-6 text-white">
						Delivering digital projects for clients and users in the
						United States and Nigeria.
					</p>
				</RevealItem>

				<RevealGroup
					trigger="mount"
					delay={0.7}
					stagger={0.08}
					className="relative mt-6 hidden h-43.25 w-294.5 min-[1200px]:block"
				>
					<Image
						src={flowCurveLeft}
						alt=""
						aria-hidden
						className="absolute left-39.5 top-5.75 h-31.75 w-31.5"
					/>
					<Image
						src={flowCurveRight}
						alt=""
						aria-hidden
						className="absolute left-222.25 top-5.75 h-31.75 w-31.5 -scale-x-100"
					/>
					{flowSteps.map((step) => (
						<RevealItem
							key={step.label}
							distance={12}
							className={cn("absolute", step.className)}
						>
							<FlowChip icon={step.icon} label={step.label} />
						</RevealItem>
					))}
					{flowMilestones.map((m) => (
						<RevealItem
							key={m.label}
							distance={12}
							className={cn("absolute", m.className)}
						>
							<FlowMilestone label={m.label} />
						</RevealItem>
					))}
					<Image
						src={flowConnector}
						alt=""
						aria-hidden
						className="absolute left-119.75 top-37.5 w-7.75"
					/>
					<Image
						src={flowConnector}
						alt=""
						aria-hidden
						className="absolute left-169.75 top-38 w-7.75"
					/>
				</RevealGroup>

				<RevealItem className="mt-8 flex flex-wrap items-center justify-center gap-2 min-[1200px]:hidden">
					{flowSteps.map((step) => (
						<FlowChip
							key={step.label}
							icon={step.icon}
							label={step.label}
						/>
					))}
					{flowMilestones.map((m) => (
						<FlowMilestone key={m.label} label={m.label} />
					))}
				</RevealItem>
			</RevealGroup>
		</section>
	);
}
