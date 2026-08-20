'use client'

import React from 'react'
import { LabResult } from '@/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea } from 'recharts'

interface LabTrendProps {
  testName: string
  results: LabResult[]
}

export function LabTrend({ testName, results }: LabTrendProps) {
  // Sort by date ascending for chart
  const sorted = [...results].sort((a, b) => 
    new Date(a.test_date || '').getTime() - new Date(b.test_date || '').getTime()
  )

  const data = sorted.map(r => ({
    date: r.test_date ? new Date(r.test_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '',
    value: parseFloat(r.value),
    isAbnormal: r.is_abnormal
  }))

  // Extract reference range (assuming format "min-max" e.g., "70-99")
  let minRef = 0
  let maxRef = 100
  if (results[0]?.reference_range) {
    const parts = results[0].reference_range.split('-')
    if (parts.length === 2) {
      minRef = parseFloat(parts[0])
      maxRef = parseFloat(parts[1])
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border p-2 shadow-sm rounded-md text-xs">
          <p className="font-medium">{label}</p>
          <p className="text-primary">{payload[0].value} {results[0]?.unit}</p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.5} />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        
        {results[0]?.reference_range && (
          <ReferenceArea y1={minRef} y2={maxRef} fill="hsl(var(--primary))" fillOpacity={0.1} />
        )}
        
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={(props) => {
            const { cx, cy, payload } = props
            return (
              <circle 
                cx={cx} 
                cy={cy} 
                r={4} 
                fill={payload.isAbnormal ? "hsl(var(--destructive))" : "hsl(var(--background))"} 
                stroke={payload.isAbnormal ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                strokeWidth={2}
              />
            )
          }}
          activeDot={{ r: 6 }} 
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
