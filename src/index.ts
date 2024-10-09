import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { getMovie, sendMessage } from "./func";
import { AddWatchListSchema, WebhookSchema } from "./schema";

type Bindings = {
	TWITCASTING_TOKEN: string;
	TWITCASTING_SIGNATURE: string;
	WATCH_LIST: KVNamespace;
};

type KVMetadata = {
	url: string;
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
		const req = c.req.valid("json");

		const watchListData = await c.env.WATCH_LIST.getWithMetadata<KVMetadata>(
			req.broadcaster.id,
		);
		const webhook = watchListData.metadata?.url;
		if (!webhook) {
			throw new Error("Webhook URL not found");
		}

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
						// "*-2.jpg"はリンク切れするため、URLを置換する
						url: movie.large_thumbnail.replace("-2.jpg", "-1.jpg"),
					},
					footer: {
						text: "ツイキャス",
						icon_url: "https://twitcasting.tv/img/icon192.png",
					},
					timestamp: new Date(movie.created * 1000).toISOString(),
				},
			],
		};

		console.log(message);

		const success = await sendMessage(webhook, message);
		if (!success) {
			return c.json({ message: "Failed to send webhook" }, 400);
		}
		return c.json({ message: "Webhook sent successfully" });
	},
);

app.get("/watchlist", async (c) => {
	const list = await c.env.WATCH_LIST.list<KVMetadata>();
	const items = list.keys.map((key) => ({
		id: key.name,
		url: key.metadata?.url,
	}));
	return c.json(items);
});

app.post(
	"/watchlist",
	vValidator("json", AddWatchListSchema, (result, c) => {
		if (!result.success) {
			return c.json(
				{ message: "Invalid request body", errors: result.issues },
				400,
			);
		}
	}),
	async (c) => {
		const req = c.req.valid("json");
		await c.env.WATCH_LIST.put(req.id, "", {
			metadata: { url: req.url },
		});
		return c.json({ id: req.id, url: req.url });
	},
);

app.delete("/watchlist/:id", async (c) => {
	const id = c.req.param("id");
	await c.env.WATCH_LIST.delete(id);
	return c.json({ message: "Watchlist deleted successfully" });
});

export default app;
