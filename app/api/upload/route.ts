import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to ArrayBuffer to store in IndexedDB on the client side
    // In a full local setup, the client-side component should handle this
    // but we return a success signal for the UI to proceed with local save
    return NextResponse.json({ 
      success: true, 
      message: "Ready for local storage" 
    });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}