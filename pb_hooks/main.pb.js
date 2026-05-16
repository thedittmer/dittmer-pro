/// <reference path="../pb_data/types.d.ts" />
//
// Custom PB endpoints. Loaded automatically from pb_hooks/ on server start.
//

// POST /api/billing/send-invoice
// Body: { project_id: string, to: string, amount?: number, note?: string }
// Admin-only. Renders a simple HTML invoice for the given project and
// sends it via the configured SMTP (Resend).
routerAdd('POST', '/api/billing/send-invoice', (e) => {
	// Config (goja doesn't carry module-level consts into route closures reliably).
	// Update REMIT_TO.street when you have an actual mailing address.
	const REMIT_TO = {
		name: 'Dittmer Internet Pro',
		attn: 'Jason Dittmer',
		street: '', // e.g., 'PO Box 123'  ← fill in
		city: 'Neosho',
		state: 'MO',
		zip: '64850'
	};
	const REPLY_TO = 'dittmer@hey.com';

	// Admin gate — only logged-in users with admin=true on the users collection.
	const auth = e.auth;
	if (!auth || auth.collection().name !== 'users' || !auth.getBool('admin')) {
		return e.json(403, { message: 'admin required' });
	}

	const body = new DynamicModel({
		project_id: '',
		to: '',
		amount: 0,
		note: '',
		description: '', // line-item description for THIS invoice
		invoice_number: '', // optional override; auto-generated if blank
		due_date: '' // YYYY-MM-DD; default = today + 14
	});
	e.bindBody(body);

	if (!body.project_id || !body.to) {
		return e.json(400, { message: 'project_id and to are required' });
	}

	try {

	let project;
	try {
		project = $app.findRecordById('projects', body.project_id);
	} catch (_) {
		return e.json(404, { message: 'project not found' });
	}

	let client = null;
	try {
		client = $app.findRecordById('clients', project.getString('client'));
	} catch (_) {}

	// Pull payments to compute current balance.
	const payments = $app.findRecordsByFilter(
		'payments',
		'project = {:pid}',
		'-received_date',
		200,
		0,
		{ pid: project.id }
	);

	const setupFee = project.getFloat('setup_fee') || 0;
	const monthly = project.getFloat('monthly_fee') || 0;
	const monthlyAfter = project.getFloat('monthly_fee_after') || 0;
	const year1Months = project.getFloat('year1_months') || 0;
	const agreedY1 = setupFee + monthly * year1Months;
	let received = 0;
	for (let i = 0; i < payments.length; i++) {
		received += payments[i].getFloat('amount') || 0;
	}
	const balance = agreedY1 - received;
	const requestedAmount = body.amount && body.amount > 0 ? body.amount : balance;

	const businessName =
		project.getString('business_name') || project.getString('name') || 'your project';
	const clientName = client ? client.getString('name') : '';
	const billingName = client
		? client.getString('billing_name') || client.getString('name')
		: '';
	const clientEmail = client ? client.getString('email') : '';
	const greetingFirstName = clientName ? clientName.split(' ')[0] : '';
	const note = body.note || '';

	// Pull all other projects owned by the same client, then their payments
	// this calendar year, so the invoice doubles as a YTD account statement.
	const clientProjects = client
		? $app.findRecordsByFilter('projects', 'client = {:cid}', 'business_name', 50, 0, {
				cid: client.id
			})
		: [project];

	const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();
	const ytdRows = [];
	const projectBalances = [];
	let ytdTotal = 0;
	for (let i = 0; i < clientProjects.length; i++) {
		const pj = clientProjects[i];
		const pjPayments = $app.findRecordsByFilter(
			'payments',
			'project = {:pid}',
			'received_date',
			500,
			0,
			{ pid: pj.id }
		);
		const pjSetup = pj.getFloat('setup_fee') || 0;
		const pjMonthly = pj.getFloat('monthly_fee') || 0;
		const pjY1m = pj.getFloat('year1_months') || 0;
		const pjAgreed = pjSetup + pjMonthly * pjY1m;
		let pjReceived = 0;
		for (let k = 0; k < pjPayments.length; k++) {
			pjReceived += pjPayments[k].getFloat('amount') || 0;
			const date = pjPayments[k].getString('received_date');
			if (date && date >= yearStart) {
				ytdRows.push({
					date: date,
					project: pj.getString('business_name') || pj.getString('name') || '—',
					amount: pjPayments[k].getFloat('amount') || 0,
					method: pjPayments[k].getString('method') || '',
					reference: pjPayments[k].getString('reference') || ''
				});
				ytdTotal += pjPayments[k].getFloat('amount') || 0;
			}
		}
		projectBalances.push({
			name: pj.getString('business_name') || pj.getString('name') || '—',
			agreed: pjAgreed,
			received: pjReceived,
			balance: pjAgreed - pjReceived
		});
	}

	// sort YTD rows oldest → newest
	ytdRows.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

	// goja runtime doesn't support Intl.NumberFormat options — format by hand.
	const fmt = (n) => {
		const sign = n < 0 ? '-' : '';
		const abs = Math.abs(n);
		const dollars = Math.floor(abs);
		const cents = Math.round((abs - dollars) * 100);
		const dollarsStr = String(dollars).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
		return sign + '$' + dollarsStr + '.' + String(cents).padStart(2, '0');
	};

	const MONTHS = [
		'January', 'February', 'March', 'April', 'May', 'June',
		'July', 'August', 'September', 'October', 'November', 'December'
	];
	const _d = new Date();
	const today = MONTHS[_d.getMonth()] + ' ' + _d.getDate() + ', ' + _d.getFullYear();

	// Due date: explicit param or today + 14 days
	let dueDateObj;
	if (body.due_date) {
		dueDateObj = new Date(body.due_date + 'T00:00:00');
	} else {
		dueDateObj = new Date(_d.getTime() + 14 * 86_400_000);
	}
	const dueDateLabel =
		MONTHS[dueDateObj.getMonth()] +
		' ' +
		dueDateObj.getDate() +
		', ' +
		dueDateObj.getFullYear();

	// Invoice number: caller-provided or auto-gen as INV-<INITIALS>-<YYMM>-<HEX4>
	let invoiceNumber = body.invoice_number;
	if (!invoiceNumber) {
		// Derive initials from business name first (multi-word → multi-letter),
		// else fall back to first 3 letters of the domain or "INV".
		const source = businessName && /\s/.test(businessName) ? businessName : project.getString('domain') || businessName || 'inv';
		let initials = (source.match(/\b\w/g) || []).join('').toUpperCase();
		if (initials.length < 3) {
			initials = source.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
		}
		initials = initials.slice(0, 4) || 'INV';
		const yymm =
			String(_d.getFullYear()).slice(2) +
			String(_d.getMonth() + 1).padStart(2, '0');
		const rand = Math.floor(Math.random() * 65535)
			.toString(16)
			.toUpperCase()
			.padStart(4, '0');
		invoiceNumber = 'INV-' + initials + '-' + yymm + '-' + rand;
	}

	// Line item description for THIS invoice
	const lineDescription =
		body.description ||
		(note ? note.split('.')[0] : businessName + ' — payment');

	// Remit-to block (rendered if street is set)
	const hasRemit = !!REMIT_TO.street;
	const remitHtml = hasRemit
		? `<div style="margin-top:8px;padding:12px;background:#faf6e8;border-radius:4px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5;">
<div style="color:#666;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;margin-bottom:4px;">Mail check to</div>
<div><strong>${REMIT_TO.name}</strong></div>
${REMIT_TO.attn ? `<div>Attn: ${REMIT_TO.attn}</div>` : ''}
<div>${REMIT_TO.street}</div>
<div>${REMIT_TO.city}, ${REMIT_TO.state} ${REMIT_TO.zip}</div>
</div>`
		: '';
	const remitText = hasRemit
		? `\n\nMail check to:\n  ${REMIT_TO.name}${REMIT_TO.attn ? '\n  Attn: ' + REMIT_TO.attn : ''}\n  ${REMIT_TO.street}\n  ${REMIT_TO.city}, ${REMIT_TO.state} ${REMIT_TO.zip}`
		: '';

	const html = `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#f4ecd8;font-family:Georgia,'Times New Roman',serif;color:#1a1a1a;">
<table style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e3d8b9;border-radius:6px;padding:32px;">
<tr><td>
<div style="border-bottom:2px solid #c5611f;padding-bottom:16px;margin-bottom:24px;">
<div style="color:#c5611f;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;font-size:13px;font-family:Helvetica,Arial,sans-serif;">Dittmer Internet Pro</div>
<div style="color:#666;font-size:13px;margin-top:4px;font-family:Helvetica,Arial,sans-serif;">Jason Dittmer · 417-312-1469 · dittmer@hey.com</div>
</div>

<table style="width:100%;margin-bottom:24px;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
<tr>
<td style="vertical-align:top;">
<h1 style="font-size:24px;font-style:italic;font-weight:400;margin:0 0 4px;font-family:Georgia,'Times New Roman',serif;">Invoice</h1>
<div style="color:#666;">${invoiceNumber}</div>
<div style="color:#666;margin-top:6px;">Issued ${today}</div>
<div style="color:#c5611f;font-weight:bold;margin-top:2px;">Due ${dueDateLabel}</div>
</td>
<td style="vertical-align:top;text-align:right;">
<div style="color:#666;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;">Bill to</div>
<div style="margin-top:4px;font-size:14px;">${billingName || '—'}</div>
${clientEmail ? `<div style="color:#666;font-size:12px;">${clientEmail}</div>` : ''}
</td>
</tr>
</table>

<p style="margin:0 0 16px;">${greetingFirstName ? 'Hi ' + greetingFirstName + ',' : 'Hi,'}</p>

<p style="margin:0 0 16px;">Here's an invoice toward <strong>${businessName}</strong>${
		project.getString('domain') ? ' (' + project.getString('domain') + ')' : ''
	}.</p>

${note ? `<p style="margin:0 0 16px;">${note}</p>` : ''}

<!-- This invoice -->
<table style="width:100%;border-collapse:collapse;margin:24px 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
<thead>
<tr style="background:#1a1a1a;color:#f4ecd8;">
<th style="text-align:left;padding:10px 14px;">Description</th>
<th style="text-align:right;padding:10px 14px;">Amount</th>
</tr>
</thead>
<tbody>
<tr><td style="padding:14px;">${lineDescription}</td><td style="padding:14px;text-align:right;">${fmt(requestedAmount)}</td></tr>
<tr style="background:#fff3d6;border-top:2px solid #c5611f;"><td style="padding:14px;font-weight:bold;color:#c5611f;">Amount due ${dueDateLabel}</td><td style="padding:14px;text-align:right;font-weight:bold;color:#c5611f;font-size:18px;">${fmt(requestedAmount)}</td></tr>
</tbody>
</table>

<!-- Project terms context -->
<div style="margin:24px 0;padding:14px;background:#faf6e8;border-radius:4px;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
<div style="color:#666;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;margin-bottom:8px;">Project terms · ${businessName}</div>
<table style="width:100%;border-collapse:collapse;">
<tr><td style="padding:3px 0;color:#444;">Setup fee</td><td style="padding:3px 0;text-align:right;">${fmt(setupFee)}</td></tr>
<tr><td style="padding:3px 0;color:#444;">Monthly (first 12 months)</td><td style="padding:3px 0;text-align:right;">${fmt(monthly)} / mo</td></tr>
<tr><td style="padding:3px 0;color:#444;">After year 1</td><td style="padding:3px 0;text-align:right;">${fmt(monthlyAfter)} / mo</td></tr>
<tr style="border-top:1px solid #e3d8b9;"><td style="padding:6px 0 3px;font-weight:bold;">Year 1 total</td><td style="padding:6px 0 3px;text-align:right;font-weight:bold;">${fmt(agreedY1)}</td></tr>
<tr><td style="padding:3px 0;color:#666;">Received toward Year 1</td><td style="padding:3px 0;text-align:right;color:#666;">${fmt(received)}</td></tr>
<tr><td style="padding:3px 0;color:#666;">After this payment</td><td style="padding:3px 0;text-align:right;color:#666;">${fmt(received + requestedAmount)}</td></tr>
</table>
</div>

<p style="margin:0 0 8px;font-size:14px;font-family:Helvetica,Arial,sans-serif;color:#444;">
Pay by check (made out to <strong>Dittmer Internet Pro</strong>). Online card and bank payments via Square are coming soon.
</p>
${remitHtml}

<!-- Year-to-date account statement -->
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e3d8b9;">
<div style="color:#666;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;font-family:Helvetica,Arial,sans-serif;margin-bottom:8px;">Account statement · ${_d.getFullYear()} year-to-date</div>

${ytdRows.length > 0
  ? `<table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:13px;margin-bottom:16px;">
<thead>
<tr style="border-bottom:1px solid #ede4cc;color:#666;">
<th style="text-align:left;padding:6px 8px;font-weight:normal;">Date</th>
<th style="text-align:left;padding:6px 8px;font-weight:normal;">Project</th>
<th style="text-align:left;padding:6px 8px;font-weight:normal;">Method</th>
<th style="text-align:right;padding:6px 8px;font-weight:normal;">Amount</th>
</tr>
</thead>
<tbody>
${ytdRows.map((r) => `<tr style="border-bottom:1px solid #f5eed8;"><td style="padding:6px 8px;color:#666;">${r.date.slice(0, 10)}</td><td style="padding:6px 8px;">${r.project}</td><td style="padding:6px 8px;color:#666;">${r.method}${r.reference ? ' · #' + r.reference : ''}</td><td style="padding:6px 8px;text-align:right;">${fmt(r.amount)}</td></tr>`).join('\n')}
<tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">YTD paid</td><td style="padding:8px;text-align:right;font-weight:bold;">${fmt(ytdTotal)}</td></tr>
</tbody>
</table>`
  : `<p style="margin:0 0 12px;color:#666;font-family:Helvetica,Arial,sans-serif;font-size:13px;">No payments received yet this year.</p>`}

<div style="color:#666;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;font-family:Helvetica,Arial,sans-serif;margin:16px 0 8px;">Project balances</div>
<table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:13px;">
<thead>
<tr style="border-bottom:1px solid #ede4cc;color:#666;">
<th style="text-align:left;padding:6px 8px;font-weight:normal;">Project</th>
<th style="text-align:right;padding:6px 8px;font-weight:normal;">Year 1 agreed</th>
<th style="text-align:right;padding:6px 8px;font-weight:normal;">Received</th>
<th style="text-align:right;padding:6px 8px;font-weight:normal;">Balance</th>
</tr>
</thead>
<tbody>
${projectBalances.map((b) => `<tr style="border-bottom:1px solid #f5eed8;"><td style="padding:6px 8px;">${b.name}</td><td style="padding:6px 8px;text-align:right;color:#666;">${fmt(b.agreed)}</td><td style="padding:6px 8px;text-align:right;color:#666;">${fmt(b.received)}</td><td style="padding:6px 8px;text-align:right;font-weight:bold;color:${b.balance > 0 ? '#c5611f' : '#888'};">${fmt(b.balance)}</td></tr>`).join('\n')}
</tbody>
</table>
</div>

<p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:14px;">
Thanks,<br>
Jason
</p>

</td></tr>
</table>
</body></html>`;

	const ytdTextRows = ytdRows
		.map(
			(r) =>
				`  ${r.date.slice(0, 10)}  ${r.project.padEnd(36).slice(0, 36)}  ${r.method.padEnd(8).slice(0, 8)}  ${fmt(r.amount)}`
		)
		.join('\n');
	const balancesText = projectBalances
		.map(
			(b) =>
				`  ${b.name.padEnd(36).slice(0, 36)}  agreed ${fmt(b.agreed)}  paid ${fmt(b.received)}  balance ${fmt(b.balance)}`
		)
		.join('\n');

	const text = `Dittmer Internet Pro — Invoice
${invoiceNumber}
Issued ${today}
Due ${dueDateLabel}

Bill to: ${billingName || '—'}${clientEmail ? '\n         ' + clientEmail : ''}

${greetingFirstName ? 'Hi ' + greetingFirstName + ',' : 'Hi,'}

Here's an invoice toward ${businessName}${
		project.getString('domain') ? ' (' + project.getString('domain') + ')' : ''
	}.
${note ? '\n' + note + '\n' : ''}
Description:                  ${lineDescription}
Amount due ${dueDateLabel}:   ${fmt(requestedAmount)}

--- Project terms · ${businessName} ---
Setup fee:                    ${fmt(setupFee)}
Monthly (first 12 months):    ${fmt(monthly)} / mo
After year 1:                 ${fmt(monthlyAfter)} / mo
Year 1 total:                 ${fmt(agreedY1)}
Received toward Year 1:       ${fmt(received)}
After this payment:           ${fmt(received + requestedAmount)}

Pay by check (made out to Dittmer Internet Pro). Online card and bank payments via Square are coming soon.${remitText}

--- Account statement · ${_d.getFullYear()} year-to-date ---
${ytdRows.length > 0 ? ytdTextRows + '\n  YTD paid:                                                      ' + fmt(ytdTotal) : '  No payments received yet this year.'}

Project balances:
${balancesText}

Thanks,
Jason Dittmer
417-312-1469
dittmer@hey.com`;

	const settings = $app.settings();
	const message = new MailerMessage({
		from: {
			address: settings.meta.senderAddress,
			name: settings.meta.senderName
		},
		to: [{ address: body.to }],
		replyTo: [{ address: REPLY_TO }],
		subject: `Invoice ${invoiceNumber} — ${businessName} — ${fmt(requestedAmount)}`,
		html: html,
		text: text
	});

	try {
		$app.newMailClient().send(message);
	} catch (err) {
		return e.json(500, { message: 'send failed: ' + err });
	}

	return e.json(200, {
		sent: true,
		to: body.to,
		amount: requestedAmount,
		project: businessName,
		invoice_number: invoiceNumber,
		due_date: dueDateLabel
	});

	} catch (err) {
		return e.json(500, { message: 'handler error: ' + String(err), stack: String(err.stack || '') });
	}
});

