"use client"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Camera, Save, X, Loader2 } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import type { User } from "@/lib/supabase"
import { put } from "@vercel/blob"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: User
  onUpdate: (user: User) => void
}

export function ProfileModal({ isOpen, onClose, user, onUpdate }: ProfileModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    avatar_url: user.avatar_url || "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { updateProfile } = useAuth()

  const handleSave = async () => {
    setIsLoading(true)
    try {
      await updateProfile({
        name: profileData.name,
        avatar_url: profileData.avatar_url,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
      onClose()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    setIsLoading(true)
    try {
      // Upload to Vercel Blob
      const blob = await put(`avatars/${user.id}-${Date.now()}.${file.name.split(".").pop()}`, file, {
        access: "public",
        token: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || process.env.BLOB_READ_WRITE_TOKEN,
      })

      setProfileData((prev) => ({ ...prev, avatar_url: blob.url }))

      toast({
        title: "Avatar uploaded",
        description: "Your profile picture has been uploaded successfully",
      })
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-600 text-white text-2xl">
                  {profileData.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full bg-purple-600 hover:bg-purple-700 p-2"
                disabled={isLoading}
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleAvatarUpload(file)
              }}
              className="hidden"
            />
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Display Name
              </Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-slate-700/50 border-slate-600 text-white"
                placeholder="Enter display name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                value={profileData.email}
                disabled
                className="bg-slate-700/30 border-slate-600 text-slate-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
