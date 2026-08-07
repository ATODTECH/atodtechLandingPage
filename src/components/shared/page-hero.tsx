import { FancyButton } from "@/components/shared/fancy-button";
import { HeroBackdrop } from "@/components/shared/hero-backdrop";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { cn } from "@/lib/utils";

type PageHeroProps = {
	title: string;
	description: string;
	badge?: React.ReactNode;
	action?: { label: string; href: string };
	contentClassName?: string;
	titleClassName?: string;
	descriptionClassName?: string;
	children?: React.ReactNode;
};

export function PageHero({
	title,
	description,
	badge,
	action,
	contentClassName,
	titleClassName,
	descriptionClassName,
	children,
}: PageHeroProps) {
	return (
		<section className="relative overflow-hidden bg-page">
			<HeroBackdrop priority />

			<RevealGroup
				trigger="mount"
				stagger={0.12}
				className={cn(
					"relative mx-auto flex w-full max-w-360 flex-col items-center px-6 pb-12 pt-33 md:pb-20 xl:px-30",
					contentClassName,
				)}
			>
				{badge && <RevealItem className="mb-6">{badge}</RevealItem>}
				<RevealItem>
					<h1
						className={cn(
							"heading-gradient max-w-290.5 text-center text-[40px] font-medium leading-tight tracking-[-1.44px] sm:text-[56px] lg:text-[72px] lg:leading-22.25",
							titleClassName,
						)}
					>
						{title}
					</h1>
				</RevealItem>
				<RevealItem>
					<p
						className={cn(
							"mt-6 max-w-161.25 text-center text-lg leading-7.5 text-white lg:text-xl",
							descriptionClassName,
						)}
					>
						{description}
					</p>
				</RevealItem>
				{action && (
					<RevealItem>
						<FancyButton href={action.href} className="mt-7">
							{action.label}
						</FancyButton>
					</RevealItem>
				)}
				{children}
			</RevealGroup>
		</section>
	);
}
