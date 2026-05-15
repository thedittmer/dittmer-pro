<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { onDestroy } from 'svelte';
	import { pb } from '$lib/pocketbase';
	import { ClientResponseError } from 'pocketbase';
	import { PAYMENT_METHODS, type Payment, type PaymentMethod, type Project } from './types';

	type Props = {
		open: boolean;
		project: Project;
		onClose: () => void;
		onSaved: (payment: Payment) => void;
	};

	let { open, project, onClose, onSaved }: Props = $props();

	let amount = $state<number | ''>('');
	let receivedDate = $state(todayInput());
	let method = $state<PaymentMethod>('check');
	let reference = $state('');
	let notes = $state('');
	let photoFile = $state<File | null>(null);
	let photoUrl = $state<string | null>(null);
	let cameraInput: HTMLInputElement | undefined = $state();
	let libraryInput: HTMLInputElement | undefined = $state();

	let busy = $state(false);
	let errorMessage = $state('');

	// Re-init each time the modal opens.
	let lastOpen = false;
	$effect(() => {
		if (open && !lastOpen) reset();
		lastOpen = open;
	});

	function todayInput() {
		const d = new Date();
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
	}

	function reset() {
		amount = '';
		receivedDate = todayInput();
		method = 'check';
		reference = '';
		notes = '';
		clearPhoto();
		errorMessage = '';
		busy = false;
	}

	function onPhotoPicked(e: Event) {
		const input = e.target as HTMLInputElement;
		const f = input.files?.[0];
		input.value = '';
		if (!f) return;
		clearPhoto();
		photoFile = f;
		photoUrl = URL.createObjectURL(f);
	}

	function clearPhoto() {
		if (photoUrl) URL.revokeObjectURL(photoUrl);
		photoFile = null;
		photoUrl = null;
	}

	onDestroy(clearPhoto);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		busy = true;
		try {
			const fd = new FormData();
			fd.set('project', project.id);
			fd.set('amount', String(amount));
			// PB date field tolerates date-only "YYYY-MM-DD"
			fd.set('received_date', receivedDate);
			fd.set('method', method);
			fd.set('reference', reference);
			fd.set('notes', notes);
			if (photoFile) fd.set('photo', photoFile);

			const saved = await pb.collection('payments').create<Payment>(fd);
			onSaved(saved);
			onClose();
		} catch (err) {
			if (err instanceof ClientResponseError) {
				errorMessage = err.response?.message || err.message;
				const data = err.response?.data as Record<string, { message?: string }> | undefined;
				if (data) {
					const fieldErrs = Object.entries(data)
						.map(([k, v]) => `${k}: ${v.message ?? ''}`)
						.join('; ');
					if (fieldErrs) errorMessage += ` — ${fieldErrs}`;
				}
			} else {
				errorMessage = (err as Error).message;
			}
		} finally {
			busy = false;
		}
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if open}
	<div
		class="backdrop"
		transition:fade={{ duration: 150 }}
		onclick={onClose}
		onkeydown={(e) => e.key === 'Escape' && onClose()}
		role="presentation"
	>
		<div
			class="sheet"
			transition:fly={{ y: 40, duration: 200 }}
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			aria-labelledby="payment-form-title"
			tabindex="-1"
		>
			<div class="head">
				<div class="drag-handle"></div>
				<div class="title-block">
					<span class="text-meta">{project.business_name || project.name}</span>
					<h2 id="payment-form-title">Log payment</h2>
				</div>
				<button type="button" onclick={onClose} aria-label="Close" class="x">×</button>
			</div>

			<form onsubmit={handleSubmit}>
				{#if errorMessage}
					<div class="error">{errorMessage}</div>
				{/if}

				<div class="row">
					<label class="grow">
						<span>Amount</span>
						<div class="amount-wrap">
							<span class="prefix">$</span>
							<input type="number" step="0.01" min="0" bind:value={amount} required />
						</div>
					</label>
					<label class="grow">
						<span>Received</span>
						<input type="date" bind:value={receivedDate} required />
					</label>
				</div>

				<div class="row">
					<label class="grow">
						<span>Method</span>
						<select bind:value={method}>
							{#each PAYMENT_METHODS as m}
								<option value={m}>{m}</option>
							{/each}
						</select>
					</label>
					<label class="grow">
						<span>Reference</span>
						<input type="text" bind:value={reference} placeholder={method === 'check' ? 'Check #' : ''} />
					</label>
				</div>

				<div class="picker">
					<span class="picker-label">Photo of check / receipt <em>(optional)</em></span>
					<div class="picker-buttons">
						<button type="button" class="pickbtn" onclick={() => cameraInput?.click()}>
							📷 Camera
						</button>
						<button type="button" class="pickbtn" onclick={() => libraryInput?.click()}>
							📎 File
						</button>
						{#if photoFile}
							<button type="button" class="clear-btn" onclick={clearPhoto}>remove</button>
						{/if}
					</div>
					<input
						bind:this={cameraInput}
						type="file"
						accept="image/*,application/pdf"
						capture="environment"
						hidden
						onchange={onPhotoPicked}
					/>
					<input
						bind:this={libraryInput}
						type="file"
						accept="image/*,application/pdf"
						hidden
						onchange={onPhotoPicked}
					/>
					{#if photoUrl}
						<img class="thumb" src={photoUrl} alt="" />
					{/if}
				</div>

				<label>
					<span>Notes <em>(optional)</em></span>
					<textarea rows="3" bind:value={notes}></textarea>
				</label>

				<div class="actions">
					<button type="button" class="ghost" onclick={onClose} disabled={busy}>cancel</button>
					<button type="submit" class="primary" disabled={busy || !amount}>
						{busy ? 'saving…' : 'log payment'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.65);
		display: flex;
		align-items: flex-end;
		justify-content: center;
	}
	@media (min-width: 720px) {
		.backdrop {
			align-items: center;
		}
	}

	.sheet {
		width: 100%;
		max-width: 28rem;
		max-height: 92dvh;
		overflow-y: auto;
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 12px 12px 0 0;
		padding: 1rem 1.25rem 1.25rem;
		padding-bottom: max(1.25rem, env(safe-area-inset-bottom));
	}
	@media (min-width: 720px) {
		.sheet {
			border-radius: 8px;
			max-height: 85dvh;
		}
	}

	.head {
		position: relative;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}
	.drag-handle {
		position: absolute;
		top: -0.3rem;
		left: 50%;
		transform: translateX(-50%);
		width: 2.5rem;
		height: 0.25rem;
		border-radius: 999px;
		background: var(--color-border);
	}
	@media (min-width: 720px) {
		.drag-handle {
			display: none;
		}
	}
	.title-block {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		margin-top: 0.4rem;
	}
	.title-block h2 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.4rem;
		margin: 0;
	}
	.x {
		background: transparent;
		border: 0;
		color: var(--color-muted);
		font-size: 1.6rem;
		line-height: 1;
		cursor: pointer;
		padding: 0.25rem 0.5rem;
	}
	.x:hover {
		color: var(--color-text);
	}

	form {
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}
	label > span {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	label em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}

	input[type='text'],
	input[type='number'],
	input[type='date'],
	select,
	textarea {
		width: 100%;
		padding: 0.65rem 0.8rem;
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		font: inherit;
		font-size: 16px;
	}
	input:focus,
	select:focus,
	textarea:focus {
		outline: none;
		border-color: var(--color-accent);
	}

	.row {
		display: flex;
		gap: 0.75rem;
	}
	.grow {
		flex: 1;
		min-width: 0;
	}

	.amount-wrap {
		position: relative;
	}
	.amount-wrap .prefix {
		position: absolute;
		left: 0.7rem;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-muted);
		font-size: 1rem;
		pointer-events: none;
	}
	.amount-wrap input {
		padding-left: 1.5rem;
	}

	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.picker-label {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.picker-label em {
		font-style: italic;
		opacity: 0.7;
		text-transform: none;
		letter-spacing: 0;
	}
	.picker-buttons {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	.pickbtn {
		background: var(--color-surface-2);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.55rem 0.9rem;
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
	}
	.pickbtn:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}
	.clear-btn {
		background: transparent;
		border: 0;
		color: #ff6b6b;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		cursor: pointer;
		text-decoration: underline;
	}
	.thumb {
		max-width: 12rem;
		max-height: 8rem;
		border-radius: 3px;
		border: 1px solid var(--color-border);
		object-fit: cover;
	}

	.actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
		margin-top: 0.5rem;
	}
	.primary {
		background: var(--color-accent);
		color: var(--color-on-accent);
		border: 0;
		padding: 0.7rem 1.2rem;
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
	.ghost {
		background: transparent;
		color: var(--color-muted);
		border: 1px solid var(--color-border);
		padding: 0.7rem 1.2rem;
		border-radius: 3px;
		font-family: var(--font-mono);
		font-size: 0.78rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.error {
		color: #ff6b6b;
		font-size: 0.85rem;
		padding: 0.5rem 0.75rem;
		border: 1px solid #ff6b6b;
		border-radius: 3px;
	}
</style>
