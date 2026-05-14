<script lang="ts">
	import { theme, toggleTheme } from './theme';
</script>

<button
	onclick={toggleTheme}
	aria-label="Toggle {$theme === 'dark' ? 'light' : 'dark'} mode"
	title="Toggle theme"
	class="theme-toggle"
>
	{#if $theme === 'dark'}
		<!-- sun -->
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<circle cx="12" cy="12" r="4" fill="currentColor" />
			<g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
				<line x1="12" y1="2" x2="12" y2="4" />
				<line x1="12" y1="20" x2="12" y2="22" />
				<line x1="2" y1="12" x2="4" y2="12" />
				<line x1="20" y1="12" x2="22" y2="12" />
				<line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
				<line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
				<line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
				<line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
			</g>
		</svg>
	{:else}
		<!-- moon -->
		<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
			<path
				d="M21 12.5A9 9 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5z"
				fill="currentColor"
			/>
		</svg>
	{/if}
</button>

<style>
	.theme-toggle {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.1rem;
		height: 2.1rem;
		padding: 0;
		background: rgba(0, 0, 0, 0.35);
		color: #fff;
		border: 1px solid rgba(255, 255, 255, 0.25);
		border-radius: 999px;
		cursor: pointer;
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
		opacity: 0.85;
		transition: opacity 0.2s ease, border-color 0.2s ease, color 0.2s ease;
	}

	:global([data-theme='light']) .theme-toggle {
		background: rgba(244, 236, 216, 0.7);
		color: #1a1a1a;
		border-color: rgba(26, 26, 26, 0.25);
	}

	.theme-toggle:hover {
		opacity: 1;
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
</style>
