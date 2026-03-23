import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { member_rfid, book_rfid } = await req.json();

    if (!member_rfid || !book_rfid) {
      return new Response(
        JSON.stringify({ error: "member_rfid and book_rfid are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get member
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("rfid_tag", member_rfid)
      .maybeSingle();

    if (!member) {
      return new Response(JSON.stringify({ error: "Invalid member" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get book
    const { data: book } = await supabase
      .from("books")
      .select("id, title")
      .eq("rfid_tag", book_rfid)
      .maybeSingle();

    if (!book) {
      return new Response(JSON.stringify({ error: "Invalid book" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Check if book is reserved
    const { data: activeReservation } = await supabase
      .from("reservations")
      .select("*")
      .eq("book_id", book.id)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (activeReservation) {
      // If someone else reserved it
      if (activeReservation.member_id !== member.id) {
        return new Response(
          JSON.stringify({
            success: true,
            status: "on_hold",
            action: "KEEP_IN_LOCKER",
            message: "On Hold",
            book_id: book.id
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Check if book is currently borrowed by this member (for renewal/return)
    const { data: borrowedRecord } = await supabase
      .from("borrowed_books")
      .select("id")
      .eq("book_id", book.id)
      .eq("member_id", member.id)
      .maybeSingle();

    if (!borrowedRecord) {
       return new Response(
        JSON.stringify({
          success: true,
          status: "not_borrowed_by_you",
          action: "REJECT",
          message: "Not Yours"
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If we reach here, it's not reserved by someone else and the user is the one who borrowed it
    return new Response(
      JSON.stringify({
        success: true,
        status: "ask_action",
        action: "PROMPT_USER",
        message: "1:Return 2:Renew",
        book_id: book.id
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
