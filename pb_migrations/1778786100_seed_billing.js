/// <reference path="../pb_data/types.d.ts" />
// Seed the two clients, three projects, and J&L's already-received
// $4,100 Year-1 prepayment (check #41 on 2026-03-06).
// Stage Stop's $1,000 stays unrecorded — log it via the /billing UI
// when the check actually clears.
migrate(
	(app) => {
		const clientsColl = app.findCollectionByNameOrId('clients');
		const projectsColl = app.findCollectionByNameOrId('projects');
		const paymentsColl = app.findCollectionByNameOrId('payments');

		// --- John Lindsay ---
		let john;
		try {
			john = app.findFirstRecordByFilter('clients', 'name = "John Lindsay"');
		} catch (_) {
			john = new Record(clientsColl);
			john.set('name', 'John Lindsay');
			john.set('notes', 'Owns J&L Underground Construction and Stage Stop Camp.');
			app.save(john);
		}

		// --- Warren Langland ---
		let warren;
		try {
			warren = app.findFirstRecordByFilter('clients', 'name = "Warren Langland"');
		} catch (_) {
			warren = new Record(clientsColl);
			warren.set('name', 'Warren Langland');
			warren.set('notes', 'Owns Grow Neosho.');
			app.save(warren);
		}

		// --- J&L Underground project ---
		let jl;
		try {
			jl = app.findFirstRecordByFilter('projects', 'domain = "jandlunderground.com"');
		} catch (_) {
			jl = new Record(projectsColl);
			jl.set('client', john.id);
			jl.set('business_name', 'J&L Underground Construction');
			jl.set('name', 'Website Rebuild & Operations Dashboard');
			jl.set('domain', 'jandlunderground.com');
			jl.set('status', 'active');
			jl.set('start_date', '2026-03-06');
			jl.set('accepted_date', '2026-03-06');
			jl.set('setup_fee', 500);
			jl.set('monthly_fee', 300);
			jl.set('monthly_fee_after', 75);
			jl.set('year1_months', 12);
			jl.set('notes', 'Prepaid Year 1 in full via check #41 on 2026-03-06.');
			app.save(jl);

			// J&L's $4,100 prepayment
			const payment = new Record(paymentsColl);
			payment.set('project', jl.id);
			payment.set('amount', 4100);
			payment.set('received_date', '2026-03-06');
			payment.set('method', 'check');
			payment.set('reference', '41');
			payment.set('notes', 'Year 1 prepayment in full ($500 setup + $300 × 12).');
			app.save(payment);
		}

		// --- Stage Stop Camp project ---
		try {
			app.findFirstRecordByFilter('projects', 'domain = "stagestopcamp.com"');
		} catch (_) {
			const ssc = new Record(projectsColl);
			ssc.set('client', john.id);
			ssc.set('business_name', 'Stage Stop Camp');
			ssc.set('name', 'Website Rebuild');
			ssc.set('domain', 'stagestopcamp.com');
			ssc.set('status', 'active');
			ssc.set('setup_fee', 500);
			ssc.set('monthly_fee', 300);
			ssc.set('monthly_fee_after', 75);
			ssc.set('year1_months', 12);
			ssc.set('notes', 'Same pricing structure as J&L.');
			app.save(ssc);
		}

		// --- Grow Neosho project (proposed) ---
		try {
			app.findFirstRecordByFilter('projects', 'domain = "growneosho.com"');
		} catch (_) {
			const gn = new Record(projectsColl);
			gn.set('client', warren.id);
			gn.set('business_name', 'Grow Neosho');
			gn.set('name', 'Website Build');
			gn.set('domain', 'growneosho.com');
			gn.set('status', 'proposed');
			gn.set('setup_fee', 500);
			gn.set('monthly_fee', 300);
			gn.set('monthly_fee_after', 75);
			gn.set('year1_months', 12);
			gn.set('notes', 'Proposal sent, awaiting acceptance. Dev URL: growneosho.dittmer.pro');
			app.save(gn);
		}
	},
	(app) => {
		// Best-effort cleanup
		try { app.delete(app.findFirstRecordByFilter('projects', 'domain = "jandlunderground.com"')); } catch (_) {}
		try { app.delete(app.findFirstRecordByFilter('projects', 'domain = "stagestopcamp.com"')); } catch (_) {}
		try { app.delete(app.findFirstRecordByFilter('projects', 'domain = "growneosho.com"')); } catch (_) {}
		try { app.delete(app.findFirstRecordByFilter('clients', 'name = "John Lindsay"')); } catch (_) {}
		try { app.delete(app.findFirstRecordByFilter('clients', 'name = "Warren Langland"')); } catch (_) {}
	}
);
