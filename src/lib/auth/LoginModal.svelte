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
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
		transition:fade={{ duration: 150 }}
		onclick={close}
		onkeydown={(e) => e.key === 'Escape' && close()}
		role="presentation"
	>
		<div
			class="bg-white dark:bg-gray-800 dark:text-white rounded-lg p-6 w-full max-w-sm shadow-xl"
			transition:scale={{ duration: 200, start: 0.95 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="login-title"
			tabindex="-1"
		>
			<div class="flex justify-between items-center mb-4">
				<h2 id="login-title" class="text-lg font-bold">
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
				<button onclick={close} aria-label="Close" class="text-2xl leading-none opacity-60 hover:opacity-100">×</button>
			</div>

			{#if $currentUser}
				<p class="mb-4">
					Signed in as <strong>@{$currentUser.username}</strong>
					{#if $currentUser.admin}
						<span class="ml-2 text-xs px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded">admin</span>
					{/if}
				</p>
				<button
					onclick={signOut}
					class="border px-4 py-2 dark:bg-gray-700 dark:text-yellow-500 w-full"
				>
					Sign out
				</button>
			{:else if stage === 'email'}
				<form onsubmit={requestCode} class="space-y-3">
					{#if errorMessage}
						<div class="text-red-500 text-sm">{errorMessage}</div>
					{/if}
					<input
						bind:this={emailInput}
						bind:value={email}
						type="email"
						placeholder="Email address"
						required
						autocomplete="email"
						class="w-full p-3 border rounded dark:bg-gray-700"
					/>
					<button
						type="submit"
						disabled={busy}
						class="w-full border px-4 py-2 dark:bg-gray-700 dark:text-yellow-500 disabled:opacity-50"
					>
						{busy ? 'Sending…' : 'Send code'}
					</button>
				</form>
			{:else if stage === 'code'}
				<form onsubmit={verifyCode} class="space-y-3">
					{#if errorMessage}
						<div class="text-red-500 text-sm">{errorMessage}</div>
					{/if}
					<p class="text-sm opacity-70">
						We sent an 8-character code to <strong>{email}</strong>.
					</p>
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
						class="w-full p-3 border rounded font-mono text-center text-lg tracking-widest dark:bg-gray-700"
					/>
					<button
						type="submit"
						disabled={busy}
						class="w-full border px-4 py-2 dark:bg-gray-700 dark:text-yellow-500 disabled:opacity-50"
					>
						{busy ? 'Verifying…' : 'Verify'}
					</button>
					<button
						type="button"
						onclick={() => (stage = 'email')}
						class="text-sm opacity-60 hover:opacity-100 underline"
					>
						Use a different email
					</button>
				</form>
			{:else}
				<p class="text-green-600 dark:text-green-400">You're in.</p>
			{/if}
		</div>
	</div>
{/if}
