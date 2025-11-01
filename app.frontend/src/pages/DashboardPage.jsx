import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
    });
  } catch (error) {
    return "-";
  }
};

const DashboardPage = () => {
  const { token } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError("");

      try {
        const [projectPayload, userPayload] = await Promise.all([
          apiClient("/projects", { token }),
          apiClient("/users", { token }),
        ]);

        setProjects(projectPayload?.projects ?? []);
        setUsers(userPayload?.users ?? []);
      } catch (fetchError) {
        setError(fetchError.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const stats = useMemo(() => {
    const devs = users.filter((user) => user.role === "DEV");
    const productOwners = users.filter((user) => user.role === "PO");

    return [
      {
        label: "Proiecte active",
        value: projects.length,
        trend: "+2 fata de luna trecuta",
      },
      {
        label: "Dezvoltatori activi",
        value: devs.length,
        trend: devs.length > 0 ? "Toti alocati" : "Asteapta alocare",
      },
      {
        label: "Product Owners",
        value: productOwners.length,
        trend: "Feedback la zi",
      },
    ];
  }, [projects.length, users]);

  const timeline = useMemo(() => {
    if (projects.length === 0) {
      return [
        {
          title: "Nu exista proiecte",
          status: "In asteptare",
          deadline: "-",
        },
      ];
    }

    const stages = ["Planificare", "Review AI", "Auto-fix", "Analiza finala"];

    return projects.slice(0, 4).map((project, index) => ({
      id: project.id,
      title: project.name,
      status: stages[index % stages.length],
      deadline: formatDate(project.createdAt),
    }));
  }, [projects]);

  const developerStatus = useMemo(() => {
    const devs = users.filter((user) => user.role === "DEV");

    if (devs.length === 0) {
      return [
        {
          name: "Niciun dezvoltator inca",
          projects: "-",
          tasks: 0,
          state: "Disponibil",
        },
      ];
    }

    return devs.map((dev) => {
      const ownedProjects = projects.filter((project) =>
        (project.members ?? []).some((member) => Number(member.userId) === dev.id),
      );

      return {
        id: dev.id,
        name: dev.displayName ?? dev.email,
        projects: ownedProjects.map((project) => project.name).join(", ") || "Nealocat",
        tasks: Math.max(ownedProjects.length * 3, 1),
        state: ownedProjects.length > 0 ? "In lucru" : "Disponibil",
      };
    });
  }, [projects, users]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold text-white">Panou general</h1>
        <p className="mt-2 text-sm text-slate-400">
          Monitorizeaza starea proiectelor, activitatea echipei si prioritatile curente.
        </p>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-6 py-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-800 bg-slate-900/60 px-6 py-5 shadow-lg shadow-slate-950/40"
          >
            <p className="text-xs uppercase tracking-widest text-slate-400">{stat.label}</p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {isLoading ? "-" : stat.value}
            </p>
            <p className="mt-2 text-xs text-slate-500">{stat.trend}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Timeline proiecte</h2>
            <span className="text-xs uppercase tracking-widest text-slate-500">
              Saptamana curenta
            </span>
          </div>
          <div className="mt-5 space-y-4">
            {timeline.map((item) => (
              <div
                key={item.id ?? item.title}
                className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs uppercase tracking-widest text-slate-500">
                    Status: {item.status}
                  </p>
                </div>
                <span className="text-xs text-slate-400">Deadline: {item.deadline}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Activitate dezvoltatori</h2>
            <span className="text-xs uppercase tracking-widest text-slate-500">
              Actualizat automat
            </span>
          </div>
          <div className="mt-5 space-y-3">
            {developerStatus.map((dev) => (
              <div
                key={dev.id ?? dev.name}
                className="rounded-xl border border-slate-800/60 bg-slate-950/50 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{dev.name}</p>
                  <span
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium",
                      dev.state === "In lucru"
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-emerald-500/20 text-emerald-300",
                    ].join(" ")}
                  >
                    {dev.state}
                  </span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">
                  Proiecte: {dev.projects}
                </p>
                <p className="mt-1 text-xs text-slate-400">Task-uri estimate: {dev.tasks}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
