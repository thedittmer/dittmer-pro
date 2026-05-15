<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import PaymentForm from '$lib/billing/PaymentForm.svelte';
	import {
		agreedYear1,
		totalReceived,
		type Project,
		type Payment,
		type Client
	} from '$lib/billing/types';

	let { data } = $props();

	let paymentFormProject = $state<Project | null>(null);

	function clientName(id: string) {
		return data.clients.find((c: Client) => c.id === id)?.name ?? '—';
	}

	function clientEmail(id: string) {
		return data.clients.find((c: Client) => c.id === id)?.email ?? '';
	}

	function paymentsFor(projectId: string): Payment[] {
		return data.payments.filter((p: Payment) => p.project === projectId);
	}

	function fmtMoney(n: number) {
		return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
	}

	function fmtDate(s: string) {
		if (!s) return '';
		const d = new Date(s.replace(' ', 'T'));
		if (isNaN(d.getTime())) return s;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
	}

	function projectStats(p: Project) {
		const agreed = agreedYear1(p);
		const received = totalReceived(paymentsFor(p.id));
		const balance = agreed - received;
		return { agreed, received, balance };
	}

	// Overall totals across active+proposed projects
	const totals = $derived.by(() => {
		let agreed = 0;
		let received = 0;
		for (const p of data.projects) {
			if (p.status === 'cancelled') continue;
			const s = projectStats(p);
			agreed += s.agreed;
			received += s.received;
		}
		return { agreed, received, balance: agreed - received };
	});

	const recentPayments = $derived(data.payments.slice(0, 10));

	async function handlePaymentSaved(_payment: Payment) {
		await invalidateAll();
	}
</script>

<svelte:head>
	<title>Billing — Jason Dittmer</title>
</svelte:head>

