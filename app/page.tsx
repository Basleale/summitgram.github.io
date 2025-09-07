"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Upload,
  LayoutGrid,
  List,
  Filter,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  Download,
  Tag,
  Settings,
  Bell,
  Home,
  Compass,
  MessageSquare,
  Users,
  FileText,
  ImageIcon,
  Video,
  Music,
  File,
  X,
  Plus,
  LogOut,
  Search,
} from "lucide-react"
import { CommentsModal } from "@/components/comments-modal"
import { TaggingModal } from "@/components/tagging-modal"
import { ProfileModal } from "@/components/profile-modal"
import { ChatModal } from "@/components/chat-modal"
import { PublicChatModal } from "@/components/public-chat-modal"
import { UserSearchModal } from "@/components/user-search-modal"
import { UploadProgress } from "@/components/upload-progress"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { supabase, type MediaFile, type User } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function MediaDashboard() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("recent")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadFilename, setUploadFilename] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)
  const [availableTags, setAvailableTags] = useState<string[]>([])

  // Modal states
  const [commentsModal, setCommentsModal] = useState<{ isOpen: boolean; mediaId: string }>({
    isOpen: false,
    mediaId: "",
  })
  const [taggingModal, setTaggingModal] = useState<{ isOpen: boolean; mediaId: string }>({ isOpen: false, mediaId: "" })
  const [profileModal, setProfileModal] = useState(false)
  const [chatModal, setChatModal] = useState<{ isOpen: boolean; userId: string; userName: string }>({
    isOpen: false,
    userId: "",
    userName: "",
  })
  const [publicChatModal, setPublicChatModal] = useState(false)
  const [userSearchModal, setUserSearchModal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [user, loading, router])

  // Fetch data on mount
  useEffect(() => {
    if (user) {
      fetchMediaFiles()
      fetchUsers()
    }
  }, [user])

  const fetchMediaFiles = async () => {
    try {
      const { data, error } = await supabase
        .from("media")
        .select(`
          *,
          user:users(*)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setMediaFiles(data || [])

      // Extract unique tags
      const tags = new Set<string>()
      data?.forEach((media) => {
        media.tags?.forEach((tag: string) => tags.add(tag))
      })
      setAvailableTags(Array.from(tags))
    } catch (error) {
      console.error("Error fetching media files:", error)
      toast({
        title: "Error",
        description: "Failed to load media files",
        variant: "destructive",
      })
    }
  }

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase.from("users").select("*").neq("id", user?.id)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const filteredMedia = mediaFiles.filter((file) => {
    const matchesSearch =
      file.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesTags = selectedTags.length === 0 || selectedTags.some((tag) => file.tags?.includes(tag))

    return matchesSearch && matchesTags
  })

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0 || !user) return

    const file = files[0]
    setIsUploading(true)
    setUploadProgress(0)
    setUploadFilename(file.name)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("userId", user.id)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev === null) return 10
          if (prev >= 90) return prev
          return prev + Math.random() * 20
        })
      }, 200)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (response.ok) {
        const result = await response.json()
        await fetchMediaFiles() // Refresh media files
        toast({
          title: "Upload successful",
          description: `${file.name} has been uploaded successfully.`,
        })
      } else {
        throw new Error("Upload failed")
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(null)
        setUploadFilename("")
      }, 1000)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
    if (type.startsWith("video/")) return <Video className="h-4 w-4" />
    if (type.startsWith("audio/")) return <Music className="h-4 w-4" />
    if (type.includes("pdf")) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleLike = async (mediaId: string) => {
    if (!user) return

    try {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from("likes")
        .select("id")
        .eq("media_id", mediaId)
        .eq("user_id", user.id)
        .single()

      if (existingLike) {
        // Unlike
        await supabase.from("likes").delete().eq("media_id", mediaId).eq("user_id", user.id)
      } else {
        // Like
        await supabase.from("likes").insert([{ media_id: mediaId, user_id: user.id }])
      }

      // Refresh media files to update counts
      await fetchMediaFiles()
    } catch (error) {
      console.error("Error toggling like:", error)
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      })
    }
  }

  const handleShare = (mediaId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/media/${mediaId}`)
    toast({
      title: "Link copied!",
      description: "Media link has been copied to clipboard.",
    })
  }

  const handleDownload = (file: MediaFile) => {
    const link = document.createElement("a")
    link.href = file.url
    link.download = file.filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Upload Progress */}
      {isUploading && <UploadProgress progress={uploadProgress} filename={uploadFilename} />}

      <div className="flex">
        {/* Sidebar */}
        <div
          className={`${sidebarCollapsed ? "w-16" : "w-64"} transition-all duration-300 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 shadow-lg`}
        >
          <div className="p-4">
            <div className="flex items-center gap-3 mb-8">
              <Image src="/eneskench-logo.svg" alt="Eneskench" width={32} height={32} className="rounded-lg" />
              {!sidebarCollapsed && (
                <div>
                  <h1 className="font-bold text-white">Eneskench</h1>
                  <p className="text-xs text-slate-400">Let's hang out</p>
                </div>
              )}
            </div>

            <nav className="space-y-2">
              <Button
                variant={activeTab === "recent" ? "default" : "ghost"}
                className={`w-full justify-start ${sidebarCollapsed ? "px-2" : ""} text-white hover:bg-slate-700`}
                onClick={() => setActiveTab("recent")}
              >
                <Home className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Recent</span>}
              </Button>
              <Button
                variant={activeTab === "discover" ? "default" : "ghost"}
                className={`w-full justify-start ${sidebarCollapsed ? "px-2" : ""} text-white hover:bg-slate-700`}
                onClick={() => setActiveTab("discover")}
              >
                <Compass className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Discover</span>}
              </Button>
              <Button
                variant={activeTab === "chat" ? "default" : "ghost"}
                className={`w-full justify-start ${sidebarCollapsed ? "px-2" : ""} text-white hover:bg-slate-700`}
                onClick={() => setActiveTab("chat")}
              >
                <MessageSquare className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Chat</span>}
              </Button>
              <Button
                variant={activeTab === "community" ? "default" : "ghost"}
                className={`w-full justify-start ${sidebarCollapsed ? "px-2" : ""} text-white hover:bg-slate-700`}
                onClick={() => setActiveTab("community")}
              >
                <Users className="h-4 w-4" />
                {!sidebarCollapsed && <span className="ml-2">Community</span>}
              </Button>
            </nav>

            {!sidebarCollapsed && (
              <div className="mt-8 pt-8 border-t border-slate-700">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-purple-600 text-white">
                      {user.name?.charAt(0) || user.email?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user.name || user.email}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white hover:bg-slate-700"
                    onClick={() => setProfileModal(true)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Profile
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start text-white hover:bg-slate-700">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white hover:bg-slate-700"
                    onClick={signOut}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <div className="bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="text-white hover:bg-slate-700"
                >
                  <List className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Search media files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-80 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
                  className="border-slate-600 text-white hover:bg-slate-700"
                >
                  {viewMode === "grid" ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
                </Button>
                <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" multiple />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <Button variant="ghost" size="sm" className="text-white hover:bg-slate-700">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-white">Filter by tags:</span>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTags([])}
                      className="text-xs text-slate-300 hover:text-white"
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer hover:bg-purple-600"
                      onClick={() => handleTagToggle(tag)}
                    >
                      {tag}
                      {selectedTags.includes(tag) && <X className="h-3 w-3 ml-1" />}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="recent" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Recent Media</h2>
                  <p className="text-slate-400">Your recently uploaded and accessed files</p>
                </div>

                {mediaFiles.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-12 text-center">
                      <ImageIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">No media files yet</h3>
                      <p className="text-slate-400 mb-6">Upload your first media file to get started</p>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Media
                      </Button>
                    </CardContent>
                  </Card>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMedia.map((file) => (
                      <Card
                        key={file.id}
                        className="group hover:shadow-lg transition-all duration-200 bg-slate-800/50 border-slate-700 backdrop-blur-sm"
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-slate-700 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.url || "/placeholder.svg"}
                                alt={file.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-slate-400">{getFileIcon(file.type)}</div>
                            )}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <div className="flex gap-2">
                                <Button size="sm" variant="secondary" onClick={() => handleDownload(file)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="secondary" onClick={() => handleShare(file.id)}>
                                  <Share2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-medium text-white truncate">{file.filename}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              {getFileIcon(file.type)}
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={file.user?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs bg-purple-600 text-white">
                                  {file.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{file.user?.name || "Unknown"}</span>
                              <span>•</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>

                            {file.tags && file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {file.tags.slice(0, 2).map((tag) => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {file.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-300">
                                    +{file.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <button
                                  className="flex items-center gap-1 hover:text-red-400 transition-colors"
                                  onClick={() => handleLike(file.id)}
                                >
                                  <Heart className="h-4 w-4" />
                                  <span>{file.likes_count || 0}</span>
                                </button>
                                <button
                                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                  onClick={() => setCommentsModal({ isOpen: true, mediaId: file.id })}
                                >
                                  <MessageCircle className="h-4 w-4" />
                                  <span>{file.comments_count || 0}</span>
                                </button>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{file.views_count || 0}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTaggingModal({ isOpen: true, mediaId: file.id })}
                                className="text-slate-400 hover:text-white"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredMedia.map((file) => (
                      <Card key={file.id} className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              {file.type.startsWith("image/") ? (
                                <img
                                  src={file.url || "/placeholder.svg"}
                                  alt={file.filename}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <div className="text-slate-400">{getFileIcon(file.type)}</div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white truncate">{file.filename}</h3>
                              <div className="flex items-center gap-4 text-sm text-slate-400 mt-1">
                                <span>{formatFileSize(file.size)}</span>
                                <div className="flex items-center gap-1">
                                  <Avatar className="h-4 w-4">
                                    <AvatarImage src={file.user?.avatar_url || "/placeholder.svg"} />
                                    <AvatarFallback className="text-xs bg-purple-600 text-white">
                                      {file.user?.name?.charAt(0) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{file.user?.name || "Unknown"}</span>
                                </div>
                                <span>{formatDate(file.created_at)}</span>
                              </div>
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {file.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-6 text-sm text-slate-400">
                              <button
                                className="flex items-center gap-1 hover:text-red-400 transition-colors"
                                onClick={() => handleLike(file.id)}
                              >
                                <Heart className="h-4 w-4" />
                                <span>{file.likes_count || 0}</span>
                              </button>
                              <button
                                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                                onClick={() => setCommentsModal({ isOpen: true, mediaId: file.id })}
                              >
                                <MessageCircle className="h-4 w-4" />
                                <span>{file.comments_count || 0}</span>
                              </button>
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                <span>{file.views_count || 0}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setTaggingModal({ isOpen: true, mediaId: file.id })}
                                className="text-slate-400 hover:text-white"
                              >
                                <Tag className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDownload(file)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleShare(file.id)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="discover" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Discover</h2>
                  <p className="text-slate-400">Explore trending and popular content from the community</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMedia
                    .slice()
                    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
                    .map((file) => (
                      <Card
                        key={file.id}
                        className="group hover:shadow-lg transition-all duration-200 bg-slate-800/50 border-slate-700 backdrop-blur-sm"
                      >
                        <CardContent className="p-4">
                          <div className="aspect-square bg-slate-700 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                            {file.type.startsWith("image/") ? (
                              <img
                                src={file.url || "/placeholder.svg"}
                                alt={file.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="text-slate-400">{getFileIcon(file.type)}</div>
                            )}
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">Popular</Badge>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <h3 className="font-medium text-white truncate">{file.filename}</h3>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={file.user?.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs bg-purple-600 text-white">
                                  {file.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span>{file.user?.name || "Unknown"}</span>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center gap-4 text-sm text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Heart className="h-4 w-4" />
                                  <span>{file.likes_count || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Eye className="h-4 w-4" />
                                  <span>{file.views_count || 0}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Messages</h2>
                  <p className="text-slate-400">Connect and chat with other users</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-white">Private Messages</h3>
                      <div className="space-y-3">
                        {users.length === 0 ? (
                          <p className="text-slate-400 text-center py-4">No other users found</p>
                        ) : (
                          users.map((chatUser) => (
                            <div
                              key={chatUser.id}
                              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-700/50 cursor-pointer transition-colors"
                              onClick={() =>
                                setChatModal({
                                  isOpen: true,
                                  userId: chatUser.id,
                                  userName: chatUser.name || chatUser.email,
                                })
                              }
                            >
                              <Avatar>
                                <AvatarImage src={chatUser.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback className="bg-purple-600 text-white">
                                  {chatUser.name?.charAt(0) || chatUser.email?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="font-medium text-white">{chatUser.name || chatUser.email}</p>
                                <p className="text-sm text-slate-400">Click to start chatting</p>
                              </div>
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          ))
                        )}
                      </div>
                      <Button
                        className="w-full mt-4 bg-transparent"
                        variant="outline"
                        onClick={() => setUserSearchModal(true)}
                        disabled={users.length === 0}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Find Users
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-4 text-white">Public Rooms</h3>
                      <div className="space-y-3">
                        <div
                          className="p-4 rounded-lg border border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors"
                          onClick={() => setPublicChatModal(true)}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">General Discussion</h4>
                            <Badge variant="secondary">Online</Badge>
                          </div>
                          <p className="text-sm text-slate-400">Open discussion for all community members</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">Creative Showcase</h4>
                            <Badge variant="secondary">Online</Badge>
                          </div>
                          <p className="text-sm text-slate-400">Share and discuss creative projects</p>
                        </div>
                        <div className="p-4 rounded-lg border border-slate-600 hover:bg-slate-700/50 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white">Tech Talk</h4>
                            <Badge variant="secondary">Online</Badge>
                          </div>
                          <p className="text-sm text-slate-400">Technology discussions and help</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="community" className="mt-0">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">Community</h2>
                  <p className="text-slate-400">Connect with other members and explore profiles</p>
                </div>
                {users.length === 0 ? (
                  <Card className="bg-slate-800/50 border-slate-700">
                    <CardContent className="p-12 text-center">
                      <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">No other users yet</h3>
                      <p className="text-slate-400">Invite friends to join Eneskench!</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {users.map((communityUser) => (
                      <Card
                        key={communityUser.id}
                        className="bg-slate-800/50 border-slate-700 hover:shadow-lg transition-all duration-200 backdrop-blur-sm"
                      >
                        <CardContent className="p-6 text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-4">
                            <AvatarImage src={communityUser.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="text-lg bg-purple-600 text-white">
                              {communityUser.name?.charAt(0) || communityUser.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <h3 className="font-semibold text-white mb-1">{communityUser.name || communityUser.email}</h3>
                          <p className="text-sm text-slate-400 mb-4">{communityUser.email}</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                              onClick={() =>
                                setChatModal({
                                  isOpen: true,
                                  userId: communityUser.id,
                                  userName: communityUser.name || communityUser.email,
                                })
                              }
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
                              Chat
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CommentsModal
        isOpen={commentsModal.isOpen}
        onClose={() => setCommentsModal({ isOpen: false, mediaId: "" })}
        mediaItem={mediaFiles.find((m) => m.id === commentsModal.mediaId)}
        currentUser={user}
        onCommentAdded={fetchMediaFiles}
      />

      <TaggingModal
        isOpen={taggingModal.isOpen}
        onClose={() => setTaggingModal({ isOpen: false, mediaId: "" })}
        mediaItem={mediaFiles.find((m) => m.id === taggingModal.mediaId)}
        onTagsUpdate={fetchMediaFiles}
      />

      <ProfileModal
        isOpen={profileModal}
        onClose={() => setProfileModal(false)}
        user={user}
        onUpdate={(updatedUser) => {
          // Update local user state if needed
          fetchUsers()
        }}
      />

      <ChatModal
        isOpen={chatModal.isOpen}
        onClose={() => setChatModal({ isOpen: false, userId: "", userName: "" })}
        currentUser={user}
        chatUser={users.find((u) => u.id === chatModal.userId)}
      />

      <PublicChatModal isOpen={publicChatModal} onClose={() => setPublicChatModal(false)} currentUser={user} />

      <UserSearchModal
        isOpen={userSearchModal}
        onClose={() => setUserSearchModal(false)}
        users={users}
        onUserSelect={(selectedUser) => {
          setChatModal({ isOpen: true, userId: selectedUser.id, userName: selectedUser.name || selectedUser.email })
          setUserSearchModal(false)
        }}
      />
    </div>
  )
}
