import { useEffect, useMemo, useState } from 'react'
import { Chat, listenToUserChats } from '@/lib/chat'
import { listenIncomingRequests, listenOutgoingRequests, MatchRequest } from '@/lib/matchRequests'
import { listenToUserMatches, UserMatch } from '@/lib/matches'
import { Goal, listenToGoals } from '@/lib/goals'
import { listenToConfirmedSchedules, ScheduleRequest } from '@/lib/scheduling'
import { db } from '@/lib/firebase'
import { collection, onSnapshot, query, where, FirestoreError } from 'firebase/firestore'

type Alert = {
  id: string
  message: string
  severity: 'info' | 'warn'
  actionLabel?: string
  actionHref?: string
}

type StatCard = {
  id: string
  label: string
  value: string
  helper?: string
  tone?: 'muted' | 'info' | 'warn' | 'success'
}

type FocusGoal = {
  id: string
  matchId: string
  title: string
  percent: number
  taskSummary: string
}

type DashboardStats = {
  loading: boolean
  cards: StatCard[]
  alerts: Alert[]
  focusGoals: FocusGoal[]
  upcomingSessions: ScheduleRequest[]
  requests: {
    incoming: number
    outgoing: number
  }
  profileGaps: string[]
  goalSummary: {
    totalGoals: number
    goalPercent: number
    openTasks: number
  }
}

type HydrationState = {
  chats: boolean
  requests: boolean
  matches: boolean
  calls: boolean
  schedules: boolean
}

const initialHydration: HydrationState = {
  chats: false,
  requests: false,
  matches: false,
  calls: false,
  schedules: false,
}

