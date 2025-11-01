import {
  createProject,
  deleteProject,
  getProjectWithMembers,
  listProjectsForUser,
  listProjectsWithMembers,
  updateProject,
} from "../models/projectModel.js";
import {
  addProjectMembersBulk,
  removeMembersByProject,
} from "../models/projectMemberModel.js";
import {
  createRule,
  deleteRulesForProject,
  listRulesForProject,
} from "../models/ruleModel.js";
import { findUserById } from "../models/userModel.js";

const toArray = (value) => (Array.isArray(value) ? value : []);

const normalizeMembers = (rawMembers = []) =>
  toArray(rawMembers).map((member) => ({
    userId: member.memberid ?? member.memberId ?? member.user_id ?? member.userId,
    role: member.role ?? member.role_in_project ?? member.roleInProject,
    displayName: member.displayname ?? member.displayName ?? member.display_name ?? null,
    email: member.email ?? null,
  }));

const normalizeRules = (rawRules = []) =>
  toArray(rawRules).map((rule) => ({
    id: rule.id ?? rule.rule_id ?? null,
    key: rule.key,
    level: rule.level,
    message: rule.message,
    pattern: rule.pattern,
    type: rule.type,
    global: Boolean(rule.global),
    createdAt: rule.created_at ?? rule.createdAt ?? null,
  }));

export const handleListProjects = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "ADMIN";

    if (isAdmin) {
      const projects = await listProjectsWithMembers();

      return res.json({
        projects: projects.map((project) => ({
          id: project.id,
          name: project.name,
          repoPath: project.repo_path,
          createdBy: project.created_by,
          createdAt: project.created_at,
          members: normalizeMembers(project.members ?? []),
          rules: normalizeRules(project.rules ?? []),
        })),
      });
    }

    const projects = await listProjectsForUser(req.user.id);

    return res.json({
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        repoPath: project.repo_path,
        createdBy: project.created_by,
        createdAt: project.created_at,
        memberRole: project.member_role,
        ruleCount: Number(project.rule_count ?? 0),
      })),
    });
  } catch (error) {
    next(error);
  }
};

const validateMemberPayload = (members = []) => {
  if (!Array.isArray(members)) return [];

  return members
    .filter((member) => Boolean(member?.userId) && ["DEV", "PO"].includes(member.role))
    .map((member) => ({
      userId: Number(member.userId),
      role: member.role,
    }));
};

export const handleCreateProject = async (req, res, next) => {
  try {
    const { name, repoPath, members = [], rules = [] } = req.body ?? {};
    const trimmedName = (name ?? "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "Project name is required." });
    }

    const project = await createProject({
      name: trimmedName,
      repoPath: repoPath ?? null,
      createdBy: req.user.id,
    });

    const validMembers = validateMemberPayload(members);
    const eligibleMembers = [];

    for (const member of validMembers) {
      // eslint-disable-next-line no-await-in-loop
      const user = await findUserById(member.userId);

      if (!user) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!["DEV", "PO"].includes(user.role)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      eligibleMembers.push(member);
    }

    let addedMembers = [];

    if (eligibleMembers.length > 0) {
      try {
        addedMembers = await addProjectMembersBulk(project.id, eligibleMembers);
      } catch (memberError) {
        console.warn("Failed to add project members:", memberError.message);
      }
    }

    const validRules = validateRulePayload(rules);
    const createdRules = [];

    for (const rule of validRules) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const created = await createRule({
          projectId: project.id,
          key: rule.key,
          level: rule.level,
          message: rule.message,
          pattern: rule.pattern || null,
          type: rule.type,
          global: false,
        });
        createdRules.push(created);
      } catch (ruleError) {
        console.warn("Failed to create project rule:", ruleError.message);
      }
    }

  let allRules = createdRules;

  try {
    allRules = await listRulesForProject(project.id);
  } catch (ruleListError) {
    console.warn("Failed to load project rules:", ruleListError.message);
  }

  const enriched = await getProjectWithMembers(project.id);
  const projectSpecificRules = normalizeRules(enriched?.rules ?? createdRules);
  const globalRules = normalizeRules(allRules).filter((rule) => rule.global);

  res.status(201).json({
    project: {
      id: enriched?.id ?? project.id,
      name: enriched?.name ?? project.name,
      repoPath: enriched?.repo_path ?? project.repo_path,
      createdBy: enriched?.created_by ?? project.created_by,
      createdAt: enriched?.created_at ?? project.created_at,
      members: normalizeMembers(enriched?.members ?? addedMembers),
      rules: {
        project: projectSpecificRules,
        global: globalRules,
      },
    },
  });
  } catch (error) {
    next(error);
  }
};

