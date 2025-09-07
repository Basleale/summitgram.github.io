import { type NextRequest, NextResponse } from "next/server"
import { verificationStore } from "@/lib/verification-store"
import { createServerClient } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, code, password, name } = await request.json()

    if (!email || !code || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Get stored verification data
    const storedData = verificationStore.get(email)

    if (!storedData) {
      return NextResponse.json({ error: "Verification code not found or expired" }, { status: 400 })
    }

    // Check if code matches
    if (storedData.code !== code) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    // Check if code is expired (10 minutes)
    const isExpired = Date.now() - storedData.timestamp > 10 * 60 * 1000
    if (isExpired) {
      verificationStore.delete(email)
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 })
    }

    // Create Supabase user
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: {
        name,
        display_name: name,
        full_name: name,
      },
      email_confirm: true, // Skip email confirmation since we verified with our code
    })

    if (error) {
      console.error("Supabase user creation error:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Clean up verification code
    verificationStore.delete(email)

    return NextResponse.json({
      success: true,
      message: "Account created successfully",
      user: data.user,
    })
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 })
  }
}
