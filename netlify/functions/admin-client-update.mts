import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ztlrqutyvigppvzjtebp.supabase.co";

function verifyAdmin(req: Request): boolean {
  const auth = req.headers.get("Authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const { action, userId, data } = body;

  if (!action || !userId) {
    return new Response(JSON.stringify({ error: "action and userId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  let result;

  switch (action) {
    // Update profile fields (next_coaching_call, resources_url, full_name, key_tier)
    case "update-profile": {
      const { error } = await supabase
        .from("profiles")
        .update(data)
        .eq("id", userId);
      result = { error: error?.message };
      break;
    }

    // Add item to attachment inventory
    case "add-inventory": {
      const { data: item, error } = await supabase
        .from("attachment_inventory")
        .insert({ user_id: userId, text: data.text, priority: data.priority || false, added_by: "coach" })
        .select()
        .single();
      result = { item, error: error?.message };
      break;
    }

    // Toggle priority on inventory item
    case "toggle-priority": {
      const { data: current } = await supabase
        .from("attachment_inventory")
        .select("priority")
        .eq("id", data.id)
        .single();
      const { error } = await supabase
        .from("attachment_inventory")
        .update({ priority: !current?.priority })
        .eq("id", data.id);
      result = { error: error?.message };
      break;
    }

    // Delete inventory item
    case "delete-inventory": {
      const { error } = await supabase
        .from("attachment_inventory")
        .delete()
        .eq("id", data.id);
      result = { error: error?.message };
      break;
    }

    // Add life note or win
    case "add-life-note": {
      const { data: note, error } = await supabase
        .from("life_notes")
        .insert({ user_id: userId, content: data.content, type: data.type || "note" })
        .select()
        .single();
      result = { note, error: error?.message };
      break;
    }

    // Delete life note
    case "delete-life-note": {
      const { error } = await supabase
        .from("life_notes")
        .delete()
        .eq("id", data.id);
      result = { error: error?.message };
      break;
    }

    default:
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
  }

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  path: "/api/admin-client-update",
};
