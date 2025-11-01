import { useMemo } from "react";
import {
  HardDrive,
  LayoutDashboard,
  Bot,
  FolderKanban,
  Users2,
  GitCommit,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext.jsx";

const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role ?? "GUEST";

  const navItems = useMemo(() => {
    const items = [
      {
        label: "Dashboard",
        to: "/dashboard",
        icon: LayoutDashboard,
      },
    ];

    if (role === "ADMIN") {
      items.push(
        {
          label: "Users",
          to: "/users",
          icon: Users2,
        },
        {
          label: "Projects",
          to: "/projects",
          icon: FolderKanban,
        }
      );
      return items;
    }

    items.push(
      {
        label: "Projects",
        to: "/projects",
        icon: FolderKanban,
      },
      {
        label: "Local Repo",
        to: "/repo",
        icon: HardDrive,
      },
      {
        label: "AI Review",
        to: "/ai",
        icon: Bot,
      },
      {
        label: "Commit History",
        to: "/commits",
        icon: GitCommit,
      }
    );

    return items;
  }, [role]);

  const title = role === "ADMIN" ? "AI Review Admin" : "AI Review Workspace";
  const subtitle = role === "ADMIN" ? "Control Center" : "Developer Portal";

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950/80 text-slate-300 backdrop-blur">
      <div className="px-6 py-6">
        <h1 className="text-lg font-semibold text-white">{title}</h1>
        <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
          {subtitle}
        </p>
      </div>

      <nav className="flex-1 space-y-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-blue-500/20 text-blue-300"
                    : "hover:bg-slate-800/60 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-6 py-5 text-xs text-slate-500">
        Status: <span className="text-green-400">Operational</span>
      </div>
    </aside>
  );
};

export default Sidebar;