<section class="billing">
	<header class="head">
		<a class="back" href="/">← home</a>
		<h1>Billing</h1>
	</header>

	<div class="totals">
		<div>
			<dt>Agreed Y1</dt>
			<dd>{fmtMoney(totals.agreed)}</dd>
		</div>
		<div>
			<dt>Received</dt>
			<dd>{fmtMoney(totals.received)}</dd>
		</div>
		<div>
			<dt class="bal-label">Balance</dt>
			<dd class:owed={totals.balance > 0} class:paid={totals.balance <= 0}>
				{fmtMoney(totals.balance)}
			</dd>
		</div>
	</div>

	<h2 class="text-meta section-head">Projects</h2>
	<ul class="projects">
		{#each data.projects as project}
			{@const stats = projectStats(project)}
			{@const pays = paymentsFor(project.id)}
			<li class="project status-{project.status}">
				<div class="project-head">
					<div class="project-title">
						<span class="text-meta">
							{project.status} · {clientName(project.client)}
							{#if clientEmail(project.client)}
								· <a class="bill-email" href="mailto:{clientEmail(project.client)}"
										>{clientEmail(project.client)}</a
									>
							{/if}
						</span>
						<h3>{project.business_name || project.name}</h3>
						{#if project.domain}<span class="domain">{project.domain}</span>{/if}
					</div>
					<button
						type="button"
						class="add-payment"
						onclick={() => (paymentFormProject = project)}
					>
						+ payment
					</button>
				</div>

				<dl class="project-stats">
					<div>
						<dt>Agreed Y1</dt>
						<dd>{fmtMoney(stats.agreed)}</dd>
					</div>
					<div>
						<dt>Received</dt>
						<dd>{fmtMoney(stats.received)}</dd>
					</div>
					<div>
						<dt>Balance</dt>
						<dd class:owed={stats.balance > 0} class:paid={stats.balance <= 0}>
							{fmtMoney(stats.balance)}
						</dd>
					</div>
					<div>
						<dt>Monthly</dt>
						<dd>{fmtMoney(project.monthly_fee || 0)}</dd>
					</div>
					<div>
						<dt>After Y1</dt>
						<dd>{fmtMoney(project.monthly_fee_after || 0)}/mo</dd>
					</div>
				</dl>

				{#if pays.length > 0}
					<div class="payments">
						<span class="text-meta">Payments ({pays.length})</span>
						<table>
							<tbody>
								{#each pays as p}
									<tr>
										<td class="date">{fmtDate(p.received_date)}</td>
										<td class="amt">{fmtMoney(p.amount)}</td>
										<td class="method">{p.method}{p.reference ? ` · #${p.reference}` : ''}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	{#if recentPayments.length > 0}
		<h2 class="text-meta section-head">Recent payments</h2>
		<ul class="recent">
			{#each recentPayments as p}
				{@const proj = data.projects.find((x: Project) => x.id === p.project)}
				<li>
					<span class="date">{fmtDate(p.received_date)}</span>
					<span class="proj">{proj?.business_name ?? proj?.name ?? '—'}</span>
					<span class="amt">{fmtMoney(p.amount)}</span>
					<span class="meta">{p.method}{p.reference ? ` · #${p.reference}` : ''}</span>
				</li>
			{/each}
		</ul>
	{/if}
</section>

{#if paymentFormProject}
	<PaymentForm
		open={true}
		project={paymentFormProject}
		onClose={() => (paymentFormProject = null)}
		onSaved={handlePaymentSaved}
	/>
{/if}

<style>
	.billing {
		max-width: 56rem;
		margin: 0 auto;
		padding: 5rem 1.25rem 6rem;
	}

	.head {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		margin-bottom: 2rem;
	}

	.back {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--color-muted);
		text-decoration: none;
	}
	.back:hover {
		color: var(--color-accent);
	}

	.head h1 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 300;
		font-size: clamp(2.2rem, 5vw, 3.4rem);
		line-height: 1;
		letter-spacing: -0.01em;
	}

	.totals {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 0.75rem;
		padding: 1rem 1.2rem;
		background: var(--color-surface-2);
		border-radius: 4px;
		margin-bottom: 2.5rem;
	}
	.totals div {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.totals dt {
		font-family: var(--font-mono);
		font-size: 0.66rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.totals dd {
		font-family: var(--font-display);
		font-size: 1.6rem;
		margin: 0;
	}

	.section-head {
		margin: 0 0 1rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.projects {
		list-style: none;
		padding: 0;
		margin: 0 0 2.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.project {
		border: 1px solid var(--color-border);
		border-radius: 6px;
		padding: 1rem 1.2rem;
	}

	.project.status-proposed {
		border-style: dashed;
		opacity: 0.85;
	}

	.project-head {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.project-title {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.project-title h3 {
		font-family: var(--font-display);
		font-style: italic;
		font-weight: 400;
		font-size: 1.4rem;
		margin: 0;
	}

	.domain {
		font-family: var(--font-mono);
		font-size: 0.75rem;
		color: var(--color-muted);
	}

	.bill-email {
		color: var(--color-muted);
		text-decoration: none;
		text-transform: none;
		letter-spacing: 0;
	}
	.bill-email:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.add-payment {
		flex-shrink: 0;
		background: transparent;
		color: var(--color-accent);
		border: 1px solid var(--color-border);
		border-radius: 3px;
		padding: 0.45rem 0.8rem;
		font-family: var(--font-mono);
		font-size: 0.7rem;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		cursor: pointer;
	}
	.add-payment:hover {
		border-color: var(--color-accent);
		background: rgba(255, 176, 112, 0.08);
	}

	.project-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
		gap: 0.6rem 1rem;
		padding: 0.7rem 0.9rem;
		background: var(--color-surface-2);
		border-radius: 4px;
		margin: 0;
	}
	.project-stats div {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}
	.project-stats dt {
		font-family: var(--font-mono);
		font-size: 0.6rem;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--color-muted);
	}
	.project-stats dd {
		font-family: var(--font-display);
		font-size: 1.05rem;
		margin: 0;
	}

	dd.owed {
		color: var(--color-accent);
	}
	dd.paid {
		color: var(--color-muted);
	}

	.payments {
		margin-top: 1rem;
	}
	.payments table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 0.5rem;
	}
	.payments td {
		padding: 0.4rem 0.5rem;
		border-bottom: 1px solid var(--color-border);
		font-size: 0.9rem;
	}
	.payments .date {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
		width: 8rem;
	}
	.payments .amt {
		font-family: var(--font-display);
		font-size: 1.05rem;
		text-align: right;
		width: 7rem;
	}
	.payments .method {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.recent {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	.recent li {
		display: grid;
		grid-template-columns: 8rem 1fr 6rem auto;
		gap: 1rem;
		align-items: baseline;
		padding: 0.4rem 0;
		border-bottom: 1px solid var(--color-border);
	}
	.recent .date {
		font-family: var(--font-mono);
		font-size: 0.78rem;
		color: var(--color-muted);
	}
	.recent .proj {
		font-family: var(--font-display);
		font-size: 1.05rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.recent .amt {
		font-family: var(--font-display);
		font-size: 1.05rem;
		text-align: right;
	}
	.recent .meta {
		font-family: var(--font-mono);
		font-size: 0.72rem;
		color: var(--color-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}
</style>
