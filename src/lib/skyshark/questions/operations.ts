import type { Question } from '../types';

/**
 * Operations — FAA ACS Area V (radio/comms, airport ops, emergencies,
 * decision-making, physiology, maintenance). This is the LARGEST area on the
 * real exam (~35–45%). Answers cross-checked against the FAA UAG sample bank.
 */
export const operationsQuestions: Question[] = [
	{
		id: 'op-001',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'At a typical non-towered airport, the standard traffic pattern uses which turns?'
		},
		choices: [
			{ id: 'a', text: 'Left-hand turns' },
			{ id: 'b', text: 'Right-hand turns' },
			{ id: 'c', text: 'Straight-in only' },
			{ id: 'd', text: 'Either direction, pilot’s choice' }
		],
		correctAnswer: 'a',
		explanation:
			'The standard traffic pattern is left turns unless the chart or markings indicate right traffic. Know it so you can avoid manned aircraft.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.B (Airport Operations)' },
		difficulty: 2
	},
	{
		id: 'op-002',
		domain: 'operations',
		prompt: { kind: 'text', text: 'Runway 9 is aligned approximately with which magnetic direction?' },
		choices: [
			{ id: 'a', text: '009°' },
			{ id: 'b', text: '090°' },
			{ id: 'c', text: '900°' },
			{ id: 'd', text: '270°' }
		],
		correctAnswer: 'b',
		explanation:
			'Runway numbers are the magnetic heading rounded to the nearest 10°, with the last zero dropped. Runway 9 ≈ 090°.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.B (Runway markings)' },
		difficulty: 2
	},
	{
		id: 'op-003',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'A remote pilot takes risks to impress others. Which hazardous attitude is this?'
		},
		choices: [
			{ id: 'a', text: 'Macho' },
			{ id: 'b', text: 'Resignation' },
			{ id: 'c', text: 'Anti-authority' },
			{ id: 'd', text: 'Invulnerability' }
		],
		correctAnswer: 'a',
		explanation:
			'“Macho” is taking chances to impress. The antidote: “Taking chances is foolish.” The five hazardous attitudes are anti-authority, impulsivity, invulnerability, macho, and resignation.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.D (Hazardous attitudes)' },
		difficulty: 2
	},
	{
		id: 'op-004',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'A manager tells you to "fly first, ask questions later." Which hazardous attitude does that reflect?'
		},
		choices: [
			{ id: 'a', text: 'Invulnerability' },
			{ id: 'b', text: 'Impulsivity' },
			{ id: 'c', text: 'Resignation' },
			{ id: 'd', text: 'Anti-authority' }
		],
		correctAnswer: 'b',
		explanation:
			'Acting without thinking it through is “impulsivity.” The antidote: “Not so fast — think first.”',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.D (Hazardous attitudes)' },
		difficulty: 2
	},
	{
		id: 'op-005',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'When adapting Crew Resource Management (CRM) to a small UAS operation, CRM should be integrated into:'
		},
		choices: [
			{ id: 'a', text: 'The flight portion only' },
			{ id: 'b', text: 'All phases of the operation' },
			{ id: 'c', text: 'Communications only' },
			{ id: 'd', text: 'Only when a visual observer is used' }
		],
		correctAnswer: 'b',
		explanation:
			'CRM — using all available resources, people, and information — applies to every phase of the operation, not just the flight.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.D (CRM)' },
		difficulty: 2
	},
	{
		id: 'op-006',
		domain: 'operations',
		prompt: { kind: 'text', text: 'Which technique should a remote pilot use to scan for traffic?' },
		choices: [
			{ id: 'a', text: 'Continuously sweep the sky from right to left' },
			{ id: 'b', text: 'Concentrate on movement in peripheral vision only' },
			{ id: 'c', text: 'Systematically focus on different segments of the sky for short intervals' },
			{ id: 'd', text: 'Stare at the aircraft the entire flight' }
		],
		correctAnswer: 'c',
		explanation:
			'Effective scanning uses a series of short, regularly spaced eye movements, focusing on small segments of sky — the eye detects movement and detail best when fixed briefly.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.E (Vision)' },
		difficulty: 2
	},
	{
		id: 'op-007',
		domain: 'operations',
		prompt: { kind: 'text', text: 'The most comprehensive information on a given airport is found in:' },
		choices: [
			{ id: 'a', text: 'The Chart Supplement (formerly Airport/Facility Directory)' },
			{ id: 'b', text: 'Notices to Air Missions (NOTAMs)' },
			{ id: 'c', text: 'The sectional chart legend' },
			{ id: 'd', text: 'The terminal area chart' }
		],
		correctAnswer: 'a',
		explanation:
			'The Chart Supplement is the most comprehensive source of airport data — frequencies, runways, lighting, services, and remarks.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.B (Sources for airport data)' },
		difficulty: 2
	},
	{
		id: 'op-008',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'In a commercial sUAS operation, who is responsible for briefing the participants about emergency procedures?'
		},
		choices: [
			{ id: 'a', text: 'The FAA inspector' },
			{ id: 'b', text: 'The lead visual observer' },
			{ id: 'c', text: 'The remote pilot in command' },
			{ id: 'd', text: 'The client' }
		],
		correctAnswer: 'c',
		explanation:
			'The remote PIC is responsible for briefing all participants on the operation, including emergency procedures and their roles.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.C (Emergency planning)' },
		difficulty: 1
	},
	{
		id: 'op-009',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'When should the operator of a small UAS establish a scheduled maintenance protocol?'
		},
		choices: [
			{ id: 'a', text: 'When the manufacturer does not provide a maintenance schedule' },
			{ id: 'b', text: 'Never — sUAS need no maintenance' },
			{ id: 'c', text: 'Only after an accident' },
			{ id: 'd', text: 'Only if the FAA requests it' }
		],
		correctAnswer: 'a',
		explanation:
			'If the manufacturer provides no maintenance schedule, the operator should establish one based on the aircraft’s use and operating conditions.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.F (Maintenance)' },
		difficulty: 2
	},
	{
		id: 'op-010',
		domain: 'operations',
		prompt: { kind: 'text', text: 'Fatigue, which degrades a remote pilot’s performance, is best recognized as:' },
		choices: [
			{ id: 'a', text: 'Easily overcome by an experienced pilot' },
			{ id: 'b', text: 'Being in an impaired state' },
			{ id: 'c', text: 'Improving focus on the task' },
			{ id: 'd', text: 'Only a concern on long flights' }
		],
		correctAnswer: 'b',
		explanation:
			'Fatigue is an impaired state — it slows reaction, degrades judgment, and is hard to self-detect. Do not fly fatigued.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.E (Stress and fatigue)' },
		difficulty: 1
	},
	{
		id: 'op-011',
		domain: 'operations',
		prompt: {
			kind: 'text',
			text: 'At a non-towered airport, the Common Traffic Advisory Frequency (CTAF) is used to:'
		},
		choices: [
			{ id: 'a', text: 'Self-announce and monitor position and intentions with nearby traffic' },
			{ id: 'b', text: 'Request an IFR clearance' },
			{ id: 'c', text: 'Get an ATC authorization for Class B' },
			{ id: 'd', text: 'Broadcast Remote ID' }
		],
		correctAnswer: 'a',
		explanation:
			'CTAF is the frequency where pilots self-announce and monitor traffic at airports without an operating control tower.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.A (Radio communications)' },
		difficulty: 2
	},
	{
		id: 'op-012',
		domain: 'operations',
		prompt: { kind: 'text', text: 'Which is a correct practice for the lithium batteries that power most sUAS?' },
		choices: [
			{ id: 'a', text: 'Keep using a swollen or damaged pack to finish the job' },
			{ id: 'b', text: 'Inspect packs, charge them properly, and retire damaged ones — they can catch fire' },
			{ id: 'c', text: 'Store them fully charged in direct sun' },
			{ id: 'd', text: 'Lithium batteries have no special hazards' }
		],
		correctAnswer: 'b',
		explanation:
			'Lithium batteries are a fire hazard: inspect and charge them per the manufacturer, and never use a swollen or damaged pack.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'ACS V.C (Lithium batteries)' },
		difficulty: 2
	}
];
