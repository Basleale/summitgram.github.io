import { type NextRequest, NextResponse } from "next/server"
import { getMediaFiles, getMediaFile, updateMediaFile, deleteMediaFile } from "@/lib/blob-storage"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const mediaFile = await getMediaFile(id)
      if (!mediaFile) {
        return NextResponse.json({ error: "Media file not found" }, { status: 404 })
      }
      return NextResponse.json(mediaFile)
    }

    const mediaFiles = await getMediaFiles()
    return NextResponse.json(mediaFiles)
  } catch (error) {
    console.error("Error fetching media:", error)
    return NextResponse.json({ error: "Failed to fetch media files" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const mediaFile = await request.json()
    await updateMediaFile(mediaFile)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating media:", error)
    return NextResponse.json({ error: "Failed to update media file" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Media ID is required" }, { status: 400 })
    }

    await deleteMediaFile(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting media:", error)
    return NextResponse.json({ error: "Failed to delete media file" }, { status: 500 })
  }
}
