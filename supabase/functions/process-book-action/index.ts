import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { member_rfid, book_rfid, action } = await req.json();

    if (!member_rfid || !book_rfid || !action) {
      return new Response(JSON.stringify({ error: "Missing parameters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get member and book IDs
    const { data: member } = await supabase.from("members").select("id").eq("rfid_tag", member_rfid).maybeSingle();
    const { data: book } = await supabase.from("books").select("id").eq("rfid_tag", book_rfid).maybeSingle();

    if (!member || !book) {
      return new Response(JSON.stringify({ error: "Invalid member or book" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "renew") {
      // Create new due date (+14 days)
      const newDueDate = new Date();
      newDueDate.setDate(newDueDate.getDate() + 14);

      await supabase.from("books").update({ due_date: newDueDate.toISOString() }).eq("id", book.id);

      return new Response(
        JSON.stringify({ success: true, action: "OPEN_SERVO", message: "Take Book" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (action === "return") {
      // Remove from borrowed_books
      await supabase.from("borrowed_books").delete().eq("book_id", book.id).eq("member_id", member.id);
      
      // Update book status to available
      await supabase.from("books").update({ status: "available", due_date: null }).eq("id", book.id);

      return new Response(
        JSON.stringify({ success: true, action: "LOCK", message: "Returned" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
