import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return NextResponse.json({ error: "File and userId are required" }, { status: 400 })
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Save media metadata to Supabase
    const { data: media, error } = await supabase
      .from("media")
      .insert([
        {
          filename: file.name,
          url: blob.url,
          type: file.type,
          size: file.size,
          user_id: userId,
          tags: [],
          likes_count: 0,
          comments_count: 0,
          views_count: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to save media metadata" }, { status: 500 })
    }

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
