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
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Filter,
  RefreshCw,
  Heart,
} from "lucide-react";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
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
      <aside className="flex flex-col justify-between h-screen bg-card shadow-xl px-2 py-6 fixed left-0 top-0 z-40 w-64 border-r border-border">
        <div className="flex items-center justify-center h-full">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`flex flex-col justify-between h-screen bg-card shadow-xl px-2 py-6 fixed left-0 top-0 z-40 transition-all duration-300 border-r border-border ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <div>
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="text-2xl font-heading font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PeerUp
            </span>
          )}
        </div>
        <nav className="flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link href={link.href} key={link.href} legacyBehavior>
              <a
                className={`flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-300 hover:bg-primary/10 group ${
                  pathname === link.href 
                    ? "bg-primary/20 text-primary shadow-lg" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={link.tooltip}
              >
                <link.icon className="w-5 h-5" />
                {!collapsed && <span>{link.label}</span>}
                {!collapsed && (
                  <span className="ml-auto opacity-0 group-hover:opacity-100 text-xs text-muted-foreground transition-opacity">
                    {link.tooltip}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex flex-col items-center gap-3 mt-8 mb-2">
        {/* Collapse Toggle */}
        <div className="w-full px-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-all duration-300 shadow-sm"
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
            className="w-10 h-10 rounded-full border-2 border-primary object-cover mb-1 shadow-lg"
          />
          {!collapsed && (
            <div className="font-heading font-semibold text-foreground text-center">
              {user?.name || "User"}
            </div>
          )}
          {!collapsed && (
            <div className="text-xs text-muted-foreground mb-2 capitalize">
              {user?.role || "User"}
            </div>
          )}
          <button 
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-all duration-300 mt-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" /> 
            {!collapsed && "Log out"}
          </button>
        </div>
      </div>
    </aside>
  );
}
