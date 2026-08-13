"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, FileText, MessageSquare, LogOut, Upload, Users, ShieldAlert } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import clsx from "clsx";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore((state) => ({ user: state.user, logout: state.logout }));
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Documents", href: "/dashboard/documents", icon: <FileText size={20} /> },
    { name: "Chats", href: "/dashboard/chats", icon: <MessageSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background text-white">
      {/* Sidebar */}
      <aside className="w-64 glass border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6 font-bold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Smart AI PDF
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                pathname === item.href ? "bg-primary text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.icon}
              {item.name}
            </Link>
          ))}

          {user?.role === 'ADMIN' && (
            <div className="pt-4 mt-4 border-t border-white/10">
              <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Admin Portal</div>
              <Link 
                href="/admin/users"
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                  pathname.startsWith("/admin/users") ? "bg-primary/20 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Users size={20} />
                Manage Users
              </Link>
              <Link 
                href="/admin/notifications"
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium",
                  pathname.startsWith("/admin/notifications") ? "bg-primary/20 text-primary" : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldAlert size={20} />
                Send Notifications
              </Link>
            </div>
          )}

          <Link
             href="/dashboard/upload"
             className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/20 text-secondary border border-secondary/50 font-medium mt-4 hover:bg-secondary/30 transition-colors"
          >
             <Upload size={20} />
             Upload PDF
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-gray-400 hover:bg-error/20 hover:text-error transition-colors font-medium"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
