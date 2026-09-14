import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

// Guard the git deployment policy in vercel.json.
//
// The site used to build a Vercel preview for every feature-branch push and
// every PR, which burns Hobby build/storage quota for no benefit: CI already
// proves the change locally, and production is the only environment anyone
// visits deliberately. The policy below keeps `main` deploying to production
// automatically and suppresses automatic previews for everything else.
//
// These assertions exist so a future edit cannot quietly re-enable previews
// (forgetting a rule) or, worse, disable production deployments from `main`.
type DeploymentPolicy = Record<string, boolean>;

function readPolicy(): DeploymentPolicy {
  const raw = readFileSync("vercel.json", "utf8");
  const config = JSON.parse(raw) as {
    git?: { deploymentEnabled?: DeploymentPolicy | boolean };
  };
  const enabled = config.git?.deploymentEnabled;
  if (enabled === undefined || typeof enabled === "boolean") {
    throw new Error(
      "vercel.json git.deploymentEnabled must be an object of branch -> boolean"
    );
  }
  return enabled;
}

describe("vercel.json git deployment policy", () => {
  it("keeps automatic production deployments for main", () => {
    expect(readPolicy().main).toBe(true);
  });

  it("suppresses automatic previews for every other branch", () => {
    const policy = readPolicy();
    // Both patterns are present so a slash-delimited branch (codex/foo,
    // gh-12/x) is caught, not only a top-level name.
    expect(policy["*"]).toBe(false);
    expect(policy["**"]).toBe(false);
  });

  it("keeps the data branches excluded", () => {
    const policy = readPolicy();
    expect(policy["pareto-data"]).toBe(false);
    expect(policy["benchmark-data"]).toBe(false);
  });

  it("keeps the on-demand preview branch enabled by exact name", () => {
    // `manual-preview` is what the "Preview on demand" workflow pushes to.
    // It must be an exact name: on this project Vercel only honours literal
    // branch names in git.deploymentEnabled, so a `preview/**` glob does not
    // produce a deployment (verified 2026-09-14). See docs/vercel-deployments.md.
    expect(readPolicy()["manual-preview"]).toBe(true);
  });
});
