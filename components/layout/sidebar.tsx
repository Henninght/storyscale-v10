"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  LayoutDashboard,
  PenSquare,
  FileText,
  Megaphone,
  Calendar,
  Settings,
  CreditCard,
  Menu,
  X,
  LogOut,
} from "lucide-react";

const navigation = [
  { name: "Workspace", href: "/app", icon: LayoutDashboard },
  { name: "Create New Post", href: "/app/create", icon: PenSquare },
  { name: "All Drafts", href: "/app/drafts", icon: FileText },
  { name: "Campaigns", href: "/app/campaigns", icon: Megaphone },
  { name: "Calendar View", href: "/app/calendar", icon: Calendar },
  { name: "Settings", href: "/app/settings", icon: Settings },
  { name: "Billing", href: "/app/billing", icon: CreditCard },
];

export function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

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
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "text-secondary hover:bg-background hover:text-primary"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-secondary/20 p-4 space-y-3">
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || "User"}
                className="h-10 w-10 rounded-full flex-shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {getUserInitials()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary truncate">
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-xs text-secondary/60 truncate">Free Plan</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-secondary hover:bg-background hover:text-primary rounded-lg transition-colors border border-secondary/20"
          >
            <LogOut className="h-4 w-4" />
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
