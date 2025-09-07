"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload } from "lucide-react"

interface UploadProgressProps {
  progress?: number | null
  filename?: string
  files?: { [key: string]: number }
}

export function UploadProgress({ progress, filename, files }: UploadProgressProps) {
  // Handle single file upload
  if (progress !== null && progress !== undefined && filename) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-slate-800 border-slate-700 w-80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="h-5 w-5 text-purple-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{filename}</p>
                <p className="text-xs text-slate-400">Uploading...</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-slate-400 mt-2 text-right">{Math.round(progress)}%</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Handle multiple files upload
  if (files && Object.keys(files).length > 0) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <Card className="bg-slate-800 border-slate-700 w-80">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Upload className="h-5 w-5 text-purple-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Uploading files...</p>
                <p className="text-xs text-slate-400">{Object.keys(files).length} file(s)</p>
              </div>
            </div>
            <div className="space-y-2">
              {Object.entries(files).map(([filename, progress]) => (
                <div key={filename}>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span className="truncate">{filename}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
