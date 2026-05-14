/// <reference path="../pb_data/types.d.ts" />
const SITE_ID = 'sitesettings001';
const DEFAULT_TAGLINE = 'I build for the web and take pictures. Neosho, Missouri.';

migrate(
	(app) => {
		// Open meta collection: public read, admin-only write
		const meta = app.findCollectionByNameOrId('meta');
		meta.listRule = '';
		meta.viewRule = '';
		meta.createRule = '@request.auth.admin = true';
		meta.updateRule = '@request.auth.admin = true';
		meta.deleteRule = '@request.auth.admin = true';
		app.save(meta);

		// Seed the singleton site settings record (idempotent)
		try {
			app.findRecordById('meta', SITE_ID);
			return;
		} catch (_) {
			// not found — create it
		}

		const r = new Record(meta);
		r.id = SITE_ID;
		r.set('json', { tagline: DEFAULT_TAGLINE });
		app.save(r);
	},
	(app) => {
		const meta = app.findCollectionByNameOrId('meta');
		meta.listRule = null;
		meta.viewRule = null;
		meta.createRule = null;
		meta.updateRule = null;
		meta.deleteRule = null;
		app.save(meta);

		try {
			const r = app.findRecordById('meta', SITE_ID);
			app.delete(r);
		} catch (_) {}
	}
);
