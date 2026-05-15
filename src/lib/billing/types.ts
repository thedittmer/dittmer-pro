import type { RecordModel } from 'pocketbase';

export type ProjectStatus = 'proposed' | 'active' | 'paused' | 'completed' | 'cancelled';

export type PaymentMethod =
	| 'cash'
	| 'check'
	| 'ach'
	| 'card'
	| 'stripe'
	| 'venmo'
	| 'zelle'
	| 'other';

export const PROJECT_STATUSES: ProjectStatus[] = [
	'proposed',
	'active',
	'paused',
	'completed',
	'cancelled'
];

export const PAYMENT_METHODS: PaymentMethod[] = [
	'check',
	'ach',
	'card',
	'stripe',
	'venmo',
	'zelle',
	'cash',
	'other'
];

export interface Client extends RecordModel {
	name: string;
	email: string;
	phone: string;
	notes: string;
	created: string;
	updated: string;
}

export interface Project extends RecordModel {
	client: string;
	business_name: string;
	name: string;
	domain: string;
	status: ProjectStatus;
	start_date: string;
	setup_fee: number;
	monthly_fee: number;
	monthly_fee_after: number;
	year1_months: number;
	signed_proposal: string;
	accepted_date: string;
	notes: string;
	created: string;
	updated: string;
}

export interface Payment extends RecordModel {
	project: string;
	amount: number;
	received_date: string;
	method: PaymentMethod;
	reference: string;
	photo: string;
	notes: string;
	created: string;
	updated: string;
}

// Computed-per-project helpers
export function agreedYear1(p: Project): number {
	const setup = p.setup_fee || 0;
	const monthly = p.monthly_fee || 0;
	const months = p.year1_months || 0;
	return setup + monthly * months;
}

export function totalReceived(payments: Payment[]): number {
	return payments.reduce((sum, p) => sum + (p.amount || 0), 0);
}
