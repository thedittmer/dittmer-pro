/// <reference path="../pb_data/types.d.ts" />
//
// Helpers shared by the social hooks. Loaded via require(`${__hooks}/_social_helpers.js`)
// inside each route handler — goja doesn't carry module-level decls into
// route closures, so we ship them in this commonjs module instead.
//

function makeToken() {
	let t = '';
	const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
	for (let i = 0; i < 32; i++) t += chars[Math.floor(Math.random() * chars.length)];
	return t;
}

function targetLabel(targetCollection, targetId) {
	try {
		if (targetCollection === 'stops') {
			const s = $app.findRecordById('stops', targetId);
			return s.getString('name') || 'a stop on the map';
		}
		if (targetCollection === 'posts') {
			const p = $app.findRecordById('posts', targetId);
			return p.getString('title') || 'a post';
		}
	} catch (_) {}
	return '';
}

function sendVerifyEmail(toAddress, toName, kind, body, target, verifyUrl) {
	const settings = $app.settings();
	const greeting = toName ? 'Hi ' + toName.split(' ')[0] + ',' : 'Hi,';
	const targetLbl = target || 'a stop';
	const what = kind === 'comment' ? 'comment' : 'reaction';
	const preview = body ? body.slice(0, 300) : '';

	const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4ecd8;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
<table style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3d8b9;border-radius:6px;padding:28px;">
<tr><td>
<div style="border-bottom:2px solid #c5611f;padding-bottom:14px;margin-bottom:18px;font-family:Helvetica,Arial,sans-serif;">
<div style="color:#c5611f;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;font-size:13px;">Dittmer Internet Pro</div>
<div style="color:#666;font-size:12px;margin-top:3px;">dittmer.pro</div>
</div>
<p style="margin:0 0 14px;">${greeting}</p>
<p style="margin:0 0 14px;">Thanks for leaving a ${what} on <em>${targetLbl}</em>. One more step — click the button below to publish it.</p>
${preview ? `<blockquote style="margin:14px 0;padding:10px 14px;background:#faf6e8;border-left:3px solid #c5611f;font-style:italic;color:#444;">${preview}</blockquote>` : ''}
<p style="margin:0 0 18px;">
<a href="${verifyUrl}" style="display:inline-block;background:#c5611f;color:#f4ecd8;padding:12px 22px;text-decoration:none;border-radius:4px;font-family:Helvetica,Arial,sans-serif;font-weight:bold;letter-spacing:0.04em;">Publish my ${what}</a>
</p>
<p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#666;">If the button doesn't work, paste this link:<br><a href="${verifyUrl}" style="color:#c5611f;word-break:break-all;">${verifyUrl}</a></p>
<p style="margin:18px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#666;">Once verified, you'll have an account here — next time you can sign in with a one-time code instead of verifying again. If you didn't post this, just ignore this email.</p>
</td></tr>
</table>
</body></html>`;

	const text = `${greeting}

Thanks for leaving a ${what} on ${targetLbl}. One more step — open this link to publish it:

${verifyUrl}
${preview ? '\nYour ' + what + ':\n  ' + preview + '\n' : ''}
Once verified you'll have an account here; next time you can sign in with a one-time code instead of verifying again. If you didn't post this, ignore this email.

— dittmer.pro`;

	const message = new MailerMessage({
		from: {
			address: settings.meta.senderAddress,
			name: settings.meta.senderName
		},
		to: [{ address: toAddress }],
		replyTo: [{ address: 'dittmer@hey.com' }],
		subject: 'Confirm your ' + what + ' on dittmer.pro',
		html: html,
		text: text
	});
	$app.newMailClient().send(message);
}

module.exports = {
	makeToken,
	targetLabel,
	sendVerifyEmail
};
