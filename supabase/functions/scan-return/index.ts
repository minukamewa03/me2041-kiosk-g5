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

    // 1. Verify member by RFID
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("id, name, uni_id")
      .eq("rfid_tag", member_rfid)
      .maybeSingle();

    if (memberError || !member) {
      return new Response(
        JSON.stringify({ error: "Member not found for this RFID tag" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Find book by RFID
    const { data: book, error: bookError } = await supabase
      .from("books")
      .select("id, title, status")
      .eq("rfid_tag", book_rfid)
      .maybeSingle();

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: "Book not found for this RFID tag" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Verify this member has this book borrowed
    const { data: borrowRecord, error: borrowError } = await supabase
      .from("borrowed_books")
      .select("id")
      .eq("member_id", member.id)
      .eq("book_id", book.id)
      .maybeSingle();

    if (borrowError || !borrowRecord) {
      return new Response(
        JSON.stringify({ error: "This book is not borrowed by this member" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Remove from borrowed_books
    await supabase.from("borrowed_books").delete().eq("id", borrowRecord.id);

    // 5. Update book status to available
    await supabase
      .from("books")
      .update({ status: "available", due_date: null })
      .eq("id", book.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Book "${book.title}" returned by ${member.name} (${member.uni_id})`,
        book_id: book.id,
        member_id: member.id,
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
