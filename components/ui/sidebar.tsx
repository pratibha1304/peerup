"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Target,
  Users,
  GraduationCap,
  Calendar,
  MessageCircle,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Filter,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // Initialize dark mode state
    const theme = localStorage.getItem("theme");
    const isDark = theme === "dark" || (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(isDark);
    
    // Apply initial theme
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    setDark((d) => {
      const next = !d;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  };
  
  return [dark, toggle] as const;
}

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, toggleDark] = useDarkMode();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUser(userDoc.data());
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const getRoleBasedNavLinks = () => {
    const baseLinks = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: Home,
        tooltip: "Your home base for chaos and progress.",
      },
      {
        href: "/dashboard/goals",
        label: "Goals",
        icon: Target,
        tooltip: "🏁 Crush your goals, one meltdown at a time.",
      },
      {
        href: "/dashboard/schedule",
        label: "My Sessions",
        icon: Calendar,
        tooltip: "📆 All your check-ins and sessions in one place.",
      },
      {
        href: "/dashboard/chats",
        label: "Messages",
        icon: MessageCircle,
        tooltip: "💬 Slide into DMs. Responsibly.",
      },
      {
        href: "/dashboard/profile",
        label: "Profile",
        icon: User,
        tooltip: "👤 Edit your profile and switch roles.",
      },
      {
        href: "/dashboard/test",
        label: "Test",
        icon: User,
        tooltip: "🧪 Test backend connectivity.",
      },
      {
        href: "/dashboard/settings",
        label: "Settings",
        icon: Settings,
        tooltip: "⚙️ Tweak, toggle, personalize.",
      },
    ];

    if (user?.role === "buddy") {
      return [
        ...baseLinks.slice(0, 2), // Dashboard, Goals
        {
          href: "/dashboard/match",
          label: "Find Buddy",
          icon: Users,
          tooltip: "🔍 Find your accountability partner (or partner in crime).",
        },
        ...baseLinks.slice(2), // Sessions, Messages, Profile, Settings
      ];
    } else if (user?.role === "mentor") {
      return [
        ...baseLinks.slice(0, 2), // Dashboard, Goals
        {
          href: "/dashboard/mentor",
          label: "Find Mentee",
          icon: GraduationCap,
          tooltip: "🎓 Find mentees who need your guidance.",
        },
        ...baseLinks.slice(2), // Sessions, Messages, Profile, Settings
      ];
    } else {
      // mentee or default
      return [
        ...baseLinks.slice(0, 2), // Dashboard, Goals
        {
          href: "/dashboard/match",
          label: "Find Buddy",
          icon: Users,
          tooltip: "🔍 Find your accountability partner (or partner in crime).",
        },
        {
          href: "/dashboard/mentor",
          label: "Find Mentor",
          icon: GraduationCap,
          tooltip: "🎓 Get mentored by someone who actually gets it.",
        },
        ...baseLinks.slice(2), // Sessions, Messages, Profile, Settings
      ];
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const navLinks = getRoleBasedNavLinks();

  if (loading) {
    return (
      <aside className="flex flex-col justify-between h-screen bg-white dark:bg-[#23272f] shadow-xl px-2 py-6 fixed left-0 top-0 z-40 w-64">
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex flex-col justify-between h-screen bg-white dark:bg-[#23272f] shadow-xl px-2 py-6 fixed left-0 top-0 z-40 transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}
      style={{ borderRight: "2px solid #D3E9D3" }}
    >
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <img src="/placeholder-logo.png" alt="PeerUp" className="w-8 h-8 rounded-xl" />
          {!collapsed && <span className="text-2xl font-bold text-[#645990]">PeerUp</span>}
        </div>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.href} legacyBehavior>
              <a
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all hover:bg-[#D3E9D3] dark:hover:bg-[#2C6485]/20 group ${
                  pathname === link.href ? "bg-[#85BCB1]/20 text-[#2C6485] dark:bg-[#645990]/30 dark:text-white" : "text-gray-700 dark:text-gray-200"
                }`}
                title={link.tooltip}
              >
                <link.icon className="w-5 h-5" />
                {!collapsed && <span>{link.label}</span>}
                {!collapsed && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-gray-400 transition-opacity">
                    {link.tooltip}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col items-center gap-3 mt-8 mb-2">
        {/* Dark Mode Toggle */}
        <div className="w-full px-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D3E9D3] dark:bg-[#2C6485] text-[#645990] dark:text-white font-medium hover:bg-[#85BCB1]/30 dark:hover:bg-[#645990]/30 transition-colors duration-200 shadow-sm"
            onClick={toggleDark}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {!collapsed && <span className="text-sm font-medium">{dark ? "Light" : "Dark"}</span>}
          </button>
        </div>
        
        {/* Collapse Toggle */}
        <div className="w-full px-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#D3E9D3] dark:bg-[#2C6485] text-[#645990] dark:text-white font-medium hover:bg-[#85BCB1]/30 dark:hover:bg-[#645990]/30 transition-colors duration-200 shadow-sm"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-sm font-medium">Collapse</span>}
          </button>
        </div>
        <div className="flex flex-col items-center mt-4">
          <img
            src={user?.profilePicUrl || "/placeholder-user.jpg"}
            alt="User avatar"
            className="w-10 h-10 rounded-full border-2 border-[#85BCB1] object-cover mb-1"
          />
          {!collapsed && <div className="font-semibold text-[#2C6485] dark:text-white">{user?.name || "User"}</div>}
          {!collapsed && <div className="text-xs text-gray-500 dark:text-gray-300 mb-2">{user?.role || "User"}</div>}
          <button 
            className="flex items-center gap-2 px-2 py-1 rounded-lg bg-[#85BCB1]/20 text-[#645990] dark:bg-[#645990]/30 dark:text-white font-medium hover:bg-[#85BCB1]/40 transition mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> {!collapsed && "Log out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
