/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		try {
			const john = app.findFirstRecordByFilter('clients', 'name = "John Lindsay"');
			john.set('email', 'jandlundergroundconstruction@gmail.com');
			app.save(john);
		} catch (_) {}
	},
	(_app) => {}
);
