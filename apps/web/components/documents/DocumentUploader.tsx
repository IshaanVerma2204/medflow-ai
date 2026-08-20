'use client'

import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Card, CardContent } from '@/components/ui/card'
import { UploadCloud, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface DocumentUploaderProps {
  onUploadComplete: (file: File) => void
}

export function DocumentUploader({ onUploadComplete }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0])
      // Auto trigger upload in real app, or wait for button click
      onUploadComplete(acceptedFiles[0])
    }
  }, [onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize: 50 * 1024 * 1024,
    multiple: false
  })

  return (
    <Card>
      <CardContent className="p-6">
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-1">
            {isDragActive ? "Drop file here" : "Drag & drop medical documents here"}
          </p>
          <p className="text-sm text-muted-foreground">
            Supports PDF, JPG, PNG (Max 50MB)
          </p>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between p-3 bg-muted/50 rounded-md">
            <div className="flex items-center gap-3">
              <File className="h-5 w-5 text-blue-500" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setFile(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
