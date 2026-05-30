// Dump the trainer narration to a flat work-list JSON for the TTS step.
// Run with Node 23.6+ (strips the type-only import in content.ts):
//   node scripts/skyshark-narration.mjs > /tmp/skyshark-narration.json
//
// Each item is { key: "section/lesson/index", text }. The key matches the file
// path the app expects at /skyshark/audio/<key>.mp3 and the manifest entries.
import { studySections } from '../src/lib/skyshark/training/content.ts';

const work = [];
for (const s of studySections) {
	if (!s.ready) continue;
	if (Array.isArray(s.lessons)) {
		for (const lesson of s.lessons) {
			lesson.lines.forEach((l, i) => work.push({ key: `${s.id}/${lesson.id}/${i}`, text: l.text }));
		}
	} else if (Array.isArray(s.lines)) {
		s.lines.forEach((l, i) => work.push({ key: `${s.id}/main/${i}`, text: l.text }));
	}
}

process.stdout.write(JSON.stringify(work, null, 0));
