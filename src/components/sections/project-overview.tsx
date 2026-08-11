import { OrnamentHeading } from "@/components/shared/ornament-heading";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";

export function ProjectOverview() {
	return (
		<section
			className="relative"
			style={{
				backgroundImage:
					"linear-gradient(175deg, #1e338a 7.25%, rgba(245, 111, 70, 0.49) 140.94%)",
			}}
		>
			<RevealGroup className="mx-auto flex w-full max-w-360 flex-col items-center px-6 py-10 text-center md:py-20 xl:px-30">
				<RevealItem>
					<OrnamentHeading>Project Overview</OrnamentHeading>
				</RevealItem>
				<RevealItem>
					<p className="mt-11 max-w-268 text-lg leading-normal text-white">
						The Spice Island Restaurant Website is a modern,
						responsive digital platform designed to strengthen the
						restaurant's online presence and enhance the customer
						experience. It is designed with a user-centric
						interface, fast performance, and mobile responsiveness
						to provide a seamless experience across all devices
						while supporting the restaurant's business growth.
					</p>
				</RevealItem>
			</RevealGroup>
		</section>
	);
}
