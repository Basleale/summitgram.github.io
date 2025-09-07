"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, MicOff, Globe } from "lucide-react"
import { supabase, type User, type Message } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface PublicChatModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  roomName?: string
}

export function PublicChatModal({ isOpen, onClose, currentUser, roomName = "general" }: PublicChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen) {
      loadMessages()
      // Set up real-time subscription
      const subscription = supabase
        .channel(`public-chat-${roomName}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `room_name.eq.${roomName}`,
          },
          (payload) => {
            const newMessage = payload.new as Message
            setMessages((prev) => [...prev, newMessage])
          },
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isOpen, roomName])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*)
        `)
        .eq("room_name", roomName)
        .order("created_at", { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error("Error loading messages:", error)
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      })
    }
  }

  const sendMessage = async (content: string, type: "text" | "voice" = "text") => {
    if (!content.trim() && type === "text") return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        room_name: roomName,
        content,
        type,
      })

      if (error) throw error
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(newMessage)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-purple-400" />
            {roomName.charAt(0).toUpperCase() + roomName.slice(1)} Chat
          </DialogTitle>
        </DialogHeader>

        {/* Messages */}
        <ScrollArea className="flex-1 max-h-96 mb-4">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={message.sender?.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-600 text-white text-xs">
                      {message.sender?.name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-purple-400">{message.sender?.name || "Unknown"}</span>
                      <span className="text-xs text-slate-500">{formatTime(message.created_at)}</span>
                    </div>
                    <p className="text-slate-300 text-sm break-words">{message.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <Globe className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-purple-600 text-white text-xs">
              {currentUser?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              disabled={isLoading}
            />
            <Button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              size="sm"
              variant="outline"
              className={`border-slate-600 ${
                isRecording ? "text-red-400 border-red-400" : "text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isLoading}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
