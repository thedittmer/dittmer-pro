/// <reference path="../pb_data/types.d.ts" />
// Billing schema. All three collections are admin-only — none of this is
// public. The pricing template is stored inline on the project so each
// project's contract is self-contained (rates can vary later).
migrate(
	(app) => {
		// clients --------------------------------------------------------
		const clients = new Collection({
			type: 'base',
			name: 'clients',
			listRule: '@request.auth.admin = true',
			viewRule: '@request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{ name: 'name', type: 'text', required: true, min: 1, max: 120 },
				{ name: 'email', type: 'email' },
				{ name: 'phone', type: 'text', max: 40 },
				{ name: 'notes', type: 'text' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			]
		});
		app.save(clients);

		// projects -------------------------------------------------------
		const projects = new Collection({
			type: 'base',
			name: 'projects',
			listRule: '@request.auth.admin = true',
			viewRule: '@request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{ name: 'client', type: 'relation', collectionId: clients.id, maxSelect: 1, required: true, cascadeDelete: false },
				{ name: 'business_name', type: 'text', max: 200 },
				{ name: 'name', type: 'text', required: true, min: 1, max: 200 },
				{ name: 'domain', type: 'text', max: 120 },
				{
					name: 'status',
					type: 'select',
					maxSelect: 1,
					required: true,
					values: ['proposed', 'active', 'paused', 'completed', 'cancelled']
				},
				{ name: 'start_date', type: 'date' },
				{ name: 'setup_fee', type: 'number' },
				{ name: 'monthly_fee', type: 'number' },
				{ name: 'monthly_fee_after', type: 'number' },
				{ name: 'year1_months', type: 'number' },
				{
					name: 'signed_proposal',
					type: 'file',
					maxSelect: 1,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
					protected: true
				},
				{ name: 'accepted_date', type: 'date' },
				{ name: 'notes', type: 'text' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			]
		});
		app.save(projects);

		// payments -------------------------------------------------------
		const payments = new Collection({
			type: 'base',
			name: 'payments',
			listRule: '@request.auth.admin = true',
			viewRule: '@request.auth.admin = true',
			createRule: '@request.auth.admin = true',
			updateRule: '@request.auth.admin = true',
			deleteRule: '@request.auth.admin = true',
			fields: [
				{ name: 'project', type: 'relation', collectionId: projects.id, maxSelect: 1, required: true, cascadeDelete: true },
				{ name: 'amount', type: 'number', required: true },
				{ name: 'received_date', type: 'date', required: true },
				{
					name: 'method',
					type: 'select',
					maxSelect: 1,
					values: ['cash', 'check', 'ach', 'card', 'stripe', 'venmo', 'zelle', 'other']
				},
				{ name: 'reference', type: 'text', max: 120, help: 'Check number, transaction ID, etc.' },
				{
					name: 'photo',
					type: 'file',
					maxSelect: 1,
					maxSize: 10 * 1024 * 1024,
					mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'],
					thumbs: ['400x300', '1200x900'],
					protected: true
				},
				{ name: 'notes', type: 'text' },
				{ name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
				{ name: 'updated', type: 'autodate', onCreate: true, onUpdate: true }
			],
			indexes: [
				'CREATE INDEX `idx_payments_project_date` ON `payments` (`project`, `received_date`)'
			]
		});
		app.save(payments);
	},
	(app) => {
		for (const name of ['payments', 'projects', 'clients']) {
			try {
				app.delete(app.findCollectionByNameOrId(name));
			} catch (_) {}
		}
	}
);
