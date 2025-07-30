"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Sparkles, TrendingUp, Users, Calendar, Star, Bot, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError("");
      try {
        const user = auth.currentUser;
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) {
          setError("Profile not found.");
          setLoading(false);
          return;
        }
        setProfile(userDoc.data());
      } catch (e) {
        setError("Failed to fetch profile.");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your chaos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // Profile completeness check
  const requiredFields = ["name", "role", "goals", "skills", "interests", "availability"];
  const incompleteFields = requiredFields.filter(
    (field) => !profile?.[field] || (Array.isArray(profile[field]) && profile[field].length === 0)
  );
  const isProfileIncomplete = incompleteFields.length > 0;

  // Role-based stats
  const getStats = () => {
    const baseStats = [
      { label: "Matches", value: 3, icon: Users },
      { label: "Sessions", value: 2, icon: Calendar },
      { label: "Peer Rating", value: "4.8/5", icon: Star },
      { label: "Goals", value: profile?.goals ? 1 : 0, icon: TrendingUp },
    ];

    if (profile.role === "mentor") {
      return [
        ...baseStats,
        { label: "Mentees", value: 5, icon: Users },
        { label: "Earnings", value: "₹2,400", icon: TrendingUp },
      ];
    } else if (profile.role === "buddy") {
      return [
        ...baseStats,
        { label: "Buddies", value: 2, icon: Users },
      ];
    } else {
      return [
        ...baseStats,
        { label: "Mentors", value: 1, icon: Users },
      ];
    }
  };

  const stats = getStats();

  // Fake goal progress for demo
  const goalProgress = 60; // percent
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
      {profile.role === "mentor" && profile.status === "pending_review" && (
        <div className="mb-6 p-4 rounded-xl text-sm font-semibold bg-[#645990] text-white">
          Mentor application under review. Sit tight, we're deciding if you're cool enough.
        </div>
      )}

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-4xl font-extrabold mb-2 text-[#645990] dark:text-[#85BCB1]">
          Hey {profile?.name || "there"}, welcome to the chaos.
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
            <div className="text-lg font-semibold text-[#2C6485] dark:text-[#85BCB1] mb-2">Goal Progress</div>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div
                className="h-4 rounded-full bg-gradient-to-r from-[#85BCB1] to-[#645990] transition-all"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-200">{profile?.goals || "No goals set yet. Set one to get started!"}</div>
          </div>
          <div className="flex flex-col items-center">
            <Sparkles className="w-10 h-10 text-[#645990] dark:text-[#85BCB1] mb-2" />
            <span className="font-bold text-[#645990] dark:text-[#85BCB1] text-lg">{badge}</span>
          </div>
        </div>
      </div>

      {/* AI Roadmap Placeholder */}
      <div className="bg-white dark:bg-[#23272f] rounded-xl p-6 shadow">
        <div className="flex items-center gap-4">
          <Bot className="w-8 h-8 text-[#85BCB1] dark:text-[#645990]" />
          <div>
            <div className="font-semibold text-[#2C6485] dark:text-[#85BCB1] mb-1">AI Roadmap</div>
            <div className="text-gray-700 dark:text-gray-200 text-sm">
              Your personalized roadmap will appear here soon. (Gemini AI integration coming!)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
