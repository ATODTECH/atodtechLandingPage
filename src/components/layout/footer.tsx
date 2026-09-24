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
			{ label: "Our Services", href: "/services" },
			{ label: "Projects", href: "/projects" },
			{ label: "About Us", href: "/about" },
			{ label: "FAQs", href: "/faqs" },
			{ label: "Portal", href: "/portal/sign-in" },
		],
	},
	{
		heading: "Services",
		links: [
			{ label: "Web design", href: "/services" },
			{ label: "Web development", href: "/services" },
			{ label: "Mobile design", href: "/services" },
			{ label: "UI/UX design", href: "/services" },
			{ label: "Branding design", href: "/services" },
		],
	},
	{
		heading: "Contact Us",
		links: [
			{ label: "info@atodtech.com", href: "mailto:info@atodtech.com" },
			{ label: "admin@atodtech.com", href: "mailto:admin@atodtech.com" },
			{ label: "+234 906 052 6791", href: "tel:+2349060526791" },
			{ label: "Request a Consultation", href: "/contact" },
			{ label: "Contact Us", href: "/contact" },
		],
	},
];

// Profiles without an href yet link to "#".
const socialIcons: { src: typeof socialFacebook; label: string; href?: string }[] = [
	{ src: socialFacebook, label: "Facebook" },
	{ src: socialTwitter, label: "Twitter" },
	{
		src: socialInstagram,
		label: "Instagram",
		href: "https://www.instagram.com/atod_tech?stkn=MXJvZmxhYnZxeDAweQ%3D%3D",
	},
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
						<p className="mt-6 max-w-92.75 text-base leading-6 text-white">
							ATOD builds custom software, mobile applications, web platforms
							and AI automation solutions for organisations in the United
							States, Nigeria and beyond.
						</p>
						<div className="mt-8 flex items-center gap-5">
							{socialIcons.map((icon) => (
								<a
									key={icon.label}
									href={icon.href ?? "#"}
									aria-label={icon.label}
									{...(icon.href
										? { target: "_blank", rel: "noopener noreferrer" }
										: {})}
									className="cursor-pointer transition-opacity hover:opacity-70"
								>
									<Image src={icon.src} alt="" className="size-8" />
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
								{column.links.map((link) => {
									const className =
										"cursor-pointer break-all text-base leading-5.5 text-white transition-colors hover:text-brand-accent";
									const isDirect = /^(mailto|tel):/.test(link.href);

									return (
										<li key={link.label}>
											{isDirect ? (
												<a href={link.href} className={className}>
													{link.label}
												</a>
											) : (
												<Link href={link.href} className={className}>
													{link.label}
												</Link>
											)}
										</li>
									);
								})}
							</ul>
						</div>
					))}
				</div>

				<div className="mt-12 flex h-15 items-center justify-center border-t border-[#e1e4ed]/40 py-12 md:py-6">
					<p className="text-center text-sm leading-5.5 text-white/90 lg:text-base">
						Copyright &copy; 2026 ATOD Tech Agency{" "}
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
