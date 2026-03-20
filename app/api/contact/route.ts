import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, email, subject, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from("contact_messages")
      .insert([{ name, email, subject, message }]);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}