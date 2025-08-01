"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sparkles, TrendingUp, Users, Calendar, Star, Bot, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/signin");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your chaos...</div>
      </div>
    );
  }

  // Profile completeness check
  const requiredFields = ["name", "role", "goals", "skills", "interests", "availability"];
  const incompleteFields = requiredFields.filter(
    (field) => !user?.[field] || (Array.isArray(user[field]) && user[field].length === 0)
  );
  const isProfileIncomplete = incompleteFields.length > 0;

  // Fake stats for demo
  const stats = [
    { label: "Matches", value: 3, icon: Users },
    { label: "Goals Tracked", value: 5, icon: TrendingUp },
    { label: "Sessions", value: 12, icon: Calendar },
    { label: "Achievements", value: 2, icon: Star },
    { label: "AI Chats", value: 7, icon: Bot },
    { label: "Streak", value: "4d", icon: TrendingUp },
  ];

  // Fake goal progress
  const goalProgress = 70; // percent
  const badge = goalProgress >= 80 ? "Crushing it!" : goalProgress >= 50 ? "Keep going!" : "Just getting started";

  return (
    <div className="w-full">
      {/* Profile Incomplete Warning */}
      {isProfileIncomplete && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-[#85BCB1] text-white">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5" />
            <span>Your profile is looking a little empty. Maybe fill it out before you start judging others?</span>
          </div>
          <div className="text-xs opacity-90">Missing: {incompleteFields.join(", ")}</div>
        </div>
      )}

      {/* Mentor Review Notice */}
      {user.role === "mentor" && user.status === "pending_review" && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-[#645990] text-white">
          Mentor application under review. Sit tight, we're deciding if you're cool enough.
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-[#645990] dark:text-[#85BCB1]">
          Hey {user?.name || "there"}, welcome to the chaos.
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-200">
          Here's your dashboard. Try not to break anything.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center bg-white dark:bg-[#23272f] rounded-xl p-4 shadow">
            <stat.icon className="w-6 h-6 mb-1 text-[#85BCB1] dark:text-[#645990]" />
            <div className="text-xl font-bold text-[#2C6485] dark:text-white">{stat.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-300">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Goal Tracker */}
      <div className="mb-8 bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="text-lg font-semibold mb-2">Goal Progress</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
              <div
                className="bg-gradient-to-r from-[#85BCB1] to-[#645990] h-4 rounded-full transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{goalProgress}% complete - {badge}</div>
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
        <div className="text-lg font-semibold mb-4">Your Profile</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><span className="font-medium">Name:</span> {user.name}</div>
          <div><span className="font-medium">Email:</span> {user.email}</div>
          <div><span className="font-medium">Role:</span> {user.role}</div>
          <div><span className="font-medium">Location:</span> {user.location || "-"}</div>
          <div><span className="font-medium">Skills:</span> {user.skills?.join(", ") || "-"}</div>
          <div><span className="font-medium">Interests:</span> {user.interests?.join(", ") || "-"}</div>
          <div><span className="font-medium">Goals:</span> {user.goals || "-"}</div>
          <div><span className="font-medium">Availability:</span> {user.availability?.join(", ") || "-"}</div>
        </div>
      </div>
    </div>
  );
}
