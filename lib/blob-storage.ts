import { put, del, list } from "@vercel/blob"

export interface MediaFile {
  id: string
  filename: string
  url: string
  type: string
  size: number
  userId: string
  userName: string
  tags: string[]
  likes: number
  comments: number
  views: number
  createdAt: string
}

export interface Comment {
  id: string
  mediaId: string
  userId: string
  userName: string
  content: string
  createdAt: string
}

export interface User {
  id: string
  name: string
  email: string
  profilePicture?: string
  createdAt: string
}

export interface Message {
  id: string
  senderId: string
  receiverId?: string
  roomName?: string
  content: string
  createdAt: string
  senderName: string
}

// Media file operations
export async function uploadMediaFile(file: File, userId: string, userName: string): Promise<MediaFile> {
  try {
    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Create media metadata
    const mediaFile: MediaFile = {
      id: crypto.randomUUID(),
      filename: file.name,
      url: blob.url,
      type: file.type,
      size: file.size,
      userId,
      userName,
      tags: [],
      likes: 0,
      comments: 0,
      views: 0,
      createdAt: new Date().toISOString(),
    }

    // Store metadata in blob storage as JSON
    await put(`media-metadata/${mediaFile.id}.json`, JSON.stringify(mediaFile), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return mediaFile
  } catch (error) {
    console.error("Error uploading media file:", error)
    throw new Error("Failed to upload media file")
  }
}

export async function getMediaFiles(): Promise<MediaFile[]> {
  try {
    const { blobs } = await list({
      prefix: "media-metadata/",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const mediaFiles: MediaFile[] = []

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const mediaFile = await response.json()
        mediaFiles.push(mediaFile)
      } catch (error) {
        console.error("Error fetching media file:", error)
      }
    }

    return mediaFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error getting media files:", error)
    return []
  }
}

export async function getMediaFile(id: string): Promise<MediaFile | null> {
  try {
    const response = await fetch(`https://blob.vercel-storage.com/media-metadata/${id}.json`)
    if (!response.ok) return null
    return await response.json()
  } catch (error) {
    console.error("Error getting media file:", error)
    return null
  }
}

export async function updateMediaFile(mediaFile: MediaFile): Promise<void> {
  try {
    await put(`media-metadata/${mediaFile.id}.json`, JSON.stringify(mediaFile), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  } catch (error) {
    console.error("Error updating media file:", error)
    throw new Error("Failed to update media file")
  }
}

export async function deleteMediaFile(id: string): Promise<void> {
  try {
    // Get media file to get the actual file URL
    const mediaFile = await getMediaFile(id)
    if (mediaFile) {
      // Delete the actual file
      await del(mediaFile.url, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
    }

    // Delete metadata
    await del(`media-metadata/${id}.json`, {
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
  } catch (error) {
    console.error("Error deleting media file:", error)
    throw new Error("Failed to delete media file")
  }
}

// Comment operations
export async function addComment(mediaId: string, userId: string, userName: string, content: string): Promise<Comment> {
  try {
    const comment: Comment = {
      id: crypto.randomUUID(),
      mediaId,
      userId,
      userName,
      content,
      createdAt: new Date().toISOString(),
    }

    await put(`comments/${comment.id}.json`, JSON.stringify(comment), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Update media file comment count
    const mediaFile = await getMediaFile(mediaId)
    if (mediaFile) {
      mediaFile.comments += 1
      await updateMediaFile(mediaFile)
    }

    return comment
  } catch (error) {
    console.error("Error adding comment:", error)
    throw new Error("Failed to add comment")
  }
}

export async function getComments(mediaId: string): Promise<Comment[]> {
  try {
    const { blobs } = await list({
      prefix: "comments/",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const comments: Comment[] = []

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const comment = await response.json()
        if (comment.mediaId === mediaId) {
          comments.push(comment)
        }
      } catch (error) {
        console.error("Error fetching comment:", error)
      }
    }

    return comments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error getting comments:", error)
    return []
  }
}

// User operations
export async function createUser(name: string, email: string, profilePicture?: string): Promise<User> {
  try {
    const user: User = {
      id: crypto.randomUUID(),
      name,
      email,
      profilePicture,
      createdAt: new Date().toISOString(),
    }

    await put(`users/${user.id}.json`, JSON.stringify(user), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return user
  } catch (error) {
    console.error("Error creating user:", error)
    throw new Error("Failed to create user")
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const { blobs } = await list({
      prefix: "users/",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const users: User[] = []

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const user = await response.json()
        users.push(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } catch (error) {
    console.error("Error getting users:", error)
    return []
  }
}

// Message operations
export async function sendMessage(
  senderId: string,
  senderName: string,
  content: string,
  receiverId?: string,
  roomName?: string,
): Promise<Message> {
  try {
    const message: Message = {
      id: crypto.randomUUID(),
      senderId,
      receiverId,
      roomName,
      content,
      createdAt: new Date().toISOString(),
      senderName,
    }

    const prefix = roomName
      ? `messages/public/${roomName}`
      : `messages/private/${[senderId, receiverId].sort().join("-")}`

    await put(`${prefix}/${message.id}.json`, JSON.stringify(message), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    return message
  } catch (error) {
    console.error("Error sending message:", error)
    throw new Error("Failed to send message")
  }
}

export async function getMessages(userId1?: string, userId2?: string, roomName?: string): Promise<Message[]> {
  try {
    const prefix = roomName
      ? `messages/public/${roomName}/`
      : `messages/private/${[userId1, userId2].sort().join("-")}/`

    const { blobs } = await list({
      prefix,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    const messages: Message[] = []

    for (const blob of blobs) {
      try {
        const response = await fetch(blob.url)
        const message = await response.json()
        messages.push(message)
      } catch (error) {
        console.error("Error fetching message:", error)
      }
    }

    return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } catch (error) {
    console.error("Error getting messages:", error)
    return []
  }
}
