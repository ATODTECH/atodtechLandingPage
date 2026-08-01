"use client";

import Image from "next/image";
import { ArrowRight, Mail, Phone, type LucideIcon } from "lucide-react";

import {
	socialFacebook,
	socialInstagram,
	socialLinkedin,
	socialTwitter,
	socialYoutube,
} from "@/assets";
import { FormField } from "@/components/form/form-field";
import { LoadingButton } from "@/components/form/loading-button";
import { RevealGroup, RevealItem } from "@/components/shared/reveal";
import Link from "next/link";
import { useFormik } from "formik";
import {
	ContactUsSchema,
	type ContactUsValues,
} from "@/lib/validation-schemas";
import { toast } from "sonner";

const socialIcons = [
	{ src: socialFacebook, label: "Facebook" },
	{ src: socialTwitter, label: "Twitter" },
	{ src: socialInstagram, label: "Instagram" },
	{ src: socialLinkedin, label: "LinkedIn" },
	{ src: socialYoutube, label: "YouTube" },
];

const formFields: Array<{
	id: "name" | "email" | "phone" | "projectType";
	label: string;
	placeholder: string;
	type: "text" | "email" | "tel";
}> = [
	{ id: "name", label: "Name", placeholder: "Lawal Halima", type: "text" },
	{
		id: "email",
		label: "Email",
		placeholder: "example@youremail.com",
		type: "email",
	},
	{
		id: "phone",
		label: "Phone",
		placeholder: "+234 803 426 6076",
		type: "tel",
	},
	{
		id: "projectType",
		label: "Project Type",
		placeholder: "e.g. Web Development",
		type: "text",
	},
];

const initialValues: ContactUsValues = {
	name: "",
	email: "",
	phone: "",
	projectType: "",
	message: "",
	atodHpField: "",
};

function ContactMethod({
	icon: Icon,
	label,
	value,
	href,
}: {
	icon: LucideIcon;
	label: string;
	value: string;
	href: string;
}) {
	return (
		<div className="flex items-center gap-4">
			<span className="flex size-12 shrink-0 items-center justify-center rounded-sm border-2 border-brand bg-white">
				<Icon className="size-6 text-brand" aria-hidden />
			</span>
			<div className="flex flex-col gap-1.5">
				<span className="text-sm leading-none text-white">{label}</span>
				<a
					href={href}
					className="cursor-pointer text-base font-medium leading-none text-white transition-colors hover:text-brand-accent"
				>
					{value}
				</a>
			</div>
		</div>
	);
}

export function ContactDetails() {
	const formik = useFormik({
		initialValues,
		validationSchema: ContactUsSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			try {
				const response = await fetch("/api/contact", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(values),
				});

				const data = await response.json();

				if (!response.ok) {
					throw new Error(data.error || "Failed to send message");
				}

				toast.success("Message sent successfully! We'll get back to you soon.");
				resetForm();
			} catch (error) {
				console.error("Error:", error);
				toast.error("Something went wrong. Please try again.");
			} finally {
				setSubmitting(false);
			}
		},
	});

	return (
		<RevealGroup
			stagger={0.15}
			amount={0.1}
			className="mt-14 flex w-full max-w-223.25 flex-col gap-10 lg:mt-20 lg:flex-row lg:items-center lg:gap-16 justify-between"
		>
			<RevealItem direction="right" className="flex flex-col">
				<h2 className="text-lg font-semibold leading-tight text-white">
					Want to reach out directly?
				</h2>
				<p className="mt-4 text-base leading-normal text-white/70">
					We&rsquo;d love to hear from you.
				</p>

				<div className="mt-6 flex flex-col gap-4">
					<ContactMethod
						icon={Mail}
						label="Email:"
						value="atodtech200@gmail.com"
						href="mailto:atodtech200@gmail.com"
					/>
					<hr className="border-white" />
					<ContactMethod
						icon={Phone}
						label="Phone:"
						value="+234 906 052 6791"
						href="tel:+2349060526791"
					/>
				</div>

				<p className="mt-12 text-base font-medium leading-none text-white">
					Follow us on social media
				</p>
				<div className="mt-4 flex items-center gap-4">
					{socialIcons.map((icon) => (
						<Link
							key={icon.label}
							href=""
							aria-label={icon.label}
							className="cursor-pointer transition-opacity hover:opacity-70"
						>
							<Image src={icon.src} alt="" className="size-6" />
						</Link>
					))}
				</div>
			</RevealItem>

			<RevealItem direction="left" className="w-full max-w-130.75">
				<form
					noValidate
					onSubmit={formik.handleSubmit}
					className="flex w-full flex-col gap-6 rounded-md border border-white/10 bg-transparent p-0 md:p-8"
				>
					<input
						type="text"
						name="atodHpField"
						value={formik.values.atodHpField ?? ""}
						onChange={formik.handleChange}
						tabIndex={-1}
						autoComplete="off"
						aria-hidden="true"
						data-lpignore="true"
						data-1p-ignore="true"
						className="sr-only"
					/>

					<div className="grid gap-6 sm:grid-cols-2">
						{formFields.map((field) => (
							<FormField
								key={field.id}
								id={field.id}
								label={field.label}
								placeholder={field.placeholder}
								type={field.type}
								value={formik.values[field.id]}
								onChange={formik.handleChange}
								onBlur={formik.handleBlur}
								disabled={formik.isSubmitting}
								error={
									formik.touched[field.id] ? formik.errors[field.id] : undefined
								}
							/>
						))}
					</div>

					<FormField
						id="message"
						label="Message"
						type="textarea"
						placeholder="Type your message here.."
						value={formik.values.message}
						onChange={formik.handleChange}
						onBlur={formik.handleBlur}
						disabled={formik.isSubmitting}
						error={formik.touched.message ? formik.errors.message : undefined}
					/>

					<LoadingButton
						type="submit"
						loading={formik.isSubmitting}
						loadingText="Sending..."
						className="mt-5 fancy-gradient fancy-shadow h-10 w-fit gap-2 rounded-[50px] border border-white px-8 text-sm font-normal tracking-[0.56px] text-white transition-[filter] hover:brightness-125"
					>
						Send Message
						<ArrowRight className="size-3" aria-hidden />
					</LoadingButton>
				</form>
			</RevealItem>
		</RevealGroup>
	);
}
