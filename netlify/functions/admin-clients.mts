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

  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Get all auth users (includes email)
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  if (usersError) {
    return new Response(JSON.stringify({ error: usersError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get all profiles
  const { data: profiles } = await supabase.from("profiles").select("*");

  // Get conversation counts + last session per user
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  // Get completed session counts (conversations with post_session_forms)
  const { data: forms } = await supabase
    .from("post_session_forms")
    .select("conversation_id, user_id");

  const clients = users.map((user) => {
    const profile = profiles?.find((p) => p.id === user.id);
    const userConvs = conversations?.filter((c) => c.user_id === user.id) || [];
    const userFormConvIds = new Set(
      forms?.filter((f) => f.user_id === user.id).map((f) => f.conversation_id)
    );
    const completedCount = userConvs.filter((c) => userFormConvIds.has(c.id)).length;

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || null,
      key_tier: profile?.key_tier || "bronze",
      next_coaching_call: profile?.next_coaching_call || null,
      resources_url: profile?.resources_url || null,
      session_count: userConvs.length,
      completed_count: completedCount,
      last_session: userConvs[0]?.updated_at || null,
    };
  });

  return new Response(JSON.stringify({ clients }), {
    headers: { "Content-Type": "application/json" },
  });
}

export const config: Config = {
  path: "/api/admin-clients",
};
