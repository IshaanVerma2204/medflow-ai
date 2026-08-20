import React from 'react'
import { Medication } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, Calendar } from 'lucide-react'

export function MedicationCard({ medication }: { medication: Medication }) {
  return (
    <Card className="overflow-hidden">
      <div className={`h-1 w-full ${medication.is_current ? 'bg-primary' : 'bg-muted'}`} />
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-bold text-lg leading-tight">{medication.name}</h4>
          <Badge variant={medication.is_current ? "default" : "secondary"}>
            {medication.is_current ? 'Active' : 'Past'}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {medication.dosage && <Badge variant="outline" className="bg-muted/50">{medication.dosage}</Badge>}
          {medication.frequency && <Badge variant="outline" className="bg-muted/50">{medication.frequency}</Badge>}
          {medication.route && <Badge variant="outline" className="bg-muted/50">{medication.route}</Badge>}
        </div>

        <div className="space-y-1 text-xs text-muted-foreground mt-4">
          {medication.prescriber && (
            <div className="flex justify-between">
              <span>Prescriber:</span>
              <span className="font-medium text-foreground">{medication.prescriber}</span>
            </div>
          )}
          {medication.start_date && (
            <div className="flex justify-between">
              <span>Started:</span>
              <span className="font-medium text-foreground">{new Date(medication.start_date).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
          <span className="flex items-center text-blue-500 hover:underline cursor-pointer">
            <FileText className="h-3 w-3 mr-1" /> Source Document
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
