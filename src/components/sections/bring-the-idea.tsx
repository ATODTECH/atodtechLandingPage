import { ConsultationCta } from "@/components/sections/consultation-cta";

export function BringTheIdea() {
	return (
		<ConsultationCta
			eyebrow="Let's work together"
			heading="Bring the Idea. We Will Help You Shape the Project"
			description="You do not need to know every feature, technology, or technical term before speaking with us. Start with the problem you want to solve, the people you want to serve, or the process you want to improve."
			action={{ label: "Request a Consultation", href: "/contact" }}
		/>
	);
}
