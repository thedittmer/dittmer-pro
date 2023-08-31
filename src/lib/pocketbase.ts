import { PUBLIC_POCKETBASE_URL } from '$env/static/public';
import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';

export const pb = new PocketBase(PUBLIC_POCKETBASE_URL);

export const currentUser = writable(pb.authStore.model);

pb.authStore.onChange((auth) => {
	console.log('authStore changed', auth);
	currentUser.set(pb.authStore.model);
});

export const getAvatarUrl = (user: any) => {
	let avatarUrl = '';
	if (user?.avatar) {
		const collectionId = user?.collectionId;
		const recordId = user?.id;
		const fileName = user?.avatar;
		const size = '0x0';
		avatarUrl = `${PUBLIC_POCKETBASE_URL}/api/files/${collectionId}/${recordId}/${fileName}?thumb=${size}`;
	} else {
		avatarUrl = `https://avatars.dicebear.com/api/bottts/${user?.username}.svg`;
	}
	return avatarUrl;
};
