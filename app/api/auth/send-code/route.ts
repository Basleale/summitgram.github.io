import { type NextRequest, NextResponse } from "next/server"
import { verificationStore } from "@/lib/verification-store"

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    // Generate a 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Store the verification code with user data
    verificationStore.set(email, {
      code,
      name,
      timestamp: Date.now(),
    })

    // In a real application, you would send this code via email
    // For demo purposes, we'll log it to the console
    console.log(`Verification code for ${email}: ${code}`)

    // Simulate email sending delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      // In development, include the code in the response for testing
      ...(process.env.NODE_ENV === "development" && { code }),
    })
  } catch (error) {
    console.error("Send code error:", error)
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 })
  }
}
