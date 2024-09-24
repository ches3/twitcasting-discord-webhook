import { safeParse } from "valibot";
import { GetMovieSchema } from "./schema";

export const getMovie = async (id: string, token: string) => {
	const headers = {
		Accept: "application/json",
		"X-Api-Version": "2.0",
		Authorization: `Basic ${token}`,
	};

	const res = await fetch(`https://apiv2.twitcasting.tv/movies/${id}`, {
		headers: headers,
	});
	if (!res.ok) {
		return;
	}
	const json = await res.json();
	const result = safeParse(GetMovieSchema, json);
	if (!result.success) {
		return;
	}
	return result.output;
};

export const sendMessage = async (url: string, message: unknown) => {
	const res = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(message),
	});
	if (!res.ok) {
		return false;
	}
	return true;
};
