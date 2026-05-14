import type { RecordModel } from 'pocketbase';

export type StopType = 'gas' | 'sightseeing' | 'hotel' | 'food' | 'rest' | 'other';

export const STOP_TYPES: StopType[] = [
	'gas',
	'sightseeing',
	'hotel',
	'food',
	'rest',
	'other'
];

export interface Vehicle extends RecordModel {
	name: string;
	make: string;
	model: string;
	year: number;
	nickname: string;
	starting_odometer: number;
	notes: string;
	created: string;
	updated: string;
}

export interface Trip extends RecordModel {
	name: string;
	slug: string;
	description: string;
	origin: string;
	destination: string;
	origin_lat: number;
	origin_lng: number;
	destination_lat: number;
	destination_lng: number;
	start_date: string;
	end_date: string;
	featured_image: string;
	vehicle: string;
	published: boolean;
	created: string;
	updated: string;
}

export interface Stop extends RecordModel {
	trip: string;
	type: StopType;
	name: string;
	lat: number;
	lng: number;
	accuracy: number;
	altitude: number;
	altitude_accuracy: number;
	heading: number;
	speed: number;
	address: string;
	timestamp: string;
	photos: string[];
	receipts: string[];
	notes: string;
	// Gas-specific:
	odometer: number;
	gallons: number;
	price_per_gallon: number;
	total_cost: number;
	created: string;
	updated: string;
}
