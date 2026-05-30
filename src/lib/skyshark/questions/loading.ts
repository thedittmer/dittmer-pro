import type { Question } from '../types';

/** Level 5 — Loading & Performance. */
export const loadingQuestions: Question[] = [
	{
		id: 'lp-001',
		domain: 'loading-performance',
		prompt: { kind: 'text', text: 'How does the location of the center of gravity (CG) affect a small UAS?' },
		choices: [
			{ id: 'a', text: 'It affects stability and controllability' },
			{ id: 'b', text: 'It has no effect on flight' },
			{ id: 'c', text: 'It only affects battery life' },
			{ id: 'd', text: 'It changes the legal altitude limit' }
		],
		correctAnswer: 'a',
		explanation:
			'CG location directly affects how stable and controllable the aircraft is. Loading outside CG limits degrades handling.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 1
	},
	{
		id: 'lp-002',
		domain: 'loading-performance',
		prompt: {
			kind: 'text',
			text: 'Operating a small UAS above its maximum gross takeoff weight will most likely:'
		},
		choices: [
			{ id: 'a', text: 'Improve stability' },
			{ id: 'b', text: 'Degrade performance and is unsafe' },
			{ id: 'c', text: 'Have no measurable effect' },
			{ id: 'd', text: 'Increase maximum altitude' }
		],
		correctAnswer: 'b',
		explanation:
			'Exceeding max gross weight reduces climb performance and endurance, increases stall/maneuver risk, and is unsafe.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 1
	},
	{
		id: 'lp-003',
		domain: 'loading-performance',
		prompt: { kind: 'text', text: 'Adding a heavier payload to a small UAS will most likely:' },
		choices: [
			{ id: 'a', text: 'Increase flight time (endurance)' },
			{ id: 'b', text: 'Reduce flight time (endurance)' },
			{ id: 'c', text: 'Have no effect on endurance' },
			{ id: 'd', text: 'Raise the legal speed limit' }
		],
		correctAnswer: 'b',
		explanation: 'More weight requires more power to stay aloft, which drains the battery faster and reduces endurance.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 2
	},
	{
		id: 'lp-004',
		domain: 'loading-performance',
		prompt: { kind: 'text', text: 'A higher density altitude affects small UAS performance by:' },
		choices: [
			{ id: 'a', text: 'Increasing available thrust' },
			{ id: 'b', text: 'Decreasing performance (less lift/thrust)' },
			{ id: 'c', text: 'Only affecting gas-powered aircraft' },
			{ id: 'd', text: 'Improving battery efficiency' }
		],
		correctAnswer: 'b',
		explanation:
			'Higher density altitude = thinner air, so propellers generate less thrust and the aircraft climbs and carries less.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 2
	},
	{
		id: 'lp-005',
		domain: 'loading-performance',
		prompt: {
			kind: 'text',
			text: 'Who is responsible for ensuring a small UAS is loaded within its weight and balance limits?'
		},
		choices: [
			{ id: 'a', text: 'The FAA' },
			{ id: 'b', text: 'The remote pilot in command' },
			{ id: 'c', text: 'The manufacturer' },
			{ id: 'd', text: 'No one — sUAS have no limits' }
		],
		correctAnswer: 'b',
		explanation: 'The remote PIC is responsible for ensuring the aircraft is within weight-and-balance limits before flight.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 1
	},
	{
		id: 'lp-006',
		domain: 'loading-performance',
		prompt: {
			kind: 'text',
			text: 'Loading the aircraft so the CG is too far aft (toward the rear) will most likely make it:'
		},
		choices: [
			{ id: 'a', text: 'More stable and easier to control' },
			{ id: 'b', text: 'Less stable and harder to control' },
			{ id: 'c', text: 'Faster but unaffected in handling' },
			{ id: 'd', text: 'Unable to power on' }
		],
		correctAnswer: 'b',
		explanation:
			'An aft CG reduces stability and makes the aircraft harder to control; keep the CG within the manufacturer’s limits.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 3
	},
	{
		id: 'lp-007',
		domain: 'loading-performance',
		prompt: { kind: 'text', text: 'The load factor on an aircraft’s structure increases any time it:' },
		choices: [
			{ id: 'a', text: 'Flies straight and level' },
			{ id: 'b', text: 'Performs a maneuver other than straight-and-level flight, such as a banked turn' },
			{ id: 'c', text: 'Reduces its gross weight' },
			{ id: 'd', text: 'Descends in a straight line' }
		],
		correctAnswer: 'b',
		explanation:
			'Maneuvers — especially banked turns — increase load factor, so the structure must support more than the aircraft’s weight.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 2
	},
	{
		id: 'lp-008',
		domain: 'loading-performance',
		prompt: { kind: 'text', text: 'A fixed-wing aircraft stalls when the wing:' },
		choices: [
			{ id: 'a', text: 'Exceeds its critical angle of attack' },
			{ id: 'b', text: 'Exceeds the maximum groundspeed' },
			{ id: 'c', text: 'Exceeds the maximum gross weight' },
			{ id: 'd', text: 'Runs low on battery' }
		],
		correctAnswer: 'a',
		explanation:
			'A stall happens when the wing exceeds its critical angle of attack and smooth airflow over it breaks down — regardless of airspeed.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 3
	},
	{
		id: 'lp-009',
		domain: 'loading-performance',
		prompt: {
			kind: 'text',
			text: 'To ensure the aircraft’s CG limits are not exceeded, follow the loading instructions in:'
		},
		choices: [
			{ id: 'a', text: 'The Pilot’s Operating Handbook or UAS Flight Manual' },
			{ id: 'b', text: 'The Aeronautical Information Manual (AIM)' },
			{ id: 'c', text: 'The sectional chart' },
			{ id: 'd', text: 'A NOTAM' }
		],
		correctAnswer: 'a',
		explanation:
			'Weight-and-balance and loading limits are in the manufacturer’s Pilot’s Operating Handbook / UAS Flight Manual.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 7 (Loading & Performance)' },
		difficulty: 1
	}
];
