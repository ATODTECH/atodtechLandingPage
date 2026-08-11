"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { ProjectCaseStudyModal } from "@/components/sections/project-case-study-modal";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { projects } from "@/lib/projects";

export function ProjectShowcase() {
	return (
		<RevealGroup
			stagger={0.12}
			className="mt-14 grid w-full max-w-300 gap-11 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3"
		>
			{projects.map((project) => (
				<RevealItem key={project.slug} className="relative pb-3 pl-3">
					<Image
						src={project.image}
						alt={`${project.name} — ${project.category}`}
						sizes="(min-width: 1024px) 371px, (min-width: 640px) calc((100vw - 92px) / 2), calc(100vw - 48px)"
						className="w-full rounded-xl"
					/>
					<Dialog>
						<DialogTrigger
							aria-label={`View the ${project.name} case study`}
							className="group/cta absolute bottom-0 left-0 flex size-17 cursor-pointer items-center justify-center rounded-full border-2 border-brand bg-page text-brand transition duration-300 ease-out hover:scale-105 hover:bg-brand hover:text-white hover:shadow-[0_0_0_6px_rgba(30,51,138,0.28)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent active:scale-100 motion-reduce:transition-none motion-reduce:hover:scale-100"
						>
							<ArrowUpRight
								className="size-8 transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5 group-hover/cta:-translate-y-0.5 motion-reduce:transition-none"
								aria-hidden
							/>
						</DialogTrigger>
						<ProjectCaseStudyModal project={project} />
					</Dialog>
				</RevealItem>
			))}
		</RevealGroup>
	);
}
