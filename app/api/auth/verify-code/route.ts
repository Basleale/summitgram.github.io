import { type NextRequest, NextResponse } from "next/server"
import { verificationStore } from "@/lib/verification-store"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, code, password, name } = await request.json()

    if (!email || !code || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    const storedData = verificationStore.get(email)
    if (!storedData) {
      return NextResponse.json({ error: "Verification code not found or expired" }, { status: 400 })
    }

    if (storedData.code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000
    if (isExpired) {
      verificationStore.delete(email)
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 })
    }

    // Initialize client and check if configuration exists
    const supabase = createServerClient()
    if (!supabase) {
      console.error("Supabase configuration missing (URL or Service Role Key)")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        display_name: name,
        full_name: name,
      },
      email_confirm: true,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    verificationStore.delete(email)

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: data.user,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}