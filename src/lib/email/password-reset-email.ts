import { escapeHtml, sendActionEmail } from "@/lib/email/action-email";

export async function sendPasswordResetEmail(input: {
	to: string;
	name: string;
	url: string;
}) {
	const body = `Hi ${input.name}, we received a request to reset the password for your Atod Tech portal account. Use the button below to choose a new one.`;
	await sendActionEmail(input.to, {
		subject: "Reset your Atod Tech portal password",
		heading: "Reset your password",
		bodyHtml: escapeHtml(body),
		bodyText: body,
		ctaLabel: "Reset password",
		url: input.url,
		note: "This link expires in 1 hour and can only be used once. If you didn't ask to reset your password, your account is still safe and you can ignore this email.",
	});
}
