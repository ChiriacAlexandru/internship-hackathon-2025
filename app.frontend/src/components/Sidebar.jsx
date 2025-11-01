import { LayoutDashboard, FolderKanban, Users2 } from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    to: "/users",
    icon: Users2,
  },
  {
    label: "Projects",
    to: "/projects",
    icon: FolderKanban,
  },
];

const Sidebar = () => (
  <aside className="flex h-full w-64 flex-col border-r border-slate-800 bg-slate-950/80 text-slate-300 backdrop-blur">
    <div className="px-6 py-6">
      <h1 className="text-lg font-semibold text-white">AI Review Admin</h1>
      <p className="mt-1 text-xs uppercase tracking-widest text-slate-500">
        Control Center
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

export default Sidebar;
