import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { Schema } from "./schema";

type Bindings = {
	WEBHOOK_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get("/", (c) => {
	return c.text("Hello Hono!");
});

app.post(
	"/",
	vValidator("json", Schema, (result, c) => {
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
		console.log(new Date(req.movie.created * 1000).toISOString());

		const message = {
			content: "",
			embeds: [
				{
					title: req.movie.title,
					description: req.movie.subtitle,
					url: req.movie.link,
					author: {
						name: req.broadcaster.name,
						icon_url: req.broadcaster.image,
					},
					image: {
						url: req.movie.large_thumbnail,
					},
					footer: {
						text: "ツイキャス",
						icon_url: "https://twitcasting.tv/img/icon192.png",
					},
					timestamp: new Date(req.movie.created * 1000).toISOString(),
				},
			],
		};

		const res = await fetch(webhook, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(message),
		});

		if (!res.ok) {
			return c.json({ message: "Failed to send webhook" }, 400);
		}
		return c.json({ message: "Webhook sent successfully" });
	},
);

export default app;
