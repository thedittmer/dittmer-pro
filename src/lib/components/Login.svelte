<script lang="ts">
	import { currentUser, pb } from '$lib/pocketbase';
	import { fade, fly } from 'svelte/transition';

	let username: string;
	let email: string;
	let password: string;
	let isSignUp: boolean;
	let isReset: boolean;
	let isLogin: boolean;
	let serviceTerms: boolean;
	let errorMessage = '';
	let error = '';

	isSignUp = true;
	function setSignUp() {
		isSignUp = true;
		isReset = false;
		isLogin = false;
		error = '';
		errorMessage = '';
	}
	isReset = false;
	function setReset() {
		isReset = true;
		isSignUp = false;
		isLogin = false;
		error = '';
		errorMessage = '';
	}
	isLogin = false;
	function setLogin() {
		isLogin = true;
		isSignUp = false;
		isReset = false;
		error = '';
		errorMessage = '';
	}

	async function login() {
		try {
			await pb.collection('users').authWithPassword(username, password);
		} catch (err) {
			error = err;
			errorMessage = 'Login Failed';
		}
	}

	async function signUp() {
		try {
			const data = {
				serviceTerms,
				username,
				email,
				password,
				passwordConfirm: password
			};
			const creatUser = await pb.collection('users').create(data);
			await login();
		} catch (err) {
			error = err;
			errorMessage = 'Sign Up Failed';
		}
	}

	function signOut() {
		pb.authStore.clear();
		error = '';
		errorMessage = '';
		password = '';
		isSignUp = false;
		isReset = false;
	}

	async function resetPass() {
		try {
			error = '';
			errorMessage = 'Please check your email to reset your password.';
			password = '';
			isSignUp = false;
			isReset = false;
			isLogin = true;
			await pb.collection('users').requestPasswordReset(email);
			pb.authStore.clear();
		} catch (err) {
			error = err;
			errorMessage = 'Password Reset Failed';
		}
	}
</script>

<div class="max-w-lg pt-2 dark:text-white">
	{#if $currentUser}
		<div
			class="flex flex-row max-w-md"
			in:fly={{ y: -200, duration: 300 }}
			out:fade={{ duration: 300 }}
		>
			<span class="mr-3">Signed in as @{$currentUser.username}</span>
			<button class="underline" on:click={signOut}>Sign Out</button>
		</div>
	{:else}
		{#if errorMessage !== ''}
			<!-- `{JSON.stringify(error)}` -->
			<div
				class="border border-red-500 rounded p-5"
				in:fly={{ y: -200, duration: 300 }}
				out:fade={{ duration: 300 }}
			>
				{#if errorMessage}
					<h3 class="text-red-500 font-bold">{errorMessage}</h3>
				{/if}
				{#if error !== ''}
					{#each Object.entries(error.response.data) as [key, value]}
						{#if key !== 'passwordConfirm'}
							<p><strong>{key}</strong>: {value.message}</p>
						{/if}
					{/each}
				{/if}
			</div>
		{/if}
		<form class="flex flex-col" on:submit|preventDefault>
			{#if isSignUp}
				<div in:fly={{ y: -200, duration: 300 }} out:fade={{ duration: 300 }} class="flex flex-col">
					<input
						class="m-1 p-5 border border-accent rounded dark:bg-gray-700"
						type="text"
						placeholder="Username"
						bind:value={username}
						required
					/>
					<input
						class="m-1 p-5 border border-accent rounded dark:bg-gray-700"
						type="email"
						placeholder="Email"
						bind:value={email}
						required
					/>
					<input
						class="m-1 p-5 border border-accent rounded dark:bg-gray-700"
						type="password"
						placeholder="Password"
						bind:value={password}
						required
					/>
					<div>
						<div class="m-3">
							<button
								class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
								on:click={signUp}>Sign Up</button
							>
						</div>
					</div>
				</div>
			{:else if isReset}
				<div in:fly={{ y: -200, duration: 300 }} out:fade={{ duration: 300 }} class="flex flex-col">
					<input
						class="m-1 p-5 border border-accent rounded w-full dark:bg-gray-700"
						type="email"
						placeholder="Email"
						bind:value={email}
						required
					/>
					<div class="m-3">
						<button
							class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
							on:click={resetPass}>Reset Password</button
						>
					</div>
				</div>
			{:else}
				<div in:fly={{ y: -200, duration: 300 }} out:fade={{ duration: 300 }} class="flex flex-col">
					<input
						class="m-1 p-5 border border-accent rounded dark:bg-gray-700"
						type="text"
						placeholder="Username"
						bind:value={username}
					/>
					<input
						class="m-1 p-5 border border-accent rounded dark:bg-gray-700"
						type="password"
						placeholder="Password"
						bind:value={password}
					/>
					<div class="m-3">
						<button
							class="dark:bg-gray-700 text-gray-700 dark:text-yellow-500 border px-5 md:px-10 py-1 text-center md:whitespace-nowrap md:text-lg"
							on:click={login}>Login</button
						>
					</div>
				</div>
			{/if}
		</form>
		{#if !isLogin}
			<button class="ml-4 underline dark:text-yellow-200 text-xl font-bold" on:click={setLogin}
				>Login</button
			>
		{/if}
		{#if !isSignUp}
			<button class="ml-4 underline dark:text-yellow-200 text-xl font-bold" on:click={setSignUp}
				>Create your account!</button
			>
		{/if}
		{#if !isReset}
			<button class="ml-4 underline" on:click={setReset}>Forget your password?</button>
		{/if}
	{/if}
</div>
