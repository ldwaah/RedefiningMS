const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const jsonResponse = (statusCode, body, extraHeaders = {}) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json",
    ...extraHeaders,
  },
  body: JSON.stringify(body),
});

const buildCourseEmailHtml = (name, courseUrl) => {
  const safeName = name.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[char] || char;
  });
  const safeUrl = courseUrl.replace(/"/g, "%22");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Your free coaching course</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;color:#f4f0e8;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:32rem;">
          <tr>
            <td style="padding-bottom:1.5rem;font-size:0.75rem;letter-spacing:0.16em;text-transform:uppercase;color:#a8b5a0;font-family:Helvetica,Arial,sans-serif;">
              Redefining MS
            </td>
          </tr>
          <tr>
            <td style="font-size:1.35rem;line-height:1.5;padding-bottom:1rem;">
              Hi ${safeName},
            </td>
          </tr>
          <tr>
            <td style="font-size:1.05rem;line-height:1.65;color:rgba(244,240,232,0.88);padding-bottom:1.75rem;font-family:Helvetica,Arial,sans-serif;">
              Thank you for signing up. Here is your link to start <strong style="color:#f4f0e8;">The Rebuilding Room</strong> — my free coaching course.
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:1.75rem;">
              <a href="${safeUrl}" style="display:inline-block;padding:0.85rem 1.6rem;border:1px solid #f4f0e8;border-radius:999px;background:#f4f0e8;color:#0a0a0a;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;">
                Enter The Rebuilding Room
              </a>
            </td>
          </tr>
          <tr>
            <td style="font-size:0.92rem;line-height:1.6;color:#a8b5a0;font-family:Helvetica,Arial,sans-serif;">
              If the button does not work, copy and paste this link into your browser:<br />
              <a href="${safeUrl}" style="color:#c8d4c2;word-break:break-all;">${safeUrl}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: {}, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  let payload;

  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return jsonResponse(400, { error: "Invalid request" });
  }

  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim().toLowerCase();

  if (!name || !emailPattern.test(email)) {
    return jsonResponse(400, { error: "Please provide a valid name and email address." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "Redefining MS <onboarding@resend.dev>";
  const courseUrl =
    process.env.COACHING_COURSE_URL || "https://redefiningms.co.uk/the-rebuilding-room/";
  const notifyEmail = process.env.COACHING_NOTIFY_EMAIL;

  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return jsonResponse(500, { error: "Email service is not configured yet." });
  }

  const sendEmail = async ({ to, subject, html }) => {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Resend error:", response.status, detail);
      throw new Error("Resend request failed");
    }
  };

  try {
    await sendEmail({
      to: email,
      subject: "Your link to The Rebuilding Room — free coaching course",
      html: buildCourseEmailHtml(name, courseUrl),
    });

    if (notifyEmail) {
      await sendEmail({
        to: notifyEmail,
        subject: `New coaching signup: ${name}`,
        html: `<p><strong>${name}</strong> (${email}) requested access to The Rebuilding Room.</p>`,
      });
    }

    return jsonResponse(200, { ok: true });
  } catch (error) {
    console.error(error);
    return jsonResponse(500, { error: "We could not send your email. Please try again shortly." });
  }
};
