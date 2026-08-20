'use client'

import React from 'react'
import { SourceRef } from '@/types'
import { X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EvidenceDrawerProps {
  isOpen: boolean
  onClose: () => void
  sources: SourceRef[]
}

export function EvidenceDrawer({ isOpen, onClose, sources }: EvidenceDrawerProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-96 bg-background shadow-xl z-50 border-l transform transition-transform duration-300">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Source Evidence</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-4 overflow-y-auto h-[calc(100vh-65px)]">
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">No specific evidence linked.</p>
          ) : (
            <div className="space-y-6">
              {sources.map((src, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <FileText className="h-4 w-4" />
                    {src.document_name}
                    {src.page && <span className="text-muted-foreground ml-2">(Page {src.page})</span>}
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-md border text-sm italic">
                    "{src.excerpt}"
                  </div>
                  
                  <Button variant="link" className="px-0 h-auto text-xs">View full document</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
