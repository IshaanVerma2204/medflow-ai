'use client'

import React, { useState } from 'react'
import { AIFlag } from '@/types'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, Bot, FileText, Check, X } from 'lucide-react'

interface FlagCardProps {
  flag: AIFlag
  onApprove: (notes: string) => void
  onReject: (notes: string) => void
}

export function FlagCard({ flag, onApprove, onReject }: FlagCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')

  const severityColor = 
    flag.severity === 'high' ? 'destructive' : 
    flag.severity === 'medium' ? 'secondary' : 'outline'

  return (
    <Card className="border-l-4" style={{ borderLeftColor: flag.severity === 'high' ? 'var(--destructive)' : flag.severity === 'medium' ? 'var(--warning)' : 'var(--primary)' }}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={severityColor} className="uppercase text-[10px]">{flag.severity}</Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[10px]">
                <Bot className="h-3 w-3" /> {flag.agent_name}
              </Badge>
            </div>
            <CardTitle className="text-lg">{flag.title}</CardTitle>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground mb-1">AI Confidence</div>
            <div className="flex items-center gap-2">
              <Progress value={flag.confidence} className="w-24 h-2" />
              <span className="text-xs font-medium">{flag.confidence}%</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-foreground/90">{flag.description}</p>
        
        <div className="mt-4">
          <Button 
            variant="ghost" 
            size="sm" 
            className="px-0 h-auto text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="mr-1 h-4 w-4" /> : <ChevronDown className="mr-1 h-4 w-4" />}
            {expanded ? 'Hide Evidence' : 'Show Evidence'}
          </Button>
          
          {expanded && (
            <div className="mt-2 space-y-2">
              {flag.evidence.map((ev, i) => (
                <div key={i} className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex items-center gap-2 text-xs font-medium mb-1 text-primary">
                    <FileText className="h-3 w-3" />
                    {ev.source_document} {ev.page && `(Pg ${ev.page})`}
                  </div>
                  <div className="italic text-muted-foreground">"{ev.text}"</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {flag.status === 'pending' && (
        <CardFooter className="flex-col items-stretch gap-3 pt-0 border-t mt-4">
          <div className="pt-4">
            <Textarea 
              placeholder="Add clinical notes or rationale (optional)..."
              value={notes}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
              className="min-h-[80px] text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onReject(notes)}>
              <X className="mr-2 h-4 w-4" /> Reject
            </Button>
            <Button onClick={() => onApprove(notes)}>
              <Check className="mr-2 h-4 w-4" /> Approve & Update Record
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
}
