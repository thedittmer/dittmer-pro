/// <reference path="../pb_data/types.d.ts" />
// One-shot rescue: mint a fresh user auth token and log it to journalctl.
// Same pattern as 1777290000_rescue_token.js — needed again because the
// previous one expired (default user auth duration is 14 days).
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
