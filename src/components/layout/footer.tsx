import Image from "next/image";
import Link from "next/link";

import {
	AtodBrandLogo,
	socialFacebook,
	socialInstagram,
	socialLinkedin,
	socialTwitter,
	socialYoutube,
} from "@/assets";

const footerColumns = [
	{
		heading: "Links",
		links: [
			{ label: "Home", href: "/" },
			{ label: "Projects", href: "/projects" },
			{ label: "About Us", href: "/about" },
			{ label: "Contact", href: "/contact" },
			{ label: "Privacy policy", href: "#" },
		],
	},
	{
		heading: "Services",
		links: [
			{ label: "Web design", href: "#" },
			{ label: "Web development", href: "#" },
			{ label: "Mobile design", href: "#" },
			{ label: "UI/UX design", href: "#" },
			{ label: "Branding design", href: "#" },
		],
	},
	{
		heading: "Contact us",
		links: [
			{ label: "Information", href: "/contact" },
			{ label: "Request a quote", href: "/contact" },
			{ label: "Consultation", href: "/contact" },
			{ label: "Help center", href: "#" },
			{ label: "Terms and conditions", href: "#" },
		],
	},
];

const socialIcons = [
	{ src: socialFacebook, label: "Facebook" },
	{ src: socialTwitter, label: "Twitter" },
	{ src: socialInstagram, label: "Instagram" },
	{ src: socialLinkedin, label: "LinkedIn" },
	{ src: socialYoutube, label: "YouTube" },
];

export function Footer() {
	return (
		<footer>
			<div className="mx-auto w-full max-w-360 px-6 pt-12 xl:px-30">
				<div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
					<div className="flex flex-col items-start">
						<Link
							href="/"
							aria-label="ATOD Tech Agency - Home"
							className="block cursor-pointer"
						>
							<AtodBrandLogo aria-hidden className="h-20 w-auto" />
						</Link>
						<p className="mt-6 max-w-80.75 text-base leading-6 text-white">
							We design and build digital products that empower businesses to
							grow.
						</p>
						<div className="mt-8 flex items-start gap-4">
							{socialIcons.map((icon) => (
								<a
									key={icon.label}
									href="#"
									aria-label={icon.label}
									className="cursor-pointer transition-opacity hover:opacity-70"
								>
									<Image src={icon.src} alt="" className="size-6" />
								</a>
							))}
						</div>
					</div>

					{footerColumns.map((column) => (
						<div key={column.heading} className="flex flex-col gap-8">
							<h3 className="text-base font-semibold leading-5.5 text-brand">
								{column.heading}
							</h3>
							<ul className="flex flex-col gap-6">
								{column.links.map((link) => (
									<li key={link.label}>
										<Link
											href={link.href}
											className="cursor-pointer text-base leading-5.5 text-white transition-colors hover:text-brand-accent"
										>
											{link.label}
										</Link>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-12 flex h-15 items-center justify-center border-t border-[#e1e4ed]/40 py-12 md:py-6">
					<p className="text-center text-sm leading-5.5 text-white/90 lg:text-base">
						Copyright &copy; 2025 ATOD Tech Agency{" "}
						<span className="text-[#d3d7e5]">|</span> All Rights Reserved{" "}
						<span className="text-[#d3d7e5]">|</span>{" "}
						<a href="#" className="cursor-pointer underline hover:text-white">
							Terms and Conditions
						</a>{" "}
						<span className="text-[#d3d7e5]">|</span>{" "}
						<a href="#" className="cursor-pointer underline hover:text-white">
							Privacy Policy
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
