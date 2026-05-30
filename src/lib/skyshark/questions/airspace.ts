import type { Question } from '../types';

/**
 * Level 1 — Airspace.
 *
 * Seed set (10 questions) authored from the official FAA "Remote Pilot – Small
 * Unmanned Aircraft Systems Study Guide", Chapter 2 (Airspace Classification,
 * Operating Requirements, and Flight Restrictions). Page locators use the FAA
 * guide's printed page numbers.
 *
 * These are intentionally hand-checked against the source so distractors are
 * plausible-but-wrong (the kind of thing the real knowledge test uses).
 */
export const airspaceQuestions: Question[] = [
	{
		id: 'as-001',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'A remote pilot must receive ATC authorization before operating in which classes of airspace?'
		},
		choices: [
			{ id: 'a', text: 'Class B, C, D, and surface Class E' },
			{ id: 'b', text: 'Class A and B only' },
			{ id: 'c', text: 'Class G only' },
			{ id: 'd', text: 'All classes, including Class G' }
		],
		correctAnswer: 'a',
		explanation:
			'Authorization is required before operating in Class B, C, D, and within lateral boundaries of surface Class E. No authorization is needed in Class G.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, pp. 5–6' },
		difficulty: 1
	},
	{
		id: 'as-002',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'Class B airspace generally extends from the surface up to what altitude?'
		},
		choices: [
			{ id: 'a', text: '4,000 feet above the airport elevation' },
			{ id: 'b', text: '10,000 feet MSL' },
			{ id: 'c', text: '2,500 feet above the airport elevation' },
			{ id: 'd', text: '18,000 feet MSL' }
		],
		correctAnswer: 'b',
		explanation:
			'Class B is generally from the surface to 10,000 ft MSL surrounding the nation’s busiest airports, shaped like an upside-down wedding cake.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 5' },
		difficulty: 1
	},
	{
		id: 'as-003',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'Class C airspace typically extends from the surface to how high above the airport elevation?'
		},
		choices: [
			{ id: 'a', text: '2,500 feet' },
			{ id: 'b', text: '10,000 feet' },
			{ id: 'c', text: '4,000 feet' },
			{ id: 'd', text: '1,200 feet' }
		],
		correctAnswer: 'c',
		explanation:
			'Class C generally goes from the surface to 4,000 ft above the airport elevation, with a 5 NM inner core and a 10 NM outer shelf.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 6' },
		difficulty: 2
	},
	{
		id: 'as-004',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'Class D airspace generally extends from the surface to how high above the airport elevation?'
		},
		choices: [
			{ id: 'a', text: '4,000 feet' },
			{ id: 'b', text: '2,500 feet' },
			{ id: 'c', text: '1,200 feet' },
			{ id: 'd', text: '700 feet' }
		],
		correctAnswer: 'b',
		explanation:
			'Class D generally goes from the surface to 2,500 ft above the airport elevation, around airports with an operational control tower.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 6' },
		difficulty: 2
	},
	{
		id: 'as-005',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'Which airspace is "uncontrolled," where a remote pilot does NOT need ATC authorization?'
		},
		choices: [
			{ id: 'a', text: 'Class E' },
			{ id: 'b', text: 'Class D' },
			{ id: 'c', text: 'Class G' },
			{ id: 'd', text: 'Class C' }
		],
		correctAnswer: 'c',
		explanation:
			'Class G is uncontrolled airspace — everything not designated A, B, C, D, or E. It runs from the surface to the base of the overlying Class E.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 6' },
		difficulty: 1
	},
	{
		id: 'as-006',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'In most areas where the floor is not otherwise charted, Class E airspace begins at what altitude AGL?'
		},
		choices: [
			{ id: 'a', text: '700 feet AGL' },
			{ id: 'b', text: '1,200 feet AGL' },
			{ id: 'c', text: 'The surface' },
			{ id: 'd', text: '14,500 feet MSL' }
		],
		correctAnswer: 'b',
		explanation:
			'In most areas the Class E base is 1,200 ft AGL. In many other areas it is the surface or 700 ft AGL, and where charts show no base it begins at 14,500 ft MSL.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 6' },
		difficulty: 3
	},
	{
		id: 'as-007',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'A sectional chart shows a "P" followed by a number (e.g., P-40). What type of special use airspace is this?'
		},
		choices: [
			{ id: 'a', text: 'Prohibited area' },
			{ id: 'b', text: 'Restricted area' },
			{ id: 'c', text: 'Warning area' },
			{ id: 'd', text: 'Alert area' }
		],
		correctAnswer: 'a',
		explanation:
			'A "P" prefix denotes a Prohibited Area — flight is prohibited for security/national welfare reasons (e.g., P-40 over Camp David).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 7' },
		difficulty: 2
	},
	{
		id: 'as-008',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'What does a "R" followed by a number (e.g., R-4401) designate on a chart?'
		},
		choices: [
			{ id: 'a', text: 'A published VFR route' },
			{ id: 'b', text: 'A restricted area' },
			{ id: 'c', text: 'A radar service area' },
			{ id: 'd', text: 'A reporting point' }
		],
		correctAnswer: 'b',
		explanation:
			'An "R" prefix marks a Restricted Area — flight is subject to restrictions due to hazards like artillery firing or guided missiles.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, pp. 7–8' },
		difficulty: 2
	},
	{
		id: 'as-009',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'How is a Temporary Flight Restriction (TFR) issued to pilots?'
		},
		choices: [
			{ id: 'a', text: 'Only on the back of the sectional chart' },
			{ id: 'b', text: 'By a controlling agency over the radio only' },
			{ id: 'c', text: 'Via a flight data center (FDC) NOTAM' },
			{ id: 'd', text: 'They are never published in advance' }
		],
		correctAnswer: 'c',
		explanation:
			'A TFR is designated by an FDC NOTAM beginning with "FLIGHT RESTRICTIONS." It is the pilot’s responsibility to check (e.g., tfr.faa.gov) before flight.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, pp. 10–11' },
		difficulty: 2
	},
	{
		id: 'as-010',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'On a sectional chart, federal airways are shown as blue lines and are usually found within which airspace?'
		},
		choices: [
			{ id: 'a', text: 'Class B' },
			{ id: 'b', text: 'Class G' },
			{ id: 'c', text: 'Class E' },
			{ id: 'd', text: 'Class A' }
		],
		correctAnswer: 'c',
		explanation:
			'Federal airways (blue lines on sectionals) are usually within Class E airspace, starting at 1,200 ft AGL up to but not including 18,000 ft MSL.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2, p. 6' },
		difficulty: 3
	},
	{
		id: 'as-011',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'How would you find out whether a Military Operations Area (MOA) is active?'
		},
		choices: [
			{ id: 'a', text: 'Refer to the chart legend / special-use airspace panel' },
			{ id: 'b', text: 'Check the small UAS database' },
			{ id: 'c', text: 'It is always active' },
			{ id: 'd', text: 'MOAs are never charted' }
		],
		correctAnswer: 'a',
		explanation:
			'A MOA’s times of use, altitudes, and controlling agency are listed in the sectional chart’s special-use airspace panel (the legend).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Special use airspace)' },
		difficulty: 2
	},
	{
		id: 'as-012',
		domain: 'airspace',
		prompt: {
			kind: 'text',
			text: 'A Military Training Route shown with a 4-digit number (e.g., VR1667) operates at:'
		},
		choices: [
			{ id: 'a', text: 'At or below 1,500 feet AGL' },
			{ id: 'b', text: 'Above 18,000 feet MSL' },
			{ id: 'c', text: 'Exactly 10,000 feet MSL' },
			{ id: 'd', text: 'Only above 1,500 feet AGL' }
		],
		correctAnswer: 'a',
		explanation:
			'MTRs with no segment above 1,500 ft AGL use 4-digit numbers (e.g., VR1667). Routes with segments above 1,500 ft AGL use 3 digits.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Other airspace)' },
		difficulty: 3
	},
	{
		id: 'as-013',
		domain: 'airspace',
		prompt: { kind: 'text', text: 'A Warning area (e.g., W-237) is located where, and contains what?' },
		choices: [
			{ id: 'a', text: 'Starting 3 NM off the coast, containing activity hazardous to aircraft' },
			{ id: 'b', text: 'Only over the center of large cities' },
			{ id: 'c', text: 'Always over military bases inland' },
			{ id: 'd', text: 'It is airspace with no hazards' }
		],
		correctAnswer: 'a',
		explanation:
			'Warning areas extend from 3 NM outward from the U.S. coast over international or domestic waters and contain activity hazardous to nonparticipating aircraft.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Special use airspace)' },
		difficulty: 3
	}
];
