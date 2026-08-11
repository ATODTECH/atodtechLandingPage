import Image from "next/image";

import { heroBg, sparklePlus } from "@/assets";
import { cn } from "@/lib/utils";

const sparklePositions = [
	"left-[87.5%] top-[42%]",
	"left-[82.6%] top-[58%]",
	"left-[81.8%] top-[16%]",
	"left-[8%] top-[32%]",
	"left-[24.5%] top-[16%]",
	"left-[13.3%] top-[42%]",
];

export function HeroBackdrop({ priority = false }: { priority?: boolean }) {
	return (
		<>
			<Image
				src={heroBg}
				alt=""
				aria-hidden
				priority={priority}
				sizes="100vw"
				className="pointer-events-none absolute inset-0 size-full object-cover"
			/>
			{sparklePositions.map((position) => (
				<Image
					key={position}
					src={sparklePlus}
					alt=""
					aria-hidden
					className={cn("absolute hidden size-6 md:block", position)}
				/>
			))}
		</>
	);
}
