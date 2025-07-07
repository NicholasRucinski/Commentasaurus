// Using supabase

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info"
};
serve(async (req) => {

	if (req.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: corsHeaders
		});
	}
	if (req.method !== "POST") {
		return new Response("Method Not Allowed", {
			status: 405,
			headers: corsHeaders
		});
	}
	// Parse JSON body
	let body;
	try {
		body = await req.json();
	} catch {
		return new Response("Invalid JSON", {
			status: 400,
			headers: corsHeaders
		});
	}
	const { id, type, text, comment, page, y, src } = body;
	if (!id || !type || !text || !comment || !page || typeof y !== "number") {
		return new Response("Missing required fields", {
			status: 400,
			headers: corsHeaders
		});
	}
	try {
		// Initialize Supabase client with service role
		const supabase = createClient(Deno.env.get("SUPABASE_URL"), Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));
		// Insert the comment
		const { data, error } = await supabase.from("comments").insert([
			{
				id,
				type,
				text,
				comment,
				page,
				y,
				src: src ?? null
			}
		]).select().single();
		if (error) {
			console.error("Insert error:", error);
			return new Response("Database error", {
				status: 500,
				headers: corsHeaders
			});
		}
		return new Response(JSON.stringify(data), {
			status: 200,
			headers: {
				...corsHeaders,
				"Content-Type": "application/json"
			}
		});
	} catch (err) {
		console.error("Unexpected error:", err);
		return new Response("Internal Server Error", {
			status: 500,
			headers: corsHeaders
		});
	}
});

