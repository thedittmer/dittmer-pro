// Dump the GAME question bank to a TTS work-list (prompt + answer clip per
// question). Run with Node 23.6+ (strips type-only imports):
//   node scripts/skyshark-game-narration.mjs > /tmp/skyshark-game-narration.json
//
// Keys match what the game expects:
//   game/<questionId>/prompt  → question + numbered choices
//   game/<questionId>/answer  → correct answer + explanation
import { airspaceQuestions } from '../src/lib/skyshark/questions/airspace.ts';
import { weatherQuestions } from '../src/lib/skyshark/questions/weather.ts';
import { regulationsQuestions } from '../src/lib/skyshark/questions/regulations.ts';
import { sectionalQuestions } from '../src/lib/skyshark/questions/sectional.ts';
import { loadingQuestions } from '../src/lib/skyshark/questions/loading.ts';
import { operationsQuestions } from '../src/lib/skyshark/questions/operations.ts';

const banks = [
	airspaceQuestions,
	weatherQuestions,
	regulationsQuestions,
	sectionalQuestions,
	loadingQuestions,
	operationsQuestions
];

const work = [];
for (const questions of banks) {
	for (const q of questions) {
		const prompt = q.prompt.kind === 'text' ? q.prompt.text : q.prompt.alt;
		const choices = q.choices.map((c, i) => `Option ${i + 1}, ${c.text}.`).join(' ');
		work.push({ key: `game/${q.id}/prompt`, text: `${prompt} ${choices}` });

		const correct = q.choices.find((c) => c.id === q.correctAnswer)?.text ?? '';
		work.push({ key: `game/${q.id}/answer`, text: `The correct answer is, ${correct}. ${q.explanation}` });
	}
}

process.stdout.write(JSON.stringify(work, null, 0));
