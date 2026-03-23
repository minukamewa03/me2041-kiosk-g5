import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { member_rfid } = await req.json();
    if (!member_rfid) return new Response(JSON.stringify({ error: "Missing member_rfid" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: member } = await supabase.from("members").select("id").eq("rfid_tag", member_rfid).maybeSingle();
    
    if (!member) return new Response(JSON.stringify({ error: "Invalid member" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Check reservations
    const { data: reservation } = await supabase
      .from("reservations")
      .select("*, books(id, title, rfid_tag, slot_position)")
      .eq("member_id", member.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1)
      .maybeSingle();

    if (!reservation) {
      return new Response(
        JSON.stringify({ success: false, action: "REJECT", message: "No Reservations" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const targetBook = reservation.books;

    return new Response(
      JSON.stringify({
        success: true,
        action: "ROTATE_AND_DISPENSE",
        slot: targetBook.slot_position,
        book_title: targetBook.title,
        reservation_id: reservation.id,
        book_rfid: targetBook.rfid_tag
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