// ──────────────────────────────────────────────────────────────────────
// Social: comments + reactions on stops and posts
// ──────────────────────────────────────────────────────────────────────

// Helpers (makeToken, targetLabel, sendVerifyEmail) live in
// pb_hooks/_social_helpers.js and are require()'d inside each handler —
// goja doesn't share module-top symbols with route closures.

// POST /api/social/comment
// Body: { target_collection, target_id, email, name?, body, honeypot? }
routerAdd('POST', '/api/social/comment', (e) => {
	const SITE_BASE = 'https://www.dittmer.pro';
	try {
		const helpers = require(`${__hooks}/_social_helpers.js`);
		const body = new DynamicModel({
			target_collection: '',
			target_id: '',
			email: '',
			name: '',
			body: '',
			honeypot: ''
		});
		e.bindBody(body);

		// Honeypot: bots fill anything in this field; humans don't see it.
		if (body.honeypot) {
			return e.json(200, { ok: true });
		}

		if (!body.target_collection || !body.target_id || !body.email || !body.body) {
			return e.json(400, { message: 'target_collection, target_id, email and body are required' });
		}
		if (body.target_collection !== 'stops' && body.target_collection !== 'posts') {
			return e.json(400, { message: 'target_collection must be "stops" or "posts"' });
		}

		// If the request comes from an authenticated, already-verified user
		// whose email matches, publish immediately. Otherwise create unverified
		// and email a verification link.
		const auth = e.auth;
		const authedEmail =
			auth && auth.collection().name === 'users' && auth.getBool('verified')
				? auth.getString('email')
				: '';
		const willPublish = authedEmail && authedEmail.toLowerCase() === body.email.toLowerCase();

		const coll = $app.findCollectionByNameOrId('comments');
		const record = new Record(coll);
		record.set('target_collection', body.target_collection);
		record.set('target_id', body.target_id);
		record.set('email', body.email.toLowerCase());
		record.set('name', body.name || '');
		record.set('body', body.body);
		record.set('verified', willPublish);
		const token = willPublish ? '' : helpers.makeToken();
		record.set('verify_token', token);
		$app.save(record);

		if (!willPublish) {
			const label = helpers.targetLabel(body.target_collection, body.target_id);
			const verifyUrl = SITE_BASE + '/v/' + token;
			try {
				helpers.sendVerifyEmail(body.email, body.name, 'comment', body.body, label, verifyUrl);
			} catch (err) {
				// Don't expose the record if we couldn't email — roll back.
				try { $app.delete(record); } catch (_) {}
				return e.json(500, { message: 'could not send verification email: ' + err });
			}
		}

		return e.json(200, {
			id: record.id,
			verified: willPublish,
			needs_verification: !willPublish
		});
	} catch (err) {
		return e.json(500, { message: 'handler error: ' + String(err) });
	}
});

