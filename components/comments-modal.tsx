"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Send, Loader2, MessageCircle, FileText } from "lucide-react"
import { supabase, type MediaFile, type User, type Comment } from "@/lib/supabase"

interface CommentsModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItem?: MediaFile
  currentUser: User
  onCommentAdded: () => void
}

export function CommentsModal({ isOpen, onClose, mediaItem, currentUser, onCommentAdded }: CommentsModalProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && mediaItem) {
      fetchComments()
    }
  }, [isOpen, mediaItem])

  const fetchComments = async () => {
    if (!mediaItem?.id) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          *,
          user:users(*)
        `)
        .eq("media_id", mediaItem.id)
        .order("created_at", { ascending: true })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUser || !mediaItem?.id) return

    setSubmitting(true)
    try {
      const { error } = await supabase.from("comments").insert([
        {
          media_id: mediaItem.id,
          user_id: currentUser.id,
          content: newComment.trim(),
        },
      ])

      if (error) throw error

      setNewComment("")
      await fetchComments()
      onCommentAdded()

      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error posting comment:", error)
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment(e)
    }
  }

  if (!mediaItem) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-400" />
            Comments ({comments.length})
          </DialogTitle>
        </DialogHeader>

        {/* Media Preview */}
        <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg mb-4">
          <div className="w-12 h-12 rounded overflow-hidden">
            {mediaItem.type.startsWith("image/") ? (
              <img
                src={mediaItem.url || "/placeholder.svg"}
                alt={mediaItem.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-slate-600 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
            )}
          </div>
          <div>
            <p className="font-medium text-sm">{mediaItem.filename}</p>
            <p className="text-slate-400 text-xs">by {mediaItem.user?.name || "Unknown"}</p>
          </div>
        </div>

        {/* Comments List */}
        <ScrollArea className="flex-1 max-h-96 mb-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No comments yet</p>
              <p className="text-sm">Be the first to comment!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={comment.user?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {comment.user?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-purple-400">{comment.user?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{new Date(comment.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 text-sm break-words">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Comment Input */}
        <form onSubmit={handleSubmitComment} className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Add a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              disabled={submitting}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || submitting}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
