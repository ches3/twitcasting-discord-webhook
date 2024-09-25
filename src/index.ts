import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { getMovie, sendMessage } from "./func";
import { WebhookSchema } from "./schema";

type Bindings = {
	WEBHOOK_URL: string;
	TWITCASTING_TOKEN: string;
	TWITCASTING_SIGNATURE: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post(
	"/",
	vValidator("json", WebhookSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{ message: "Invalid request body", errors: result.issues },
				400,
			);
		}
	}),
	async (c) => {
		const webhook = c.env.WEBHOOK_URL;
		const req = c.req.valid("json");

		console.log(req);

		if (req.signature !== c.env.TWITCASTING_SIGNATURE) {
			return c.json({ message: "Invalid signature" }, 400);
		}

		// Webhookのリクエストではライブのタイトルが反映されないことがあるため、
		// ライブ情報をAPIから取得する
		const { movie, broadcaster } =
			(await getMovie(req.movie.id, c.env.TWITCASTING_TOKEN)) || req;

		console.log(movie);

		const message = {
			content: "",
			embeds: [
				{
					title: movie.title,
					description: movie.title !== movie.subtitle ? movie.subtitle : "",
					url: movie.link,
					author: {
						name: broadcaster.name,
						icon_url: broadcaster.image,
					},
					image: {
						url: movie.large_thumbnail,
					},
					footer: {
						text: "ツイキャス",
						icon_url: "https://twitcasting.tv/img/icon192.png",
					},
					timestamp: new Date(movie.created * 1000).toISOString(),
				},
			],
		};

		const success = await sendMessage(webhook, message);
		if (!success) {
			return c.json({ message: "Failed to send webhook" }, 400);
		}
		return c.json({ message: "Webhook sent successfully" });
	},
);

export default app;