export function useDashboardStats(user: any | null): DashboardStats {
  const userId = user?.uid
  const [chats, setChats] = useState<Chat[]>([])
  const [incomingRequests, setIncomingRequests] = useState<MatchRequest[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<MatchRequest[]>([])
  const [matches, setMatches] = useState<UserMatch[]>([])
  const [goalsByMatch, setGoalsByMatch] = useState<Record<string, Goal[]>>({})
  const [schedules, setSchedules] = useState<ScheduleRequest[]>([])
  const [missedCalls, setMissedCalls] = useState(0)
  const [hydration, setHydration] = useState<HydrationState>(initialHydration)

  // Reset hydration when user changes
  useEffect(() => {
    setHydration(initialHydration)
    setGoalsByMatch({})
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const unsub = listenToUserChats(userId, (list) => {
      setChats(list)
      setHydration((prev) => ({ ...prev, chats: true }))
    })
    return () => unsub()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const unsubIn = listenIncomingRequests(userId, (reqs) => {
      setIncomingRequests(reqs)
      setHydration((prev) => ({ ...prev, requests: true }))
    })
    const unsubOut = listenOutgoingRequests(userId, setOutgoingRequests)
    return () => {
      unsubIn()
      unsubOut()
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const unsub = listenToUserMatches(userId, (list) => {
      setMatches(list)
      setHydration((prev) => ({ ...prev, matches: true }))
    })
    return () => unsub()
  }, [userId])

  useEffect(() => {
    if (!userId || matches.length === 0) {
      setGoalsByMatch((prev) => {
        if (Object.keys(prev).length === 0) return prev
        return {}
      })
      return
    }

    const unsubs = matches.map((match) =>
      listenToGoals(match.id, (goals) => {
        setGoalsByMatch((prev) => ({ ...prev, [match.id]: goals }))
      })
    )

    return () => {
      unsubs.forEach((unsub) => unsub())
    }
  }, [matches, userId])

  useEffect(() => {
    if (!userId) return
    const unsub = listenToConfirmedSchedules(userId, (list) => {
      setSchedules(list)
      setHydration((prev) => ({ ...prev, schedules: true }))
    })
    return () => unsub()
  }, [userId])

  useEffect(() => {
    if (!userId) return
    const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000

    const missedCallsQuery = query(
      collection(db, 'callLogs'),
      where('participants', 'array-contains', userId)
    )

    const unsub = onSnapshot(
      missedCallsQuery, 
      (snapshot) => {
        const count = snapshot.docs.filter((docSnap) => {
          const data = docSnap.data() as any
          const createdAt = data.createdAt?.toMillis?.() || 0
          return data.status === 'missed' && createdAt >= sevenDaysAgoMs
        }).length
        setMissedCalls(count)
        setHydration((prev) => ({ ...prev, calls: true }))
      },
      (error) => {
        if ((error as FirestoreError)?.code === 'permission-denied') {
          console.warn('Missed call stats are unavailable due to Firestore permissions.')
          setMissedCalls(0)
        } else {
          console.error('Error fetching missed calls:', error)
        }
        setHydration((prev) => ({ ...prev, calls: true }))
      }
    )

    return () => unsub()
  }, [userId])

  const pendingIncoming = useMemo(
    () => incomingRequests.filter((req) => req.status === 'pending'),
    [incomingRequests]
  )
  const pendingOutgoing = useMemo(
    () => outgoingRequests.filter((req) => req.status === 'pending'),
    [outgoingRequests]
  )

  const totalGoals = useMemo(
    () => Object.values(goalsByMatch).reduce((sum, matchGoals) => sum + matchGoals.length, 0),
    [goalsByMatch]
  )

  const goalTotals = useMemo(() => {
    const allGoals = Object.entries(goalsByMatch).flatMap(([matchId, list]) =>
      list.map((goal) => ({
        ...goal,
        matchId,
        percent:
          goal.taskCount > 0
            ? Math.round((goal.completedTaskCount / goal.taskCount) * 100)
            : goal.status === 'completed'
              ? 100
              : 0,
      }))
    )

    const totalTasks = allGoals.reduce((sum, goal) => sum + (goal.taskCount || 0), 0)
    const totalCompleted = allGoals.reduce(
      (sum, goal) => sum + (goal.completedTaskCount || 0),
      0
    )
    const openTasks = Math.max(totalTasks - totalCompleted, 0)

    const focusGoals: FocusGoal[] = allGoals
      .filter((goal) => goal.status !== 'completed')
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 3)
      .map((goal) => ({
        id: goal.id,
        matchId: goal.matchId,
        title: goal.title,
        percent: goal.percent,
        taskSummary: `${goal.completedTaskCount}/${goal.taskCount} tasks`,
      }))

    return {
      totalGoals: allGoals.length,
      totalTasks,
      totalCompleted,
      openTasks,
      focusGoals,
    }
  }, [goalsByMatch])

  const newReplies = useMemo(() => {
    if (!userId) return 0
    return chats.filter(
      (chat) => chat.lastMessageSenderId && chat.lastMessageSenderId !== userId
    ).length
  }, [chats, userId])

  const activeChats = chats.length
  const activeMatches = matches.length
  const alerts: Alert[] = []

  const requiredFields = ['name', 'role', 'goals', 'skills', 'interests', 'availability']
  const profileGaps = requiredFields.filter((field) => {
    const value = user?.[field]
    if (Array.isArray(value)) {
      return value.length === 0
    }
    return !value
  })
  if (profileGaps.length > 0) {
    alerts.push({
      id: 'profile',
      message: `Complete your profile: ${profileGaps.join(', ')}`,
      severity: 'warn',
      actionLabel: 'Edit profile',
      actionHref: '/dashboard/profile',
    })
  }

  if (user?.role === 'mentor' && user?.status === 'pending_review') {
    alerts.push({
      id: 'mentor-review',
      message: 'Mentor application still under review.',
      severity: 'info',
    })
  }

  if (missedCalls > 0) {
    alerts.push({
      id: 'missed-calls',
      message: `You missed ${missedCalls} call${missedCalls > 1 ? 's' : ''} this week`,
      severity: 'warn',
      actionLabel: 'Call log',
      actionHref: '/call',
    })
  }

  if (pendingIncoming.length > 0) {
    alerts.push({
      id: 'match-requests',
      message: `${pendingIncoming.length} incoming request${
        pendingIncoming.length > 1 ? 's' : ''
      } waiting`,
      severity: 'info',
      actionLabel: 'Review',
      actionHref: '/dashboard/match/requests',
    })
  }

  const upcomingSessions = useMemo(() => {
    const now = Date.now()
    return schedules
      .filter((session) => (session.confirmedTime?.toMillis() || 0) > now)
      .sort((a, b) => (a.confirmedTime?.toMillis() || 0) - (b.confirmedTime?.toMillis() || 0))
      .slice(0, 3)
  }, [schedules])

  const cards: StatCard[] = [
    {
      id: 'messages',
      label: 'New replies',
      value: newReplies > 99 ? '99+' : newReplies.toString(),
      helper: `${activeChats} active chats`,
      tone: newReplies > 0 ? 'warn' : 'muted',
    },
    {
      id: 'missedCalls',
      label: 'Missed calls',
      value: missedCalls.toString(),
      helper: 'past 7 days',
      tone: missedCalls > 0 ? 'warn' : 'info',
    },
    {
      id: 'goals',
      label: 'Goal progress',
      value:
        goalTotals.totalTasks > 0
          ? `${Math.round((goalTotals.totalCompleted / goalTotals.totalTasks) * 100)}%`
          : totalGoals > 0
            ? `${Math.round(
                (Object.values(goalsByMatch)
                  .flat()
                  .filter((g) => g.status === 'completed').length /
                  totalGoals) *
                  100
              )}%`
            : '—',
      helper: `${goalTotals.openTasks} tasks open`,
      tone: goalTotals.openTasks === 0 && goalTotals.totalTasks > 0 ? 'success' : 'info',
    },
    {
      id: 'requests',
      label: 'Pending requests',
      value: (pendingIncoming.length + pendingOutgoing.length).toString(),
      helper: `${pendingIncoming.length} incoming • ${pendingOutgoing.length} outgoing`,
      tone: pendingIncoming.length > 0 ? 'warn' : 'info',
    },
    {
      id: 'matches',
      label: 'Active partnerships',
      value: activeMatches.toString(),
      helper: `${matches.filter((m) => m.matchType === 'mentor').length} mentor • ${
        matches.filter((m) => m.matchType === 'buddy').length
      } buddy`,
      tone: 'info',
    },
    {
      id: 'sessions',
      label: 'Upcoming sessions',
      value: upcomingSessions.length.toString(),
      helper: upcomingSessions[0]
        ? `Next on ${upcomingSessions[0].confirmedTime
            ?.toDate()
            .toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
        : 'Nothing scheduled',
      tone: upcomingSessions.length ? 'info' : 'muted',
    },
  ]

  const allHydrated = Object.values(hydration).every(Boolean)
  const loading = !!userId && !allHydrated

  return {
    loading,
    cards,
    alerts,
    focusGoals: goalTotals.focusGoals,
    upcomingSessions,
    requests: {
      incoming: pendingIncoming.length,
      outgoing: pendingOutgoing.length,
    },
    profileGaps,
    goalSummary: {
      totalGoals,
      goalPercent:
        goalTotals.totalTasks > 0
          ? Math.round((goalTotals.totalCompleted / goalTotals.totalTasks) * 100)
          : 0,
      openTasks: goalTotals.openTasks,
    },
  }
}

