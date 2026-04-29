import type { RecordModel } from 'pocketbase';

export type PostType = 'animation' | 'text' | 'gallery' | 'video' | 'poem';

export interface Post extends RecordModel {
	title: string;
	slug: string;
	type: PostType;
	body: string;
	published: boolean;
	animation_key: string;
	autoplay: boolean;
	cover_image: string;
	images: string[];
	video_url: string;
	author: string;
	tags: string[];
	created: string;
	updated: string;
}

export const POST_TYPES: PostType[] = ['animation', 'text', 'gallery', 'video', 'poem'];
