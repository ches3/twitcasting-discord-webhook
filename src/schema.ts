import { array, boolean, nullable, number, object, string } from "valibot";

const MovieSchema = object({
	id: string(),
	user_id: string(),
	title: string(),
	subtitle: nullable(string()),
	last_owner_comment: nullable(string()),
	category: nullable(string()),
	link: string(),
	is_live: boolean(),
	is_recorded: boolean(),
	comment_count: number(),
	large_thumbnail: string(),
	small_thumbnail: string(),
	country: string(),
	duration: number(),
	created: number(),
	is_collabo: boolean(),
	is_protected: boolean(),
	max_view_count: number(),
	current_view_count: number(),
	total_view_count: number(),
	hls_url: nullable(string()),
});

const BroadcasterSchema = object({
	id: string(),
	screen_id: string(),
	name: string(),
	image: string(),
	profile: string(),
	level: number(),
	last_movie_id: nullable(string()),
	is_live: boolean(),
	supporter_count: number(),
	supporting_count: number(),
	created: number(),
});

export const WebhookSchema = object({
	signature: string(),
	movie: MovieSchema,
	broadcaster: BroadcasterSchema,
});

export const GetMovieSchema = object({
	movie: MovieSchema,
	broadcaster: BroadcasterSchema,
	tags: array(string()),
});

export const AddWatchListSchema = object({
	id: string(),
	url: string(),
});
