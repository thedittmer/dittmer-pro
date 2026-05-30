import type { Domain, Question } from '../types';
import { airspaceQuestions } from './airspace';
import { weatherQuestions } from './weather';
import { regulationsQuestions } from './regulations';
import { sectionalQuestions } from './sectional';
import { loadingQuestions } from './loading';
import { operationsQuestions } from './operations';

export const questionsByDomain: Record<Domain, Question[]> = {
	airspace: airspaceQuestions,
	weather: weatherQuestions,
	regulations: regulationsQuestions,
	sectional: sectionalQuestions,
	'loading-performance': loadingQuestions,
	operations: operationsQuestions
};

export const allQuestions: Question[] = Object.values(questionsByDomain).flat();

/** The knowledge domains, in order (FAA ACS Areas). */
export const domains: Domain[] = [
	'airspace',
	'weather',
	'regulations',
	'sectional',
	'loading-performance',
	'operations'
];

export const domainLabels: Record<Domain, string> = {
	airspace: 'Airspace',
	weather: 'Weather',
	regulations: 'Regulations',
	sectional: 'Sectional Charts',
	'loading-performance': 'Loading & Performance',
	operations: 'Operations'
};

/** Single-letter callsign drawn on the enemy sprite. */
export const domainTag: Record<Domain, string> = {
	airspace: 'A',
	weather: 'W',
	regulations: 'R',
	sectional: 'S',
	'loading-performance': 'L',
	operations: 'O'
};

function shuffle<T>(arr: T[]): T[] {
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/** Returns a shuffled pool for the chosen domain ('all' = every domain). */
export function pickQuestions(domain: Domain | 'all'): Question[] {
	const pool = domain === 'all' ? allQuestions : questionsByDomain[domain];
	return shuffle(pool);
}
