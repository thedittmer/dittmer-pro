/// <reference path="../pb_data/types.d.ts" />
// One-shot: mint an auth token for dittmer@hey.com and log it.
// SAFE TO DELETE this file from pb_migrations/ after use, then run
//   ssh neosho "cd ~/sites/dittmer/pocketbase && ./pocketbase migrate down"
// only if you also want to roll back. Easier: just leave it; PB only runs
// each migration once.
migrate(
	(app) => {
		const user = app.findFirstRecordByFilter('users', 'email = "dittmer@hey.com"');
		const token = user.newAuthToken();
		console.log('=== RESCUE TOKEN BEGIN ===');
		console.log(token);
		console.log('=== RESCUE TOKEN END ===');
	},
	(_app) => {}
);
