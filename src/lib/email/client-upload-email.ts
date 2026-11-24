import {
	EMAIL_COLORS,
	escapeHtml,
	sendActionEmail,
} from "@/lib/email/action-email";

const MAX_LISTED = 10;

/** Tells the owner a client uploaded something, so nothing gets missed. */
export async function sendClientUploadEmail(input: {
	to: string;
	uploaderName: string;
	uploaderEmail: string;
	clientName: string;
	/** Names of everything uploaded, with their folders. */
	documentNames: string[];
	url: string;
}) {
	const strong = (text: string) =>
		`<strong style="color:${EMAIL_COLORS.white};">${escapeHtml(text)}</strong>`;

	const names = input.documentNames;
	const single = names.length === 1;
	const what = single ? `"${names[0]}"` : `${names.length} documents`;
	const listed = single ? [] : names.slice(0, MAX_LISTED);
	if (!single && names.length > MAX_LISTED) {
		listed.push(`and ${names.length - MAX_LISTED} more`);
	}

	await sendActionEmail(
		input.to,
		{
			subject: `${input.clientName}: ${input.uploaderName} uploaded ${what}`,
			heading: single
				? "A client uploaded a document"
				: "A client uploaded documents",
			bodyHtml: [
				`${strong(input.uploaderName)} (${escapeHtml(input.uploaderEmail)}) uploaded ${strong(single ? names[0] : what)} to the ${strong(input.clientName)} folder.`,
				...listed.map(escapeHtml),
			].join("<br />"),
			bodyText: [
				`${input.uploaderName} (${input.uploaderEmail}) uploaded ${what} to the ${input.clientName} folder.`,
				...listed.map((name) => `- ${name}`),
			].join("\n"),
			ctaLabel: single ? "View document" : "View documents",
			url: input.url,
			note: "You're receiving this because you're the owner of the Atod Tech portal.",
		},
		// Replying goes straight to the client.
		{ replyTo: input.uploaderEmail },
	);
}
