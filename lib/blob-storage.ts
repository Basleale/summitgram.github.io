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

  static async addComment(
    mediaId: string,
    userId: string,
    userName: string,