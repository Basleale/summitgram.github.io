import { put, del, list } from "@vercel/blob";

export interface MediaFile {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
  userId: string;
  userName: string;
  tags: string[];
  likes: number;
  comments: number;
  views: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  mediaId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId?: string;
  roomName?: string;
  content: string;
  createdAt: string;
  senderName: string;
  type?: "text" | "voice";
  voiceUrl?: string;
  receiverName?: string;
}

export class BlobStorage {
  static async uploadMediaFile(
    file: File,
    userId: string,
    userName: string
  ): Promise<MediaFile> {
    try {
      // Upload file to Vercel Blob
      const blob = await put(file.name, file, {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

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
      };

      // Store metadata in blob storage as JSON
      await put(`media-metadata/${mediaFile.id}.json`, JSON.stringify(mediaFile), {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      return mediaFile;
    } catch (error) {
      console.error("Error uploading media file:", error);
      throw new Error("Failed to upload media file");
    }
  }

  static async getMediaFiles(): Promise<MediaFile[]> {
    try {
      const { blobs } = await list({
        prefix: "media-metadata/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const mediaFiles: MediaFile[] = [];

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          const mediaFile = await response.json();
          mediaFiles.push(mediaFile);
        } catch (error) {
          console.error("Error fetching media file:", error);
        }
      }

      return mediaFiles.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error getting media files:", error);
      return [];
    }
  }

  static async getMediaFile(id: string): Promise<MediaFile | null> {
    try {
      const response = await fetch(
        `https://blob.vercel-storage.com/media-metadata/${id}.json`
      );
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error("Error getting media file:", error);
      return null;
    }
  }

  static async updateMediaFile(mediaFile: MediaFile): Promise<void> {
    try {
      await put(`media-metadata/${mediaFile.id}.json`, JSON.stringify(mediaFile), {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.error("Error updating media file:", error);
      throw new Error("Failed to update media file");
    }
  }

  static async deleteMediaFile(id: string): Promise<void> {
    try {
      // Get media file to get the actual file URL
      const mediaFile = await this.getMediaFile(id);
      if (mediaFile) {
        // Delete the actual file
        await del(mediaFile.url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      }

      // Delete metadata
      await del(`media-metadata/${id}.json`, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.error("Error deleting media file:", error);
      throw new Error("Failed to delete media file");
    }
  }

  static async addComment({
    mediaId,
    userId,
    userName,
    content,
  }: {
    mediaId: string;
    userId: string;
    userName: string;
    content: string;
  }): Promise<Comment> {
    try {
      const comment: Comment = {
        id: crypto.randomUUID(),
        mediaId,
        userId,
        userName,
        content,
        createdAt: new Date().toISOString(),
      };

      await put(`comments/${comment.id}.json`, JSON.stringify(comment), {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      // Update media file comment count
      const mediaFile = await this.getMediaFile(mediaId);
      if (mediaFile) {
        mediaFile.comments += 1;
        await this.updateMediaFile(mediaFile);
      }

      return comment;
    } catch (error) {
      console.error("Error adding comment:", error);
      throw new Error("Failed to add comment");
    }
  }

  static async getComments(mediaId: string): Promise<Comment[]> {
    try {
      const { blobs } = await list({
        prefix: "comments/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      const comments: Comment[] = [];

      for (const blob of blobs) {
        try {
          const response = await fetch(blob.url);
          const comment = await response.json();
          if (comment.mediaId === mediaId) {
            comments.push(comment);
          }
        } catch (error) {
          console.error("Error fetching comment:", error);
        }
      }

      return comments.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error getting comments:", error);
      return [];
    }
  }
  static async getLikes(mediaId: string): Promise<any[]> {
    try {
      const { blobs } = await list({
        prefix: `likes/${mediaId}/`,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      return Promise.all(
        blobs.map(async (blob) => {
          const response = await fetch(blob.url);
          return response.json();
        })
      );
    } catch (error) {
      console.error("Error getting likes:", error);
      return [];
    }
  }

  static async addLike({
    mediaId,
    userId,
    userName,
  }: {
    mediaId: string;
    userId: string;
    userName: string;
  }): Promise<void> {
    try {
      await put(`likes/${mediaId}/${userId}.json`, JSON.stringify({ userId, userName }), {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.error("Error adding like:", error);
      throw new Error("Failed to add like");
    }
  }

  static async removeLike(mediaId: string, userId: string): Promise<void> {
    try {
      await del(`likes/${mediaId}/${userId}.json`, {
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (error) {
      console.error("Error removing like:", error);
      throw new Error("Failed to remove like");
    }
  }

  static async addUser(user: { name: string; email: string; passwordHash: string }): Promise<any> {
    const users = await this.getUsers();
    const newUser = {
      id: crypto.randomUUID(),
      ...user,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    await put("users.json", JSON.stringify(users), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return newUser;
  }

  static async getUsers(): Promise<any[]> {
    try {
      const { blobs } = await list({
        prefix: "users/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      if (blobs.length === 0) {
        return [];
      }
      const response = await fetch(blobs[0].url);
      return response.json();
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }
  static async getUserByEmail(email: string): Promise<any | null> {
    const users = await this.getUsers();
    return users.find((user) => user.email === email) || null;
  }

  static async addPrivateMessage(message: {
    voiceUrl?: string;
    senderId: string;
    senderName: string;
    receiverId: string;
    receiverName: string;
    type: "text" | "voice";
    content?: string;
  }): Promise<Message> {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      ...message,
      createdAt: new Date().toISOString(),
    };
    const conversationId = [message.senderId, message.receiverId].sort().join("-");
    await put(
      `messages/private/${conversationId}/${newMessage.id}.json`,
      JSON.stringify(newMessage),
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    );
    return newMessage;
  }

  static async getPrivateMessages(user1Id: string, user2Id: string): Promise<Message[]> {
    const conversationId = [user1Id, user2Id].sort().join("-");
    try {
      const { blobs } = await list({
        prefix: `messages/private/${conversationId}/`,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const messages = await Promise.all(
        blobs.map(async (blob) => {
          const response = await fetch(blob.url);
          return response.json();
        })
      );
      return messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error getting private messages:", error);
      return [];
    }
  }

  static async addPublicMessage(message: {
    voiceUrl?: string;
    senderId: string;
    senderName: string;
    type: "text" | "voice";
    content?: string;
  }): Promise<Message> {
    const newMessage: Message = {
      id: crypto.randomUUID(),
      ...message,
      createdAt: new Date().toISOString(),
    };
    await put(`messages/public/${newMessage.id}.json`, JSON.stringify(newMessage), {
      access: "public",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return newMessage;
  }

  static async getPublicMessages(): Promise<Message[]> {
    try {
      const { blobs } = await list({
        prefix: "messages/public/",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      const messages = await Promise.all(
        blobs.map(async (blob) => {
          const response = await fetch(blob.url);
          return response.json();
        })
      );
      return messages.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error) {
      console.error("Error getting public messages:", error);
      return [];
    }
  }
}