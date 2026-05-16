import type { RecordModel } from 'pocketbase';

export type TargetCollection = 'stops' | 'posts';

export type ReactionType = 'heart' | 'fire' | 'thumbs' | 'laugh' | 'wow' | 'pray';

export const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
	{ type: 'heart', emoji: '❤️', label: 'Love' },
	{ type: 'fire', emoji: '🔥', label: 'Fire' },
	{ type: 'thumbs', emoji: '👍', label: 'Like' },
	{ type: 'laugh', emoji: '😂', label: 'Laugh' },
	{ type: 'wow', emoji: '😮', label: 'Wow' },
	{ type: 'pray', emoji: '🙏', label: 'Pray' }
];

export interface Reaction extends RecordModel {
	target_collection: TargetCollection;
	target_id: string;
	type: ReactionType;
	email: string;
	name: string;
	verified: boolean;
	created: string;
	updated: string;
}

export interface Comment extends RecordModel {
	target_collection: TargetCollection;
	target_id: string;
	email: string;
	name: string;
	body: string;
	verified: boolean;
	created: string;
	updated: string;
}
