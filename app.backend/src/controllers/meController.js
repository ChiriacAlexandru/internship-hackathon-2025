import path from "path";
import fs from "fs/promises";

import { listProjectsByUser, isUserMemberOfProject } from "../models/projectMemberModel.js";
import { listRepoLinksForUser, upsertProjectRepoLink, deleteProjectRepoLink } from "../models/projectRepoModel.js";
import { installPreCommitHook, uninstallPreCommitHook, isHookInstalled } from "../services/hookInstaller.js";

const resolvePath = (value) => path.resolve(value.trim());

const validateRepoPath = async (repoPath) => {
  const resolved = resolvePath(repoPath);

  const stats = await fs.stat(resolved);
  if (!stats.isDirectory()) {
    throw new Error("Provided path is not a directory.");
  }

  const gitDir = path.join(resolved, ".git");
  const gitStats = await fs.stat(gitDir);
  if (!gitStats.isDirectory()) {
    throw new Error("Directory does not contain a .git folder.");
  }

  return resolved;
};

const ensureDeveloperRole = (role) => {
  if (!["DEV", "PO"].includes(role)) {
    const error = new Error("Only developers and product owners can manage repository links.");
    error.status = 403;
    throw error;
  }
};

export const handleListRepoLinks = async (req, res, next) => {
  try {
    ensureDeveloperRole(req.user.role);

    const [projects, repoLinks] = await Promise.all([
      listProjectsByUser(req.user.id),
      listRepoLinksForUser(req.user.id),
    ]);

    const repoMap = new Map(repoLinks.map((link) => [Number(link.project_id), link]));

    const repos = projects.map((project) => {
      const repoEntry = repoMap.get(project.project_id);
      return {
        projectId: project.project_id,
        projectName: project.name,
        role: project.role_in_project,
        repoPath: repoEntry?.repo_path ?? null,
        linkedAt: repoEntry?.created_at ?? null,
      };
    });

    res.json({ repos });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateRepoLink = async (req, res, next) => {
  try {
    ensureDeveloperRole(req.user.role);

    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const isMember = await isUserMemberOfProject(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this project." });
    }

    const { repoPath } = req.body ?? {};

    if (!repoPath || repoPath.trim().length === 0) {
      await deleteProjectRepoLink({ projectId, userId: req.user.id });
      return res.json({ repoPath: null, message: "Repository link removed." });
    }

    let resolved;
    try {
      resolved = await validateRepoPath(repoPath);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const record = await upsertProjectRepoLink({
      projectId,
      userId: req.user.id,
      repoPath: resolved,
    });

    res.json({
      repoPath: record.repo_path,
      message: "Repository path linked successfully.",
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      return res.status(400).json({ error: "Path does not exist or is not accessible." });
    }
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
};

export const handleInstallHook = async (req, res, next) => {
  try {
    ensureDeveloperRole(req.user.role);

    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const isMember = await isUserMemberOfProject(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this project." });
    }

    // Get repo link
    const repos = await listRepoLinksForUser(req.user.id);
    const repo = repos.find((r) => Number(r.project_id) === projectId);

    if (!repo || !repo.repo_path) {
      return res.status(400).json({ error: "No repository linked to this project. Please link a repo first." });
    }

    // Install hook
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3000}`;
    const result = installPreCommitHook(repo.repo_path, projectId, req.token, apiUrl);

    if (result.success) {
      return res.json({
        message: result.message,
        hookPath: result.hookPath,
        installed: true,
      });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

export const handleUninstallHook = async (req, res, next) => {
  try {
    ensureDeveloperRole(req.user.role);

    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const isMember = await isUserMemberOfProject(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this project." });
    }

    // Get repo link
    const repos = await listRepoLinksForUser(req.user.id);
    const repo = repos.find((r) => Number(r.project_id) === projectId);

    if (!repo || !repo.repo_path) {
      return res.status(400).json({ error: "No repository linked to this project." });
    }

    // Uninstall hook
    const result = uninstallPreCommitHook(repo.repo_path);

    if (result.success) {
      return res.json({
        message: result.message,
        installed: false,
      });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    next(error);
  }
};

export const handleCheckHookStatus = async (req, res, next) => {
  try {
    ensureDeveloperRole(req.user.role);

    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const isMember = await isUserMemberOfProject(projectId, req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: "You are not a member of this project." });
    }

    // Get repo link
    const repos = await listRepoLinksForUser(req.user.id);
    const repo = repos.find((r) => Number(r.project_id) === projectId);

    if (!repo || !repo.repo_path) {
      return res.json({ installed: false, reason: "No repository linked" });
    }

    const installed = isHookInstalled(repo.repo_path);

    res.json({ installed, repoPath: repo.repo_path });
  } catch (error) {
    next(error);
  }
};
