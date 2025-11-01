import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../utils/apiClient.js";

const ROLES = [
  { value: "DEV", label: "Developer" },
  { value: "PO", label: "Product Owner" },
  { value: "ADMIN", label: "Administrator" },
];

const UsersPage = () => {
  const { token, user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "DEV",
  });

  const fetchUsers = async () => {
    if (!token) return;

    setLoading(true);
    setError("");

    try {
      const payload = await apiClient("/users", { token });
      setUsers(payload?.users ?? []);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    try {
      await apiClient("/users", {
        method: "POST",
        token,
        body: {
          email: form.email.trim(),
          password: form.password,
          displayName: form.displayName.trim(),
          role: form.role,
        },
      });

      setSuccess("User created successfully.");
      setForm({
        email: "",
        password: "",
        displayName: "",
        role: "DEV",
      });
      await fetchUsers();
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  if (user?.role !== "ADMIN") {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-300">
        Only administrators can manage users. Please contact your admin team if you need changes.
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-semibold text-white">User management</h1>
        <p className="mt-2 text-sm text-slate-400">
          Create new accounts for developers or product owners and keep access under control.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
        <form
          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
          onSubmit={handleSubmit}
        >
          <h2 className="text-base font-semibold text-white">Create user</h2>
          <p className="mt-1 text-xs text-slate-500">
            Accounts are created centrally; share credentials with the team through your private channels.
          </p>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-widest text-slate-400" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="nume@companie.ro"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-medium uppercase tracking-widest text-slate-400"
                htmlFor="displayName"
              >
                Display name
              </label>
              <input
                id="displayName"
                name="displayName"
                required
                value={form.displayName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Alex Pop"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-medium uppercase tracking-widest text-slate-400"
                htmlFor="password"
              >
                Temporary password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
                placeholder="Minim 6 caractere"
              />
            </div>

            <div className="space-y-2">
              <label
                className="text-xs font-medium uppercase tracking-widest text-slate-400"
                htmlFor="role"
              >
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-blue-500 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/60"
          >
            Create user
          </button>
        </form>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Existing users</h2>
            <span className="text-xs uppercase tracking-widest text-slate-500">
              {loading ? "Loading..." : `${users.length} records`}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {users.map((user) => (
              <div
                key={user.id}
                className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">
                    {user.displayName ?? user.email}
                  </p>
                  <span className="text-xs uppercase tracking-widest text-slate-500">
                    {user.role}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{user.email}</p>
                <p className="mt-2 text-xs text-slate-500">Created: {formatDate(user.createdAt)}</p>
              </div>
            ))}

            {!loading && users.length === 0 ? (
              <div className="rounded-xl border border-slate-800/60 bg-slate-950/50 px-4 py-5 text-center text-sm text-slate-400">
                No users yet. Create the first account.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
};

const formatDate = (value) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("ro-RO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch (error) {
    return "-";
  }
};

export default UsersPage;
