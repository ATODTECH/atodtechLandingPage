import {
	EMAIL_COLORS,
	escapeHtml,
	sendActionEmail,
} from "@/lib/email/action-email";

/** Tells the owner a client uploaded something, so nothing gets missed. */
export async function sendClientUploadEmail(input: {
	to: string;
	uploaderName: string;
	uploaderEmail: string;
	clientName: string;
	documentName: string;
	url: string;
}) {
	const strong = (text: string) =>
		`<strong style="color:${EMAIL_COLORS.white};">${escapeHtml(text)}</strong>`;

	await sendActionEmail(
		input.to,
		{
			subject: `${input.clientName}: ${input.uploaderName} uploaded "${input.documentName}"`,
			heading: "A client uploaded a document",
			bodyHtml: `${strong(input.uploaderName)} (${escapeHtml(input.uploaderEmail)}) uploaded ${strong(input.documentName)} to the ${strong(input.clientName)} folder.`,
			bodyText: `${input.uploaderName} (${input.uploaderEmail}) uploaded "${input.documentName}" to the ${input.clientName} folder.`,
			ctaLabel: "View document",
			url: input.url,
			note: "You're receiving this because you're the owner of the Atod Tech portal.",
		},
		// Replying goes straight to the client.
		{ replyTo: input.uploaderEmail },
	);
}
