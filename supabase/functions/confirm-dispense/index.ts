import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { reservation_id, book_rfid } = await req.json();
    if (!reservation_id) return new Response(JSON.stringify({ error: "Missing reservation_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get reservation
    const { data: reservation } = await supabase.from("reservations").select("*").eq("id", reservation_id).maybeSingle();
    
    if (!reservation) {
       return new Response(JSON.stringify({ error: "Reservation not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert into borrowed_books
    await supabase.from("borrowed_books").insert({
      member_id: reservation.member_id,
      book_id: reservation.book_id
    });

    // Delete reservation
    await supabase.from("reservations").delete().eq("id", reservation.id);

    // Update book status
    await supabase.from("books").update({ status: "borrowed" }).eq("id", reservation.book_id);

    return new Response(
      JSON.stringify({ success: true, action: "DONE", message: "Enjoy your book" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
