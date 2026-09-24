// Links more than one section needs. The GitHub repo does not exist yet, so these 404 until it does.

/** What "Add your plugin" pre-fills in GitHub's new-file editor. */
export const EXAMPLE_ENTRY = `jsr: "@your-scope/green-tea-your-plugin"   # recommended. Or npm: green-tea-your-plugin (ESM only)
repo: https://github.com/you/green-tea-your-plugin
description: "One sentence, 20 to 200 characters."
`;

// GitHub's new-file editor, inside this repo, with the example already filled in: a contributor
// edits a few lines and opens the pull request from there.
export const ADD_URL = `https://github.com/Expressive-Tea/green-tea-marketplace/new/main/src/content/plugins?filename=green-tea-your-plugin.yaml&value=${encodeURIComponent(EXAMPLE_ENTRY)}`;

export const CONTRIBUTING_URL = 'https://github.com/Expressive-Tea/green-tea-marketplace/blob/main/CONTRIBUTING.md';
