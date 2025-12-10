"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useDashboardStats } from "@/hooks/use-dashboard-stats";
import {
  Activity,
  AlertCircle,
  CalendarDays,
  MessageCircle,
  PhoneMissed,
  Target,
  Users,
} from "lucide-react";

const iconMap: Record<string, any> = {
  messages: MessageCircle,
  missedCalls: PhoneMissed,
  goals: Target,
  requests: Users,
  matches: Activity,
  sessions: CalendarDays,
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const stats = useDashboardStats(user);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-6 md:mb-8">
        <p className="text-xs md:text-sm uppercase tracking-wide text-muted-foreground">Welcome back</p>
        <h1 className="text-2xl md:text-4xl font-extrabold mb-1 text-[#645990] dark:text-[#85BCB1]">
          Hey {user.name || "there"}
        </h1>
        <p className="text-sm md:text-lg text-muted-foreground">
          Here's what needs your attention right now.
        </p>
      </div>

      {stats.alerts.length > 0 && (
        <div className="mb-6 space-y-3">
          {stats.alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex flex-col gap-2 rounded-xl border p-4 text-sm ${
                alert.severity === "warn"
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-500/10"
                  : "border-primary/40 bg-primary/5"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>{alert.message}</span>
              </div>
              {alert.actionHref && alert.actionLabel && (
                <Link
                  href={alert.actionHref}
                  className="text-xs font-semibold text-primary hover:underline w-fit"
                >
                  {alert.actionLabel}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4 mb-6 md:mb-8">
        {stats.cards.map((card) => {
          const Icon = iconMap[card.id] || Activity;
          return (
            <div
              key={card.id}
              className="rounded-xl md:rounded-2xl border bg-white/70 dark:bg-[#23272f] p-3 md:p-4 shadow-sm"
            >
              <div className="flex items-start justify-between mb-3 md:mb-6">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-xs uppercase tracking-wide text-muted-foreground md:truncate">
                    {card.label}
                  </p>
                  <div className="text-xl md:text-3xl font-bold mt-1 md:mt-2">{card.value}</div>
                </div>
                <div className="rounded-full bg-primary/10 p-1.5 md:p-2 text-primary flex-shrink-0 ml-2 flex items-center justify-center">
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                </div>
              </div>
              {card.helper && (
                <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">{card.helper}</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <div className="rounded-xl md:rounded-2xl border bg-white dark:bg-[#23272f] p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-muted-foreground">
                  Goal coverage
                </p>
                <h2 className="text-2xl font-semibold">{stats.goalSummary.goalPercent}%</h2>
              </div>
              <span className="text-sm text-muted-foreground">
                {stats.goalSummary.openTasks} open tasks
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
              <div
                className="bg-gradient-to-r from-[#85BCB1] to-[#645990] h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.goalSummary.goalPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tracking {stats.goalSummary.totalGoals} goal
              {stats.goalSummary.totalGoals === 1 ? "" : "s"} across partnerships.
            </p>
          </div>

          <div className="rounded-xl md:rounded-2xl border bg-white dark:bg-[#23272f] p-4 md:p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-semibold">Focus goals</h3>
              <Link
                href="/dashboard/match"
                className="text-sm font-medium text-primary hover:underline"
              >
                Manage matches
              </Link>
            </div>
            {stats.focusGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground">All active goals are on track.</p>
            ) : (
              <div className="space-y-3">
                {stats.focusGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-xl border p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <p className="font-medium">{goal.title}</p>
                      <p className="text-xs text-muted-foreground">{goal.taskSummary}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">{goal.percent}%</p>
                      <Link
                        href={`/dashboard/match/${goal.matchId}/goals`}
                        className="text-xs text-primary hover:underline"
                      >
                        View tasks
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 md:space-y-6">
          <div className="rounded-xl md:rounded-2xl border bg-white dark:bg-[#23272f] p-4 md:p-6 shadow-sm">
            <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4">Upcoming sessions</h3>
            {stats.upcomingSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No confirmed sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {stats.upcomingSessions.map((session) => (
                  <div key={session.id} className="rounded-xl border p-4 text-sm">
                    <p className="font-medium">
                      {new Date(session.confirmedTime?.toMillis() || 0).toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">
                      {session.requesterName} ↔ {session.receiverName}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl md:rounded-2xl border bg-white dark:bg-[#23272f] p-4 md:p-6 shadow-sm">
            <h3 className="text-base md:text-lg font-semibold mb-2">Match requests</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {stats.requests.incoming} incoming • {stats.requests.outgoing} outgoing
            </p>
            <Link
              href="/dashboard/match/requests"
              className="text-sm font-semibold text-primary hover:underline"
            >
              Review requests
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-xl md:rounded-2xl border bg-white dark:bg-[#23272f] p-4 md:p-6 shadow-sm">
        <div className="text-base md:text-lg font-semibold mb-3 md:mb-4">Your Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 text-xs md:text-sm">
          <div>
            <span className="font-medium">Name:</span> {user.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {user.email}
          </div>
          <div>
            <span className="font-medium">Role:</span> {user.role}
          </div>
          <div>
            <span className="font-medium">Location:</span> {user.location || "-"}
          </div>
          <div>
            <span className="font-medium">Skills:</span>{" "}
            {user.skills?.length ? user.skills.join(", ") : "-"}
          </div>
          <div>
            <span className="font-medium">Interests:</span>{" "}
            {user.interests?.length ? user.interests.join(", ") : "-"}
          </div>
          <div>
            <span className="font-medium">Goals:</span> {user.goals || "-"}
          </div>
          <div>
            <span className="font-medium">Availability:</span>{" "}
            {user.availability?.length ? user.availability.join(", ") : "-"}
          </div>
        </div>
      </div>
    </div>
  );
}
