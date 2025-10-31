"use client"

import { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import FeedbackButton from '@/components/FeedbackButton'

export default function FeedbackButtonClient() {
  const pathname = usePathname()
  const screenName = useMemo(() => {
    if (!pathname) return 'Unknown'
    // Convert path to a readable screen identifier, e.g., /dashboard/chats -> "dashboard:chats"
    return pathname.replace(/^\/+/, '').replace(/\/+/, ':') || 'home'
  }, [pathname])

  return <FeedbackButton screenName={screenName} />
}


