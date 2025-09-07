"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send, Mic, MicOff } from "lucide-react"
import { supabase, type User, type Message } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface ChatModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: User
  chatUser?: User
}

export function ChatModal({ isOpen, onClose, currentUser, chatUser }: ChatModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isRecording, setIsRecording] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (isOpen && chatUser) {
      loadMessages()
      // Set up real-time subscription
      const subscription = supabase
        .channel(`private-chat-${[currentUser.id, chatUser.id].sort().join("-")}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${currentUser.id}))`,
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
  }, [isOpen, chatUser, currentUser.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadMessages = async () => {
    if (!chatUser) return

    try {
      const { data, error } = await supabase
        .from("messages")
        .select(`
          *,
          sender:users!messages_sender_id_fkey(*),
          receiver:users!messages_receiver_id_fkey(*)
        `)
        .or(
          `and(sender_id.eq.${currentUser.id},receiver_id.eq.${chatUser.id}),and(sender_id.eq.${chatUser.id},receiver_id.eq.${currentUser.id})`,
        )
        .is("room_name", null)
        .order("created_at", { ascending: true })

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
    if (!chatUser) return

    setIsLoading(true)
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: currentUser.id,
        receiver_id: chatUser.id,
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

  if (!chatUser) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-lg h-[600px] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center space-x-3">
            <div className="relative">
              <Avatar className="h-10 w-10">
                <AvatarImage src={chatUser.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {chatUser.name?.charAt(0) || chatUser.email?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-slate-800 rounded-full" />
            </div>
            <div>
              <p className="font-medium">{chatUser.name || chatUser.email}</p>
              <p className="text-sm text-slate-400">Online</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-4">
            {messages.length > 0 ? (
              messages.map((message) => {
                const isOwn = message.sender_id === currentUser.id
                return (
                  <div key={message.id} className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
                    <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"}`}>
                      <div
                        className={`px-4 py-2 rounded-lg ${
                          isOwn ? "bg-purple-600 text-white" : "bg-slate-700 text-slate-100"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                      <div className={`mt-1 text-xs text-slate-400 ${isOwn ? "text-right" : "text-left"}`}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                    <div className={`${isOwn ? "order-1 mr-2" : "order-2 ml-2"}`}>
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={isOwn ? currentUser.avatar_url : chatUser.avatar_url} />
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {isOwn
                            ? currentUser.name?.charAt(0) || currentUser.email?.charAt(0)
                            : chatUser.name?.charAt(0) || chatUser.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No messages yet. Start the conversation!</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="flex-shrink-0 p-4 border-t border-slate-700">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
            />
            <Button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              variant={isRecording ? "destructive" : "outline"}
              size="icon"
              className="border-slate-600"
            >
              {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !newMessage.trim()}
              size="icon"
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
