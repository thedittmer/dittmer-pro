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
	}
];
