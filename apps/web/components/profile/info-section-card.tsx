'use client'

import { useState, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@stringr/ui'
import { Button } from '@stringr/ui'
import { ChevronDown, ChevronUp, Edit } from 'lucide-react'
import Link from 'next/link'

interface InfoSectionCardProps {
  title: string
  icon?: ReactNode
  editLink?: string
  collapsible?: boolean
  defaultOpen?: boolean
  children: ReactNode
}

export function InfoSectionCard({
  title,
  icon,
  editLink,
  collapsible = true,
  defaultOpen = true,
  children
}: InfoSectionCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {editLink && (
              <Link href={editLink}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </Link>
            )}
            {collapsible && (
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                {isOpen ? (
                  <ChevronUp className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-600" />
                )}
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          {children}
        </CardContent>
      )}
    </Card>
  )
}