// POST /api/social/react
// Body: { target_collection, target_id, type, email, name?, honeypot? }
// Idempotent on (target_collection, target_id, email, type).
routerAdd('POST', '/api/social/react', (e) => {
	const SITE_BASE = 'https://www.dittmer.pro';
	try {
		const helpers = require(`${__hooks}/_social_helpers.js`);
		const body = new DynamicModel({
			target_collection: '',
			target_id: '',
			type: '',
			email: '',
			name: '',
			honeypot: ''
		});
		e.bindBody(body);

		if (body.honeypot) return e.json(200, { ok: true });

		if (!body.target_collection || !body.target_id || !body.email || !body.type) {
			return e.json(400, { message: 'target_collection, target_id, type and email are required' });
		}
		if (body.target_collection !== 'stops' && body.target_collection !== 'posts') {
			return e.json(400, { message: 'target_collection must be "stops" or "posts"' });
		}

		const auth = e.auth;
		const authedEmail =
			auth && auth.collection().name === 'users' && auth.getBool('verified')
				? auth.getString('email')
				: '';
		const willPublish = authedEmail && authedEmail.toLowerCase() === body.email.toLowerCase();

		const coll = $app.findCollectionByNameOrId('reactions');
		let record;
		let isNew = false;
		try {
			record = $app.findFirstRecordByFilter(
				'reactions',
				'target_collection = {:tc} && target_id = {:tid} && email = {:em} && type = {:tp}',
				{ tc: body.target_collection, tid: body.target_id, em: body.email.toLowerCase(), tp: body.type }
			);
		} catch (_) {
			record = new Record(coll);
			isNew = true;
		}

		record.set('target_collection', body.target_collection);
		record.set('target_id', body.target_id);
		record.set('email', body.email.toLowerCase());
		record.set('name', body.name || record.getString('name') || '');
		record.set('type', body.type);
		// Only upgrade verified status, never downgrade
		const alreadyVerified = record.getBool('verified');
		const verifiedNow = alreadyVerified || willPublish;
		record.set('verified', verifiedNow);
		const token = verifiedNow ? '' : record.getString('verify_token') || helpers.makeToken();
		record.set('verify_token', token);
		$app.save(record);

		if (!verifiedNow) {
			const label = helpers.targetLabel(body.target_collection, body.target_id);
			const verifyUrl = SITE_BASE + '/v/' + token;
			try {
				helpers.sendVerifyEmail(body.email, body.name, 'reaction', body.type, label, verifyUrl);
			} catch (err) {
				if (isNew) {
					try { $app.delete(record); } catch (_) {}
				}
				return e.json(500, { message: 'could not send verification email: ' + err });
			}
		}

		return e.json(200, {
			id: record.id,
			verified: verifiedNow,
			needs_verification: !verifiedNow
		});
	} catch (err) {
		return e.json(500, { message: 'handler error: ' + String(err) });
	}
});

