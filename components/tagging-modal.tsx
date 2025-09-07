"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Tag, X, Plus } from "lucide-react"
import { supabase, type MediaFile } from "@/lib/supabase"

interface TaggingModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItem?: MediaFile
  onTagsUpdate: () => void
}

export function TaggingModal({ isOpen, onClose, mediaItem, onTagsUpdate }: TaggingModalProps) {
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (mediaItem) {
      setTags(mediaItem.tags || [])
    }
  }, [mediaItem])

  const handleAddTag = () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return

    setTags([...tags, newTag.trim()])
    setNewTag("")
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleSave = async () => {
    if (!mediaItem) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("media").update({ tags }).eq("id", mediaItem.id)

      if (error) throw error

      onTagsUpdate()
      toast({
        title: "Tags updated",
        description: "Media tags have been updated successfully",
      })
      onClose()
    } catch (error) {
      console.error("Error updating tags:", error)
      toast({
        title: "Error",
        description: "Failed to update tags",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (!mediaItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-purple-400" />
            Tag Media
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
            <div className="w-12 h-12 rounded overflow-hidden">
              {mediaItem.type.startsWith("image/") ? (
                <img
                  src={mediaItem.url || "/placeholder.svg"}
                  alt={mediaItem.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-slate-400" />
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm">{mediaItem.filename}</p>
              <p className="text-slate-400 text-xs">Add tags to organize your media</p>
            </div>
          </div>

          {/* Add Tag Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add a tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
            <Button
              onClick={handleAddTag}
              disabled={!newTag.trim() || tags.includes(newTag.trim())}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Tags */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-300">Current Tags ({tags.length})</p>
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-slate-400 text-sm">No tags added yet</p>
              ) : (
                tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 bg-purple-600/20 text-purple-300 border-purple-600/30"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))
              )}
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
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Tags"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
