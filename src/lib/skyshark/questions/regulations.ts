import type { Question } from '../types';

/** Level 3 — Regulations (14 CFR Part 107). */
export const regulationsQuestions: Question[] = [
	{
		id: 'reg-001',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'What is the maximum altitude a small UAS may be flown under Part 107?'
		},
		choices: [
			{ id: 'a', text: '400 feet AGL (or within 400 ft of a structure)' },
			{ id: 'b', text: '500 feet MSL' },
			{ id: 'c', text: '1,200 feet AGL' },
			{ id: 'd', text: 'There is no altitude limit' }
		],
		correctAnswer: 'a',
		explanation:
			'Part 107 limits flight to 400 ft AGL, unless within a 400-ft radius of a structure (then up to 400 ft above the structure’s top).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 1
	},
	{
		id: 'reg-002',
		domain: 'regulations',
		prompt: { kind: 'text', text: 'What is the maximum groundspeed allowed for a small UAS under Part 107?' },
		choices: [
			{ id: 'a', text: '100 mph (87 knots)' },
			{ id: 'b', text: '55 mph' },
			{ id: 'c', text: '160 mph' },
			{ id: 'd', text: '200 knots' }
		],
		correctAnswer: 'a',
		explanation: 'Part 107 caps groundspeed at 100 mph (87 knots).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 1
	},
	{
		id: 'reg-003',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'What is the minimum flight visibility required from the control station under Part 107?'
		},
		choices: [
			{ id: 'a', text: '1 statute mile' },
			{ id: 'b', text: '3 statute miles' },
			{ id: 'c', text: '5 statute miles' },
			{ id: 'd', text: 'No minimum applies' }
		],
		correctAnswer: 'b',
		explanation: 'Minimum flight visibility is 3 statute miles from the control station.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 2
	},
	{
		id: 'reg-004',
		domain: 'regulations',
		prompt: { kind: 'text', text: 'What are the minimum cloud clearance requirements under Part 107?' },
		choices: [
			{ id: 'a', text: '500 ft below and 2,000 ft horizontally from clouds' },
			{ id: 'b', text: '1,000 ft below and 1 mile horizontally' },
			{ id: 'c', text: 'Clear of clouds at all times only' },
			{ id: 'd', text: 'No cloud clearance is required' }
		],
		correctAnswer: 'a',
		explanation: 'Remain 500 ft below and 2,000 ft horizontally from clouds.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 2
	},
	{
		id: 'reg-005',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'Who is directly responsible for determining whether a small UAS is safe for flight?'
		},
		choices: [
			{ id: 'a', text: 'The FAA' },
			{ id: 'b', text: 'The aircraft manufacturer' },
			{ id: 'c', text: 'The remote pilot in command (PIC)' },
			{ id: 'd', text: 'The visual observer' }
		],
		correctAnswer: 'c',
		explanation:
			'The remote PIC is directly responsible for, and the final authority on, the operation — including determining the aircraft is safe for flight.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 1
	},
	{
		id: 'reg-006',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'What is the minimum age to be a remote pilot in command under Part 107?'
		},
		choices: [
			{ id: 'a', text: '14 years old' },
			{ id: 'b', text: '16 years old' },
			{ id: 'c', text: '18 years old' },
			{ id: 'd', text: '21 years old' }
		],
		correctAnswer: 'b',
		explanation: 'You must be at least 16 years old to hold a remote pilot certificate with an sUAS rating.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 1 (Regulations / 14 CFR 107)' },
		difficulty: 1
	},
	{
		id: 'reg-007',
		domain: 'regulations',
		prompt: { kind: 'text', text: 'A small UAS must be registered with the FAA when it weighs:' },
		choices: [
			{ id: 'a', text: 'More than 0.55 pounds' },
			{ id: 'b', text: 'More than 5 pounds' },
			{ id: 'c', text: 'More than 25 pounds' },
			{ id: 'd', text: 'Registration is never required' }
		],
		correctAnswer: 'a',
		explanation:
			'Under 14 CFR Part 48, any sUAS over 0.55 lb (up to 55 lb) must be registered, and the registration number marked on the exterior.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR Part 48 (Registration)' },
		difficulty: 1
	},
	{
		id: 'reg-008',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'If your aircraft’s standard remote identification fails during a flight, you must:'
		},
		choices: [
			{ id: 'a', text: 'Continue the flight as planned' },
			{ id: 'b', text: 'Land as soon as practicable' },
			{ id: 'c', text: 'Notify the nearest ATC tower' },
			{ id: 'd', text: 'Switch to a broadcast module mid-flight' }
		],
		correctAnswer: 'b',
		explanation:
			'If Remote ID fails in flight, the remote PIC must land as soon as practicable.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR Part 89 (Remote ID)' },
		difficulty: 2
	},
	{
		id: 'reg-009',
		domain: 'regulations',
		prompt: { kind: 'text', text: 'How does a remote pilot keep their certificate current?' },
		choices: [
			{ id: 'a', text: 'Complete free online recurrent training every 24 calendar months' },
			{ id: 'b', text: 'Retake the in-person exam every year' },
			{ id: 'c', text: 'Nothing — the certificate never expires or lapses' },
			{ id: 'd', text: 'Log 100 flight hours per year' }
		],
		correctAnswer: 'a',
		explanation:
			'Currency is maintained by completing the free online recurrent training every 24 calendar months.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR 107 subpart C' },
		difficulty: 2
	},
	{
		id: 'reg-010',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'To operate at night or in civil twilight under Part 107, the aircraft must have:'
		},
		choices: [
			{ id: 'a', text: 'Anti-collision lighting visible for at least 3 statute miles' },
			{ id: 'b', text: 'A transponder' },
			{ id: 'c', text: 'Landing lights only' },
			{ id: 'd', text: 'No special equipment' }
		],
		correctAnswer: 'a',
		explanation:
			'Night and civil-twilight operations require anti-collision lighting visible for at least 3 statute miles (plus completion of the updated training).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR 107.29' },
		difficulty: 2
	},
	{
		id: 'reg-011',
		domain: 'regulations',
		prompt: { kind: 'text', text: 'Under Part 107, a remote pilot may not operate within how many hours of consuming alcohol?' },
		choices: [
			{ id: 'a', text: '4 hours' },
			{ id: 'b', text: '8 hours' },
			{ id: 'c', text: '12 hours' },
			{ id: 'd', text: '24 hours' }
		],
		correctAnswer: 'b',
		explanation:
			'No operating within 8 hours of consuming alcohol, while impaired, or with a blood alcohol concentration of 0.04% or greater.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR 107.27 / 91.17' },
		difficulty: 2
	},
	{
		id: 'reg-012',
		domain: 'regulations',
		prompt: {
			kind: 'text',
			text: 'A small UAS accident must be reported to the FAA within 10 days if it results in:'
		},
		choices: [
			{ id: 'a', text: 'Any landing away from the launch point' },
			{ id: 'b', text: 'Serious injury, loss of consciousness, or property damage over $500' },
			{ id: 'c', text: 'Any battery that gets warm' },
			{ id: 'd', text: 'Only if the FAA requests a report' }
		],
		correctAnswer: 'b',
		explanation:
			'Report within 10 days if the operation causes serious injury, loss of consciousness, or property damage of at least $500 (to other than the sUAS).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: '14 CFR 107.9' },
		difficulty: 2
	}
];
