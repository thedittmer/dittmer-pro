/// <reference path="../pb_data/types.d.ts" />
const SLUG = 'limited-capacity';

const MARKDOWN = `Bohemian Rhapsody has been my favorite song since I was old enough to have a favorite song. I couldn't tell you exactly why. If you'd asked me in high school I would have said something about how it has every kind of song inside it — a ballad, an opera, a hard rock thing, a quiet outro — all stitched together without a chorus repeating to anchor you. That still feels right. But I never went past that. It was just the thing my brain had decided was the thing.

Then this week I watched a breakdown of the original multitrack recordings, and a lot of the "I don't know, it just is" got replaced with specifics.

The song was tracked in 1975 to a 24-track tape machine. That's already a constraint problem — there are over 180 vocal overdubs on the final mix. Way more than 24. So they had to bounce: record several voices to a track, mix that down to one, free up tracks, record more on top. Once you bounce, you can't unbounce. Every layer is a commitment.

There was no click track. Freddie just conducted Roger Taylor and John Deacon through it, gaps and all, with the song existing only in his head. Brian May talks about how Freddie showed up with Post-it notes from his dad's work, the song's structure on them, gaps marked where something operatic would happen. Nobody knew what it was going to sound like until it sounded like it.

The verse — the "Mama, just killed a man" part — was originally something Freddie called the cowboy song, an idea he'd been carrying since the late '60s. So this song that feels like one continuous thought is actually three or four ideas from different years that finally found each other.

The Galileo section started as a couple of seconds. They just kept adding. The producer remembers Freddie coming in day after day with more Galileos. They worked at four different studios over the summer of '75, twelve hours a day, three guys — Freddie, Brian, Roger — singing every line three times, then doubling that, then tripling it. Nine tracks deep per line in some sections.

The "any way the wind blows" wind sound? A reversed crash cymbal with the pitch shifted. No synths. The whole thing is four people, four instruments, voices, and tape.

The part I keep coming back to is that the rhythm track was slightly out of time — because there was no click and Freddie was conducting from imagination — and that imperfection became the *Magnifico* echo effect. The mistake got turned into a feature. That's a kind of artistic move I respect more the older I get.

A year after the song came out, Freddie said this about it: he didn't really know anything about opera, he just wanted to make what he thought Queen could do. He called it as far as his "limited capacity" could take him.

That's the part that hit me. The most ambitious, structurally weird, format-breaking pop song of the 20th century — too long for radio, no chorus, the title never said in the lyrics — and the guy who wrote it shrugged and called his own range *limited*. And it wasn't false modesty. He genuinely thought he was working at the edge of what he could do. That's exactly why it sounds the way it sounds. He wasn't writing inside the lines because he didn't really know where the lines were. He was just pushing on the thing as hard as he could push on it with the tools and the people in the room.

But all of that is me thinking about it now, in 2026, watching YouTube. In high school I wasn't thinking about any of this. I ran the 4x400 relay, and the whole 400 I'd be singing the song under my breath. By the time I hit "Mama" I was at the handoff. My teammate could hear me coming. He started using it as his timing cue — when he heard "Mama," he'd put his hand back for the baton.

Weezer is my favorite band, and that's changed — it used to be Counting Crows. Movies have changed. Lots of things have changed. But for one season of my life, somebody else's timing depended on this song being in my head at exactly the right second. That's not the kind of thing that goes away.

---

*Most of what I wrote here came from David Hartley's [Why Bohemian Rhapsody could only be recorded in 1975](https://www.youtube.com/watch?v=XLqhOEzpWyo). Hearing the tracks isolated is incredible. I don't think I'll hear the song the same way again.*

<div style="position:relative;width:100%;aspect-ratio:16/9;margin-top:2rem;">
<iframe src="https://www.youtube.com/embed/XLqhOEzpWyo" title="Why Bohemian Rhapsody could only be recorded in 1975" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:4px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>`;

migrate(
	(app) => {
		try {
			const r = app.findFirstRecordByFilter('posts', `slug = "${SLUG}"`);
			r.set('body', MARKDOWN);
			app.save(r);
		} catch (_) {
			// post doesn't exist yet — nothing to convert
		}
	},
	(_app) => {
		// no-op revert: keeping the markdown is harmless under either renderer
	}
);
