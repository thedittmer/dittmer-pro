<script lang="ts">
	import { marked } from 'marked';

	const DEFAULT_TEXT = `# Hello

This is **bold** and this is *italic*.

- one
- two
- three

> A quote, just because.

[A link](https://dittmer.pro)
`;

	let text = $state(DEFAULT_TEXT);

	const html = $derived(marked.parse(text, { async: false, breaks: false, gfm: true }) as string);
</script>

<div class="playground" aria-label="Markdown playground">
	<div class="pane">
		<span class="pane-label">markdown</span>
		<!-- svelte-ignore element_invalid_self_closing_tag -->
		<textarea
			bind:value={text}
			spellcheck="false"
			autocapitalize="off"
			autocomplete="off"
			aria-label="Markdown editor"
		></textarea>
	</div>
	<div class="pane preview-pane">
		<span class="pane-label">preview</span>
		<div class="preview">{@html html}</div>
	</div>
</div>

<style>
	.playground {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0;
		margin: 1.75rem 0;
		border: 1px solid var(--color-border);
		border-radius: 4px;
		overflow: hidden;
		background: var(--color-surface);
	}

	@media (min-width: 720px) {
		.playground {
			grid-template-columns: 1fr 1fr;
		}
	}

	.pane {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.pane + .pane {
		border-top: 1px solid var(--color-border);
	}

	@media (min-width: 720px) {
		.pane + .pane {
			border-top: 0;
			border-left: 1px solid var(--color-border);
		}
	}

	.pane-label {
		font-family: var(--font-mono);
		font-size: 0.62rem;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--color-faint);
		padding: 0.55rem 0.85rem;
		border-bottom: 1px solid var(--color-border);
		background: var(--color-surface-2);
	}

	textarea {
		flex: 1;
		background: transparent;
		color: var(--color-text);
		border: 0;
		padding: 0.85rem;
		font-family: var(--font-mono);
		font-size: 0.92rem;
		line-height: 1.55;
		resize: vertical;
		min-height: 13rem;
		-webkit-appearance: none;
		appearance: none;
		/* Stop iOS from auto-zooming when font-size < 16px */
		font-size: 16px;
	}

	@media (min-width: 720px) {
		textarea {
			font-size: 0.92rem;
		}
	}

	textarea:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.02);
	}

	.preview-pane {
		min-height: 13rem;
	}

	.preview {
		padding: 0.95rem 1rem;
		font-family: var(--font-display);
		font-size: 1.05rem;
		line-height: 1.55;
		color: var(--color-text);
		overflow-x: auto;
	}

	.preview :global(h1) {
		font-size: 1.55rem;
		font-style: italic;
		font-weight: 400;
		margin: 0.4em 0 0.3em;
	}
	.preview :global(h2) {
		font-size: 1.3rem;
		font-style: italic;
		font-weight: 400;
		margin: 0.6em 0 0.3em;
	}
	.preview :global(h3) {
		font-size: 1.15rem;
		font-style: italic;
		font-weight: 400;
		margin: 0.6em 0 0.3em;
	}
	.preview :global(p) {
		margin: 0.5em 0;
	}
	.preview :global(ul),
	.preview :global(ol) {
		padding-left: 1.4em;
		margin: 0.5em 0;
	}
	.preview :global(li) {
		margin: 0.2em 0;
	}
	.preview :global(strong) {
		font-weight: 600;
	}
	.preview :global(em) {
		font-style: italic;
	}
	.preview :global(blockquote) {
		border-left: 2px solid var(--color-border);
		padding-left: 0.9em;
		color: var(--color-muted);
		font-style: italic;
		margin: 0.6em 0;
	}
	.preview :global(code) {
		background: rgba(255, 176, 112, 0.12);
		padding: 0.1em 0.35em;
		border-radius: 2px;
		font-family: var(--font-mono);
		font-size: 0.85em;
	}
	.preview :global(pre) {
		background: var(--color-surface-2);
		padding: 0.7rem;
		border-radius: 3px;
		overflow-x: auto;
	}
	.preview :global(pre code) {
		background: transparent;
		padding: 0;
		font-size: 0.85em;
	}
	.preview :global(a) {
		color: var(--color-accent);
	}
	.preview :global(hr) {
		border: 0;
		border-top: 1px solid var(--color-border);
		margin: 1em 0;
	}
</style>
