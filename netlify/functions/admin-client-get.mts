import type { Config } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ztlrqutyvigppvzjtebp.supabase.co";

function verifyAdmin(req: Request): boolean {
  const auth = req.headers.get("Authorization");
  return auth === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export default async function handler(req: Request): Promise<Response> {
  if (!verifyAdmin(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return new Response(JSON.stringify({ error: "userId required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [profileRes, convsRes, formsRes, inventoryRes, notesRes, authRes] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("conversations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("post_session_forms")
        .select("*")
        .eq("user_id", userId),
      supabase
        .from("attachment_inventory")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase
        .from("life_notes")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase.auth.admin.getUserById(userId),
    ]);

  const completedConvIds = new Set(
    formsRes.data?.map((f) => f.conversation_id) || []
  );

  const conversations = (convsRes.data || []).map((conv, idx) => ({
    ...conv,
    session_number: idx + 1,
    is_complete: completedConvIds.has(conv.id),
    form: formsRes.data?.find((f) => f.conversation_id === conv.id) || null,
  }));

  return new Response(
    JSON.stringify({
      profile: profileRes.data,
      email: authRes.data.user?.email,
      conversations,
      inventory: inventoryRes.data || [],
      life_notes: notesRes.data || [],
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export const config: Config = {
  path: "/api/admin-client-get",
};
