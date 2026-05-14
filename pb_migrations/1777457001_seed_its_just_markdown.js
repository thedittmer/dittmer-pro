/// <reference path="../pb_data/types.d.ts" />
const SLUG = 'its-just-markdown';
const AUTHOR_ID = 'si1wm1cfsdc5dap';
// Friday 2026-05-01 08:00 CDT == 13:00 UTC
const PUBLISH_AT = '2026-05-01 13:00:00.000Z';

const BODY = `There's a clip floating around from CNET:

> You can also export a note as a markdown file. And if you're wondering what's a markdown file, I didn't know either.

That's a CNET host. *CNET.* A tech publication. Saying on camera that she doesn't know what markdown is.

<div style="position:relative;width:100%;aspect-ratio:16/9;margin:1.5rem 0;">
<iframe src="https://www.youtube.com/embed/T4rxHo2D2q4?start=138" title="CNET — Apple's 26 Hidden Features in iOS 26" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:4px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

Markdown was created in 2004. It's older than the iPhone. It powers Reddit, GitHub, Discord, Notion, Slack, Obsidian, Simplenote, and roughly half the tools you touch every day. And a tech journalist says, on the record, she didn't know what it was.

That's where we are.

## What it actually is

Plain text with a few rules. Wrap a word in asterisks to **bold** it. Underscores for *italics*. A pound sign at the start of a line makes a heading. A dash makes a bullet. That's most of it.

Behind the scenes, whatever app you're using reads those characters and renders the formatting. No toolbar. No mouse. No bouncing between fields to click a B and then a bullet button. You just write.

<div style="position:relative;width:100%;aspect-ratio:16/9;margin:1.5rem 0;">
<iframe src="https://www.youtube.com/embed/ZmpH9uLODWc" title="What in the Web? Markdown" style="position:absolute;inset:0;width:100%;height:100%;border:0;border-radius:4px;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Why this is wild

You already use it. If you've ever typed \`*like this*\` in a Slack message and watched it go italic, you used markdown. If you've ever wrapped code in three backticks in Discord, that's markdown. The syntax is sitting under millions of interfaces doing its job invisibly.

The reason it's worth learning *explicitly* is that once you can see it, you can write anywhere — your notes app, your code editor, a GitHub issue, a README, this blog post — and the formatting comes with you. No proprietary file format. No "export to Word." Just text that reads fine raw and renders nicely when something knows how to render it.

## Try it

Type some markdown below. The preview updates as you go:

{{playground}}

If you've got a notes app or text editor you like — Notion, Obsidian, VS Code, GitHub, half of Slack — open it and try the same thing. The formatting comes with you because the file is just text. That's the whole point.

It'll take you longer to read this post than to learn markdown. Go.`;

migrate(
	(app) => {
		const posts = app.findCollectionByNameOrId('posts');

		try {
			const existing = app.findFirstRecordByFilter('posts', `slug = "${SLUG}"`);
			if (existing) return;
		} catch (_) {
			// not found — fall through and create
		}

		const r = new Record(posts);
		r.set('title', "It's just markdown");
		r.set('slug', SLUG);
		r.set('type', 'text');
		r.set('published', true);
		r.set('publish_at', PUBLISH_AT);
		r.set('author', AUTHOR_ID);
		r.set('body', BODY);
		app.save(r);
	},
	(app) => {
		try {
			const r = app.findFirstRecordByFilter('posts', `slug = "${SLUG}"`);
			if (r) app.delete(r);
		} catch (_) {}
	}
);
