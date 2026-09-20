// What the seed plugins declare, copied from their `package.json` in Green-Tea/plugins.
//
// This exists so the site can be designed and reviewed before the packages ship. It is used ONLY
// when a registry has no answer and `CI` is unset — in GitHub Actions a missing package fails the
// build instead, which is where the real check lives.
//
// **Delete this file, and its import in `src/pages/index.astro`, once the three are published.**
// Every entry here is a claim nobody verified; the registry is the source of truth and this is a
// stand-in for a registry that does not have the package yet.
export const PREVIEW = {
  '@green-tea/jwt': { version: '26.9.0-beta.0', engines: { node: '>=22', deno: '>=2', bun: '>=1.3' } },
  '@green-tea/metrics': { version: '26.9.0-beta.0', engines: { node: '>=22', deno: '>=2', bun: '>=1.3' } },
  '@green-tea/rate-limit': { version: '26.9.0-beta.0', engines: { node: '>=22', deno: '>=2', bun: '>=1.3' } },
};
