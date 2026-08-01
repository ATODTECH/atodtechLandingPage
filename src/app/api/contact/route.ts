import { NextResponse } from "next/server";
import { Resend } from "resend";
import * as yup from "yup";

import { renderContactEmail } from "@/lib/email/contact-email";
import { ContactUsSchema } from "@/lib/validation-schemas";

const CONTACT_RECIPIENTS = [
	// "info@atodtech.com",
	"tolajinadu1123@gmail.com",
	"atodtech200@gmail.com",
];
const FROM_ADDRESS = "Atod Contact Form <noreply@atodtech.com>";

export async function POST(request: Request) {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	let values;
	try {
		values = await ContactUsSchema.validate(body, {
			abortEarly: false,
			stripUnknown: true,
		});
	} catch (error) {
		if (error instanceof yup.ValidationError) {
			return NextResponse.json(
				{ error: error.errors[0] ?? "Invalid form data" },
				{ status: 400 },
			);
		}
		return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
	}

	if (values.atodHpField) {
		return NextResponse.json({ success: true });
	}

	if (!process.env.RESEND_API_KEY) {
		console.error("RESEND_API_KEY is not set");
		return NextResponse.json(
			{ error: "Email service is not configured" },
			{ status: 500 },
		);
	}

	const resend = new Resend(process.env.RESEND_API_KEY);

	const { name, email, phone, projectType, message } = values;

	const { error } = await resend.emails.send({
		from: FROM_ADDRESS,
		to: CONTACT_RECIPIENTS,
		replyTo: email,
		subject: `New project inquiry from ${name}`,
		html: renderContactEmail({ name, email, phone, projectType, message }),
	});

	if (error) {
		console.error("Resend error:", error);
		return NextResponse.json(
			{ error: "Failed to send message. Please try again." },
			{ status: 502 },
		);
	}

	return NextResponse.json({ success: true });
}
