import sql from "$lib/utils/neon"

export const POST = async ({ request }) => {
	const { email } = await request.json();
	if (!email || /[a-zA-Z0-9_\.\+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-\.]+/.test(email)) {
		return new Response(JSON.stringify({ success: false, error: "Invalid email address." }), {
			status: 400,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	const result = await sql("INSERT INTO landing (email) VALUES ($1)", email);

	if (result) {
		return new Response(JSON.stringify({ success: true, message: "Successfully subscribed. Thanks for joining us!" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	}

	return new Response(JSON.stringify({ success: false, error: "Failed to subscribe." }), {
		status: 500,
		headers: {
			"Content-Type": "application/json",
		},
	});
}