import * as React from "react"
import { Star, Clock, DollarSign, MapPin } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card"
import { Button } from "./ui/button"
import { cn, formatPrice, formatDuration, formatDistance } from "../lib/utils"
import type { StringerSearchResult } from "@rally-strings/types"

interface StringerCardProps {
  stringer: StringerSearchResult
  onSelect?: (stringer: StringerSearchResult) => void
  className?: string
}

export function StringerCard({ stringer, onSelect, className }: StringerCardProps) {
  const rating = stringer.rating?.avg_rating || 0
  const reviewCount = stringer.rating?.review_count || 0
  const settings = stringer.stringer_settings

  return (
    <Card className={cn("hover:shadow-md transition-shadow cursor-pointer", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-lg font-semibold text-primary">
                {stringer.full_name?.[0] || 'S'}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-lg">{stringer.full_name}</h3>
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{stringer.city}</span>
                {stringer.distance_km && (
                  <>
                    <span>•</span>
                    <span>{formatDistance(stringer.distance_km)}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {rating > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{rating.toFixed(1)}</span>
              <span className="text-muted-foreground">({reviewCount})</span>
            </div>
          )}
        </div>
        
        {stringer.bio && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {stringer.bio}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-sm font-medium">
              <DollarSign className="w-4 h-4" />
              <span>{formatPrice(settings.base_price_cents)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Base price</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-sm font-medium">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(settings.turnaround_hours)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Turnaround</p>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium">
              {settings.accepts_rush ? '⚡ Rush' : '📅 Standard'}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings.accepts_rush ? `+${formatPrice(settings.rush_fee_cents)}` : 'Only'}
            </p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => onSelect?.(stringer)}
          className="w-full"
        >
          Request Stringing
        </Button>
      </CardFooter>
    </Card>
  )
}
