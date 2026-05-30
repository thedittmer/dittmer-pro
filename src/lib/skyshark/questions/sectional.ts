import type { Question } from '../types';

/**
 * Level 4 — Sectional charts.
 * NOTE for the architect: these read best as IMAGE prompts (chart snippets) in a
 * later pass — the Question.prompt union already supports { kind: 'image' }.
 * v1 uses text descriptions of the symbology.
 */
export const sectionalQuestions: Question[] = [
	{
		id: 'sec-001',
		domain: 'sectional',
		prompt: {
			kind: 'text',
			text: 'On a sectional chart, an airport drawn in MAGENTA indicates:'
		},
		choices: [
			{ id: 'a', text: 'An airport without an operating control tower' },
			{ id: 'b', text: 'An airport with an operating control tower' },
			{ id: 'c', text: 'A military airfield' },
			{ id: 'd', text: 'A closed airport' }
		],
		correctAnswer: 'a',
		explanation:
			'Magenta airport symbols have no operating control tower; blue airport symbols have an operating control tower.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 1
	},
	{
		id: 'sec-002',
		domain: 'sectional',
		prompt: {
			kind: 'text',
			text: 'A dashed MAGENTA line surrounding an airport on a sectional depicts:'
		},
		choices: [
			{ id: 'a', text: 'Class E airspace that begins at the surface' },
			{ id: 'b', text: 'Class D airspace' },
			{ id: 'c', text: 'A restricted area' },
			{ id: 'd', text: 'Class B airspace' }
		],
		correctAnswer: 'a',
		explanation:
			'A dashed magenta boundary marks Class E airspace that begins at the surface (often for an airport with instrument approaches).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 2
	},
	{
		id: 'sec-003',
		domain: 'sectional',
		prompt: {
			kind: 'text',
			text: 'A faded/shaded MAGENTA ring (magenta vignette) around an airport indicates Class E airspace beginning at what altitude?'
		},
		choices: [
			{ id: 'a', text: 'The surface' },
			{ id: 'b', text: '700 feet AGL' },
			{ id: 'c', text: '1,200 feet AGL' },
			{ id: 'd', text: '14,500 feet MSL' }
		],
		correctAnswer: 'b',
		explanation: 'A shaded magenta vignette marks Class E airspace that begins at 700 ft AGL.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 3
	},
	{
		id: 'sec-004',
		domain: 'sectional',
		prompt: {
			kind: 'text',
			text: 'A dashed BLUE line around an airport on a sectional depicts which airspace?'
		},
		choices: [
			{ id: 'a', text: 'Class B' },
			{ id: 'b', text: 'Class C' },
			{ id: 'c', text: 'Class D' },
			{ id: 'd', text: 'Class G' }
		],
		correctAnswer: 'c',
		explanation: 'A segmented (dashed) blue line marks Class D airspace around a towered airport.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 2
	},
	{
		id: 'sec-005',
		domain: 'sectional',
		prompt: { kind: 'text', text: 'A solid MAGENTA line on a sectional typically marks the boundary of:' },
		choices: [
			{ id: 'a', text: 'Class C airspace' },
			{ id: 'b', text: 'Class B airspace' },
			{ id: 'c', text: 'A military operations area' },
			{ id: 'd', text: 'A victor airway' }
		],
		correctAnswer: 'a',
		explanation: 'Solid magenta lines depict Class C airspace; solid blue lines depict Class B airspace.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 3
	},
	{
		id: 'sec-006',
		domain: 'sectional',
		prompt: {
			kind: 'text',
			text: 'On a sectional, the large blue or magenta numbers in a grid (e.g., "27") represent:'
		},
		choices: [
			{ id: 'a', text: 'The Maximum Elevation Figure (MEF) in hundreds of feet MSL' },
			{ id: 'b', text: 'The radio frequency for that area' },
			{ id: 'c', text: 'The airspace ceiling in thousands of feet' },
			{ id: 'd', text: 'The runway heading' }
		],
		correctAnswer: 'a',
		explanation:
			'Those quadrant numbers are the Maximum Elevation Figure — the highest terrain/obstacle in that grid, in hundreds of feet MSL.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 3
	},
	{
		id: 'sec-007',
		domain: 'sectional',
		prompt: { kind: 'text', text: 'A solid BLUE line on a sectional marks the boundary of which airspace?' },
		choices: [
			{ id: 'a', text: 'Class B' },
			{ id: 'b', text: 'Class C' },
			{ id: 'c', text: 'Class D' },
			{ id: 'd', text: 'Class E to the surface' }
		],
		correctAnswer: 'a',
		explanation: 'Solid blue lines depict Class B; solid magenta lines depict Class C.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts / VFR symbols)' },
		difficulty: 2
	},
	{
		id: 'sec-008',
		domain: 'sectional',
		prompt: { kind: 'text', text: 'Lines of latitude on a chart measure:' },
		choices: [
			{ id: 'a', text: 'Degrees north and south of the equator' },
			{ id: 'b', text: 'Degrees east and west of Greenwich' },
			{ id: 'c', text: 'Magnetic variation' },
			{ id: 'd', text: 'Terrain elevation' }
		],
		correctAnswer: 'a',
		explanation:
			'Latitude is measured in degrees north/south of the equator; longitude is east/west of the prime meridian (Greenwich).',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 2 (Charts)' },
		difficulty: 2
	}
];
