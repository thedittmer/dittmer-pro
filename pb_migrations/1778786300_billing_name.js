/// <reference path="../pb_data/types.d.ts" />
// Add billing_name to clients so invoices can address the spouse/co-owner.
// Falls back to `name` when empty.
migrate(
	(app) => {
		const clients = app.findCollectionByNameOrId('clients');
		if (!clients.fields.find((f) => f.name === 'billing_name')) {
			clients.fields.add(
				new Field({
					name: 'billing_name',
					type: 'text',
					required: false,
					max: 200,
					help: 'How to address the client in invoices (e.g. "John & Leah Lindsay"). Falls back to name when empty.'
				})
			);
			app.save(clients);
		}

		// Set John's billing addressing
		try {
			const john = app.findFirstRecordByFilter('clients', 'name = "John Lindsay"');
			john.set('billing_name', 'John & Leah Lindsay');
			app.save(john);
		} catch (_) {}
	},
	(app) => {
		const clients = app.findCollectionByNameOrId('clients');
		const f = clients.fields.find((x) => x.name === 'billing_name');
		if (f) clients.fields.removeById(f.id);
		app.save(clients);
	}
);
