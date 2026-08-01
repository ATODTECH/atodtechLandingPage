import type { ContactUsValues } from "@/lib/validation-schemas";

const SITE_URL = "https://www.atodtech.com";
const LOGO_URL = `${SITE_URL}/atod-logo.png`;

const FONT_STACK =
	"'Inter','Segoe UI',Roboto,-apple-system,BlinkMacSystemFont,Helvetica,Arial,sans-serif";

const COLORS = {
	page: "#0c111d",
	card: "#0f1526",
	cardInset: "#0a0e18",
	border: "#1c2340",
	brand: "#1e338a",
	accent: "#f56f46",
	white: "#ffffff",
	muted: "#9aa2c0",
	label: "#7d86ab",
	faint: "#5b6386",
};

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

function nl2br(value: string) {
	return escapeHtml(value).replace(/\r?\n/g, "<br />");
}

type ContactEmailFields = Omit<ContactUsValues, "atodHpField">;

export function renderContactEmail({
	name,
	email,
	phone,
	projectType,
	message,
}: ContactEmailFields) {
	const firstName = name.trim().split(/\s+/)[0] || name;

	const preheader = `${name} · ${projectType} · ${email}`;

	const detailRow = (label: string, value: string, href?: string) => {
		const content = href
			? `<a href="${escapeHtml(href)}" style="color:${COLORS.white};text-decoration:none;">${escapeHtml(value)}</a>`
			: escapeHtml(value);

		return `
              <tr>
                <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};">
                  <p style="margin:0 0 5px;font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.label};font-family:${FONT_STACK};">${escapeHtml(label)}</p>
                  <p style="margin:0;font-size:15px;line-height:1.5;color:${COLORS.white};font-family:${FONT_STACK};word-break:break-word;">${content}</p>
                </td>
              </tr>`;
	};

	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <title>New project inquiry from ${escapeHtml(name)}</title>
  </head>
  <body style="margin:0;padding:0;width:100%;background-color:${COLORS.page};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.page};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:${COLORS.card};border:1px solid ${COLORS.border};border-radius:10px;overflow:hidden;">
            <tr>
              <td align="center" bgcolor="${COLORS.brand}" style="background-color:${COLORS.brand};background-image:linear-gradient(180deg,#2c46ac 0%,${COLORS.brand} 55%,#16265f 100%);padding:28px 32px;">
                <img src="${LOGO_URL}" width="88" height="97" alt="Atod Tech" style="display:block;width:88px;height:auto;border:0;outline:none;text-decoration:none;" />
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 6px;">
                <p style="margin:0 0 6px;font-size:21px;line-height:1.3;font-weight:700;color:${COLORS.white};font-family:${FONT_STACK};">New project inquiry</p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:${COLORS.muted};font-family:${FONT_STACK};">${escapeHtml(firstName)} reached out through the Atod Tech website.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 32px 0;">
                <span style="display:inline-block;background-color:rgba(245,111,70,0.14);border:1px solid rgba(245,111,70,0.45);color:${COLORS.accent};font-size:12px;line-height:1;font-weight:600;letter-spacing:0.02em;font-family:${FONT_STACK};padding:8px 14px;border-radius:999px;">${escapeHtml(projectType)}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:10px 32px 4px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${detailRow("Name", name)}
${detailRow("Email", email, `mailto:${email}`)}
${detailRow("Phone", phone, `tel:${phone.replace(/[^\d+]/g, "")}`)}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 32px 4px;">
                <p style="margin:0 0 10px;font-size:11px;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${COLORS.label};font-family:${FONT_STACK};">Message</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${COLORS.cardInset};border:1px solid ${COLORS.border};border-radius:10px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0;font-size:15px;line-height:1.65;color:${COLORS.white};font-family:${FONT_STACK};word-break:break-word;">${nl2br(message)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 30px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td bgcolor="${COLORS.accent}" style="background-color:${COLORS.accent};border-radius:999px;">
                      <a href="mailto:${escapeHtml(email)}?subject=${encodeURIComponent(`Re: your ${projectType} inquiry`)}" style="display:inline-block;padding:13px 28px;font-size:14px;line-height:1;font-weight:600;color:${COLORS.white};text-decoration:none;font-family:${FONT_STACK};border-radius:999px;">Reply to ${escapeHtml(firstName)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background-color:${COLORS.cardInset};border-top:1px solid ${COLORS.border};">
                <p style="margin:0;font-size:12px;line-height:1.6;color:${COLORS.faint};font-family:${FONT_STACK};">
                  Sent automatically from the contact form at
                  <a href="${SITE_URL}" style="color:${COLORS.muted};text-decoration:none;">atodtech.com</a>. Reply directly to reach ${escapeHtml(firstName)}.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
