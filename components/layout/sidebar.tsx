"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import {
  LayoutDashboard,
  PenSquare,
  Megaphone,
  Calendar,
  Settings,
  CreditCard,
  Menu,
  X,
  LogOut,
  BarChart3,
  MessageSquare,
  Linkedin,
  Check,
} from "lucide-react";

const navigationGroups = [
  {
    label: "Overview",
    items: [
      { name: "Workspace", href: "/app", icon: LayoutDashboard },
      { name: "Dashboard", href: "/app/dashboard", icon: BarChart3 },
    ],
  },
  {
    label: "Content",
    items: [
      { name: "Create New Post", href: "/app/create", icon: PenSquare },
      { name: "Campaigns", href: "/app/campaigns", icon: Megaphone },
      { name: "Calendar View", href: "/app/calendar", icon: Calendar },
    ],
  },
  {
    label: "Manage",
    items: [
      { name: "Feedback", href: "/app/feedback", icon: MessageSquare },
      { name: "Settings", href: "/app/settings", icon: Settings },
      { name: "Billing", href: "/app/billing", icon: CreditCard },
    ],
  },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [linkedInConnected, setLinkedInConnected] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const checkLinkedInConnection = async () => {
      if (!user) return;

      try {
        const db = getFirestore();
        const linkedInRef = doc(db, 'users', user.uid, 'integrations', 'linkedin');
        const linkedInDoc = await getDoc(linkedInRef);

        setLinkedInConnected(linkedInDoc.exists());
      } catch (error) {
        console.error("Error checking LinkedIn connection:", error);
      }
    };

    checkLinkedInConnection();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user) return "U";
    if (user.displayName) {
      return user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 lg:hidden rounded-md bg-white p-2 text-secondary shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-sidebar flex-col border-r border-secondary/20 bg-white transition-transform duration-300",
          "lg:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b border-secondary/20">
          <Link href="/" className="text-2xl font-heading font-bold text-primary">
            Storyscale
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2">
          <div className="space-y-2">
            {navigationGroups.map((group, groupIndex) => (
              <div key={group.label}>
                {groupIndex > 0 && (
                  <div className="border-t border-secondary/10 my-2" />
                )}
                <div className="px-2 mb-1">
                  <span className="text-[11px] font-semibold text-secondary/40 uppercase tracking-wide">
                    {group.label}
                  </span>
                </div>
                <div className="space-y-0">
                  {group.items.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded px-2 py-1 text-[14px] font-medium transition-colors",
                        "text-secondary hover:bg-background hover:text-primary"
                      )}
                    >
                      <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                      <span>{item.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-secondary/20 px-4 py-3">
          <div className="flex items-center gap-2.5 mb-2">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-8 w-8 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {getUserInitials()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary truncate">
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-secondary/60">
                <span>Free Plan</span>
                {linkedInConnected && (
                  <>
                    <span>•</span>
                    <Linkedin className="h-3 w-3 text-blue-600" />
                  </>
                )}
              </div>
            </div>
          </div>

          {!linkedInConnected && (
            <Link
              href="/app/settings"
              className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 mb-2 text-xs font-medium rounded-md transition-colors border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              <Linkedin className="h-3 w-3" />
              <span>Connect LinkedIn</span>
            </Link>
          )}

          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs font-medium text-secondary hover:bg-background hover:text-primary rounded-md transition-colors border border-secondary/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