const validateRulePayload = (rules = []) => {
  if (!Array.isArray(rules)) return [];

  return rules
    .map((rule) => ({
      key: (rule.key ?? "").trim(),
      message: (rule.message ?? "").trim(),
      level: (rule.level ?? "").toLowerCase(),
      type: (rule.type ?? "").toLowerCase(),
      pattern: (rule.pattern ?? "").trim(),
    }))
    .filter(
      (rule) =>
        rule.key &&
        rule.message &&
        ["low", "medium", "high", "critical"].includes(rule.level) &&
        ["security", "style", "performance", "docs", "tests"].includes(rule.type),
    )
    .map((rule) => ({
      ...rule,
      level: rule.level,
      type: rule.type,
    }));
};

export const handleGetProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const projectRow = await getProjectWithMembers(projectId);
    if (!projectRow) {
      return res.status(404).json({ error: "Project not found." });
    }

    if (req.user.role !== "ADMIN") {
      const memberIds = normalizeMembers(projectRow.members).map((member) => Number(member.userId));
      if (!memberIds.includes(req.user.id)) {
        return res.status(403).json({ error: "Forbidden." });
      }
    }

    let allRules = [];
    try {
      allRules = await listRulesForProject(projectId);
    } catch (ruleError) {
      console.warn("Failed to load rules for project:", ruleError.message);
    }

    res.json({
      project: {
        id: projectRow.id,
        name: projectRow.name,
        repoPath: projectRow.repo_path,
        createdBy: projectRow.created_by,
        createdAt: projectRow.created_at,
        members: normalizeMembers(projectRow.members ?? []),
        rules: {
          project: normalizeRules(projectRow.rules ?? []),
          global: normalizeRules(allRules).filter((rule) => rule.global),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleUpdateProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const { name, repoPath, members = [], rules = [] } = req.body ?? {};
    const trimmedName = (name ?? "").trim();

    if (!trimmedName) {
      return res.status(400).json({ error: "Project name is required." });
    }

    const updated = await updateProject({
      projectId,
      name: trimmedName,
      repoPath: repoPath ?? null,
    });

    if (!updated) {
      return res.status(404).json({ error: "Project not found." });
    }

    const validMembers = validateMemberPayload(members);
    const eligibleMembers = [];

    for (const member of validMembers) {
      // eslint-disable-next-line no-await-in-loop
      const userRecord = await findUserById(member.userId);

      if (!userRecord) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!["DEV", "PO"].includes(userRecord.role)) {
        // eslint-disable-next-line no-continue
        continue;
      }

      eligibleMembers.push(member);
    }

    try {
      await removeMembersByProject(projectId);
      if (eligibleMembers.length > 0) {
        await addProjectMembersBulk(projectId, eligibleMembers);
      }
    } catch (memberError) {
      console.warn("Failed to update project members:", memberError.message);
    }

    try {
      await deleteRulesForProject(projectId);
    } catch (ruleDeleteError) {
      console.warn("Failed to clear project rules:", ruleDeleteError.message);
    }

    const validRules = validateRulePayload(rules);
    for (const rule of validRules) {
      try {
        // eslint-disable-next-line no-await-in-loop
        await createRule({
          projectId,
          key: rule.key,
          level: rule.level,
          message: rule.message,
          pattern: rule.pattern || null,
          type: rule.type,
          global: false,
        });
      } catch (ruleError) {
        console.warn("Failed to persist project rule:", ruleError.message);
      }
    }

    const enriched = await getProjectWithMembers(projectId);
    let allRules = [];
    try {
      allRules = await listRulesForProject(projectId);
    } catch (ruleError) {
      console.warn("Failed to reload rules after update:", ruleError.message);
    }

    res.json({
      project: {
        id: enriched?.id ?? projectId,
        name: enriched?.name ?? trimmedName,
        repoPath: enriched?.repo_path ?? repoPath ?? null,
        createdBy: enriched?.created_by ?? updated.created_by,
        createdAt: enriched?.created_at ?? updated.created_at,
        members: normalizeMembers(enriched?.members ?? []),
        rules: {
          project: normalizeRules(enriched?.rules ?? []),
          global: normalizeRules(allRules).filter((rule) => rule.global),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const handleDeleteProject = async (req, res, next) => {
  try {
    const projectId = Number(req.params.projectId);
    if (Number.isNaN(projectId)) {
      return res.status(400).json({ error: "Invalid project id." });
    }

    const existing = await getProjectWithMembers(projectId);
    if (!existing) {
      return res.status(404).json({ error: "Project not found." });
    }

    await deleteProject(projectId);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
