import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AdminLayout from "./layouts/AdminLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ProjectCreatePage from "./pages/ProjectCreatePage.jsx";
import ProjectDetailPage from "./pages/ProjectDetailPage.jsx";
import ProjectsPage from "./pages/ProjectsPage.jsx";
import RepoLinkPage from "./pages/RepoLinkPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import AiReviewPage from "./pages/AiReviewPage.jsx";

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/new" element={<ProjectCreatePage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/repo" element={<RepoLinkPage />} />
            <Route path="/ai" element={<AiReviewPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
