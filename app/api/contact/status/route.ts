import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function PUT(req: Request) {

  const { id, status } = await req.json();

  const { error } = await supabaseServer
    .from("contact_messages")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}