// GET /api/social/verify/{token}
// Public. Flips verified=true on whatever record carries the token.
// Auto-creates a users record if no account exists for that email.
routerAdd('GET', '/api/social/verify/{token}', (e) => {
	try {
		const helpers = require(`${__hooks}/_social_helpers.js`);
		const token = e.request.pathValue('token');
		if (!token || token.length < 10) {
			return e.json(400, { message: 'bad token' });
		}

		// Find which collection holds it
		let record = null;
		let kind = '';
		try {
			record = $app.findFirstRecordByFilter('comments', 'verify_token = {:t}', { t: token });
			kind = 'comment';
		} catch (_) {}
		if (!record) {
			try {
				record = $app.findFirstRecordByFilter('reactions', 'verify_token = {:t}', { t: token });
				kind = 'reaction';
			} catch (_) {}
		}
		if (!record) {
			return e.json(404, { message: 'token not found or already used' });
		}

		const email = record.getString('email').toLowerCase();
		const name = record.getString('name');

		record.set('verified', true);
		record.set('verify_token', '');
		$app.save(record);

		// Auto-create a users record if none exists yet
		let userCreated = false;
		try {
			$app.findFirstRecordByFilter('users', 'email = {:e}', { e: email });
		} catch (_) {
			try {
				const users = $app.findCollectionByNameOrId('users');
				const u = new Record(users);
				u.setEmail(email);
				u.set('name', name || '');
				// Build a unique-ish username from the email local-part
				const local = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
				let username = local.slice(0, 14);
				let suffix = 0;
				while (true) {
					const tryName = suffix ? username + suffix : username;
					try {
						$app.findFirstRecordByFilter('users', 'username = {:u}', { u: tryName });
						suffix = suffix ? suffix + 1 : 2;
					} catch (_) {
						username = tryName;
						break;
					}
					if (suffix > 9999) break;
				}
				u.set('username', username);
				u.set('verified', true);
				u.set('emailVisibility', false);
				// random password — they'll use OTP anyway
				u.setPassword(helpers.makeToken() + 'A!1');
				$app.save(u);
				userCreated = true;
			} catch (err) {
				// non-fatal — verification still succeeds
			}
		}

		return e.json(200, {
			kind: kind,
			target_collection: record.getString('target_collection'),
			target_id: record.getString('target_id'),
			email: email,
			account_created: userCreated
		});
	} catch (err) {
		return e.json(500, { message: 'handler error: ' + String(err) });
	}
});
