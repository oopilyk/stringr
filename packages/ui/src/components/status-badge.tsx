import { cn, getStatusColor, formatStatusText } from "../lib/utils"
import type { RequestStatus } from "@rally-strings/types"

interface StatusBadgeProps {
  status: RequestStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
        getStatusColor(status),
        className
      )}
    >
      {formatStatusText(status)}
    </span>
  )
}
