import type { Question } from '../types';

/** Level 2 — Weather. Authored from FAA Remote Pilot Study Guide weather chapter. */
export const weatherQuestions: Question[] = [
	{
		id: 'wx-001',
		domain: 'weather',
		prompt: { kind: 'text', text: 'A METAR is a report of what?' },
		choices: [
			{ id: 'a', text: 'Observed (current) surface weather conditions' },
			{ id: 'b', text: 'A forecast of future weather' },
			{ id: 'c', text: 'Winds aloft for the next 12 hours' },
			{ id: 'd', text: 'A pilot report of turbulence' }
		],
		correctAnswer: 'a',
		explanation:
			'A METAR is an observation of current surface weather. A forecast for an airport area is a TAF.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 1
	},
	{
		id: 'wx-002',
		domain: 'weather',
		prompt: {
			kind: 'text',
			text: 'A small temperature/dewpoint spread (the two values are close together) most likely indicates:'
		},
		choices: [
			{ id: 'a', text: 'Clear skies and high visibility' },
			{ id: 'b', text: 'Fog or low visibility is likely' },
			{ id: 'c', text: 'Strong, gusty winds' },
			{ id: 'd', text: 'Severe turbulence aloft' }
		],
		correctAnswer: 'b',
		explanation:
			'When temperature and dewpoint are close, the air is near saturation — fog, mist, and low ceilings become likely.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 2
	},
	{
		id: 'wx-003',
		domain: 'weather',
		prompt: { kind: 'text', text: 'In a METAR, what does the wind group "21015G25KT" mean?' },
		choices: [
			{ id: 'a', text: 'From 210° at 15 knots, gusting to 25 knots' },
			{ id: 'b', text: 'From 150° at 21 knots, gusting to 25 knots' },
			{ id: 'c', text: 'Toward 210° at 25 knots' },
			{ id: 'd', text: 'Variable wind, 15 to 25 mph' }
		],
		correctAnswer: 'a',
		explanation:
			'Wind is reported as direction (true) + speed in knots, with "G" marking gusts: 210° at 15 kt gusting 25 kt.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 2
	},
	{
		id: 'wx-004',
		domain: 'weather',
		prompt: { kind: 'text', text: 'In a sky-condition report, "BKN" stands for:' },
		choices: [
			{ id: 'a', text: 'Broken — 5 to 7 eighths cloud coverage' },
			{ id: 'b', text: 'Blowing snow' },
			{ id: 'c', text: 'A clear sky' },
			{ id: 'd', text: 'Breaking storm front' }
		],
		correctAnswer: 'a',
		explanation:
			'BKN = broken, meaning 5–7 oktas (eighths) of the sky covered by cloud. FEW, SCT, BKN, OVC describe increasing coverage.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 3
	},
	{
		id: 'wx-005',
		domain: 'weather',
		prompt: {
			kind: 'text',
			text: 'How does a high density altitude (hot, high, humid conditions) affect a small UAS?'
		},
		choices: [
			{ id: 'a', text: 'It improves propeller efficiency' },
			{ id: 'b', text: 'It degrades performance — less lift and thrust' },
			{ id: 'c', text: 'It has no effect on electric aircraft' },
			{ id: 'd', text: 'It increases maximum payload' }
		],
		correctAnswer: 'b',
		explanation:
			'High density altitude means thinner air, so propellers produce less thrust and the aircraft performs worse — reduced climb and payload.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 2
	},
	{
		id: 'wx-006',
		domain: 'weather',
		prompt: { kind: 'text', text: 'Cumuliform clouds, showery precipitation, and turbulence are signs of:' },
		choices: [
			{ id: 'a', text: 'Stable air' },
			{ id: 'b', text: 'Unstable air' },
			{ id: 'c', text: 'A temperature inversion' },
			{ id: 'd', text: 'Calm, fog-prone conditions' }
		],
		correctAnswer: 'b',
		explanation:
			'Unstable air produces cumuliform clouds, showery precipitation, good visibility, and turbulence. Stable air gives stratiform clouds and steady conditions.',
		sourceRef: { doc: 'faa-remote-pilot-study-guide', locator: 'Ch. 6 (Weather)' },
		difficulty: 3
	}
];
