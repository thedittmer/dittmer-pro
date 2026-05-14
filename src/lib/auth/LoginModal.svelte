<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { ClientResponseError } from 'pocketbase';
	import { currentUser, pb } from '$lib/pocketbase';
	import { loginOpen, closeLogin } from './login-state';

	let email = $state('');
	let code = $state('');
	let otpId = $state('');
	let stage = $state<'email' | 'code' | 'success'>('email');
	let busy = $state(false);
	let errorMessage = $state('');
	let emailInput: HTMLInputElement | null = $state(null);
	let codeInput: HTMLInputElement | null = $state(null);

	function reset() {
		email = '';
		code = '';
		otpId = '';
		stage = 'email';
		errorMessage = '';
		busy = false;
	}

	function close() {
		closeLogin();
		setTimeout(reset, 300);
	}

	$effect(() => {
		if (!$loginOpen) return;
		queueMicrotask(() => {
			if (stage === 'email') emailInput?.focus();
			else if (stage === 'code') codeInput?.focus();
		});
	});

	async function requestCode(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		busy = true;
		try {
			const result = await pb.collection('users').requestOTP(email);
			otpId = result.otpId;
			stage = 'code';
		} catch (err) {
			errorMessage =
				err instanceof ClientResponseError ? err.response?.message || err.message : (err as Error).message;
		} finally {
			busy = false;
		}
	}

	async function verifyCode(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		busy = true;
		try {
			await pb.collection('users').authWithOTP(otpId, code);
			stage = 'success';
			setTimeout(close, 800);
		} catch (err) {
			errorMessage =
				err instanceof ClientResponseError
					? err.response?.message || err.message
					: (err as Error).message;
		} finally {
			busy = false;
		}
	}

	function signOut() {
		pb.authStore.clear();
		close();
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if $loginOpen}
	<div
		class="backdrop"
		transition:fade={{ duration: 150 }}
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="presentation"
	>
		<div
			class="dialog"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="login-title"
			tabindex="-1"
		>
			<div class="head">
				<h2 id="login-title">
					{#if $currentUser}
						Account
					{:else if stage === 'email'}
						Sign in
					{:else if stage === 'code'}
						Enter code
					{:else}
						✓ Signed in
					{/if}
				</h2>
				<button onclick={close} aria-label="Close" class="x">×</button>
			</div>

			{#if $currentUser}
				<p class="who">
					Signed in as <strong>@{$currentUser.username}</strong>
					{#if $currentUser.admin}
						<span class="badge">admin</span>
					{/if}
				</p>
				<button onclick={signOut} class="primary">Sign out</button>
			{:else if stage === 'email'}
				<form onsubmit={requestCode}>
					{#if errorMessage}<div class="error">{errorMessage}</div>{/if}
					<input
						bind:this={emailInput}
						bind:value={email}
						type="email"
						placeholder="Email address"
						required
						autocomplete="email"
					/>
					<button type="submit" disabled={busy} class="primary">
						{busy ? 'Sending…' : 'Send code'}
					</button>
				</form>
			{:else if stage === 'code'}
				<form onsubmit={verifyCode}>
					{#if errorMessage}<div class="error">{errorMessage}</div>{/if}
					<p class="muted">We sent an 8-character code to <strong>{email}</strong>.</p>
					<input
						bind:this={codeInput}
						bind:value={code}
						type="text"
						inputmode="text"
						autocomplete="one-time-code"
						placeholder="Code"
						required
						minlength={8}
						maxlength={8}
						class="code-input"
					/>
					<button type="submit" disabled={busy} class="primary">
						{busy ? 'Verifying…' : 'Verify'}
					</button>
					<button type="button" onclick={() => (stage = 'email')} class="text-btn">
						Use a different email
					</button>
				</form>
			{:else}
				<p class="success">You're in.</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.6);
		padding: 1rem;
	}

	.dialog {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 8px;
		padding: 1.5rem;
		width: 100%;
		max-width: 22rem;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
	}

	.head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	.head h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.4rem;
	}

	.x {
		background: transparent;
		border: 0;
		color: var(--color-muted);
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
	}
	.x:hover {
		color: var(--color-text);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	input {
		width: 100%;
		padding: 0.75rem 0.9rem;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		font: inherit;
		font-size: 16px; /* avoid iOS auto-zoom */
	}
	input:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.code-input {
		font-family: var(--font-mono);
		text-align: center;
		letter-spacing: 0.3em;
		font-size: 1.2rem;
	}

	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border: 0;
		padding: 0.7rem 1rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.primary:disabled {
		opacity: 0.5;
	}

	.text-btn {
		background: transparent;
		border: 0;
		color: var(--color-muted);
		font-size: 0.85rem;
		text-decoration: underline;
		cursor: pointer;
		padding: 0.25rem 0;
	}
	.text-btn:hover {
		color: var(--color-text);
	}

	.muted {
		color: var(--color-muted);
		font-size: 0.9rem;
	}

	.who {
		margin-bottom: 1rem;
	}

	.badge {
		margin-left: 0.5rem;
		font-family: var(--font-mono);
		font-size: 0.65rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		padding: 0.15rem 0.5rem;
		background: var(--color-accent);
		color: var(--color-on-accent);
		border-radius: 2px;
	}

	.error {
		color: #ff6b6b;
		font-size: 0.85rem;
	}

	.success {
		color: #6bc28b;
	}
</style>
