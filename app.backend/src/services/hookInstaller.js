import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Installs the pre-commit hook in a Git repository
 * @param {string} repoPath - Path to the Git repository
 * @param {number} projectId - Project ID
 * @param {string} authToken - JWT token for API authentication
 * @param {string} apiUrl - Backend API URL (default: http://localhost:3000)
 */
export function installPreCommitHook(
  repoPath,
  projectId,
  authToken,
  apiUrl = "http://localhost:3000"
) {
  try {
    // Validate repo path
    const gitPath = path.join(repoPath, ".git");
    if (!fs.existsSync(gitPath)) {
      throw new Error(`Not a Git repository: ${repoPath}`);
    }

    // Create hooks directory if it doesn't exist
    const hooksPath = path.join(gitPath, "hooks");
    if (!fs.existsSync(hooksPath)) {
      fs.mkdirSync(hooksPath, { recursive: true });
    }

    // Read template (located in scripts folder, not services)
    const templatePath = path.join(
      __dirname,
      "..",
      "scripts",
      "pre-commit-hook.js"
    );
    let hookContent = fs.readFileSync(templatePath, "utf-8");

    // Replace placeholders
    hookContent = hookContent.replace("REPLACE_API_URL", apiUrl);
    hookContent = hookContent.replace(
      "REPLACE_PROJECT_ID",
      projectId.toString()
    );
    hookContent = hookContent.replace("REPLACE_AUTH_TOKEN", authToken);

    // Write hook file
    const hookPath = path.join(hooksPath, "pre-commit");
    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });

    // Make executable (Unix/Linux/Mac)
    if (process.platform !== "win32") {
      fs.chmodSync(hookPath, 0o755);
    }

    return {
      success: true,
      hookPath,
      message: "Pre-commit hook installed successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Uninstalls the pre-commit hook
 */
export function uninstallPreCommitHook(repoPath) {
  try {
    const hookPath = path.join(repoPath, ".git", "hooks", "pre-commit");

    if (fs.existsSync(hookPath)) {
      fs.unlinkSync(hookPath);
      return {
        success: true,
        message: "Pre-commit hook removed",
      };
    }

    return {
      success: false,
      message: "No pre-commit hook found",
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Checks if pre-commit hook is installed
 */
export function isHookInstalled(repoPath) {
  const hookPath = path.join(repoPath, ".git", "hooks", "pre-commit");
  return fs.existsSync(hookPath);
}
