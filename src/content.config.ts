import { defineCollection, z } from 'astro:content';

import { pluginsLoader } from '../scripts/loader.mjs';

// Naming, from spec 5.2. Enforced here so a wrongly-named submission is rejected by the build
// rather than by a reviewer's memory.
//   internal     npm @green-tea/<x>        JSR @green-tea/<x>
//   third party  npm green-tea-<x> or @scope/green-tea-<x>
const NPM_NAME = /^(@green-tea\/[a-z0-9-]+|green-tea-[a-z0-9-]+|@[a-z0-9-]+\/green-tea-[a-z0-9-]+)$/;
const JSR_NAME = /^@[a-z0-9-]+\/(green-tea-)?[a-z0-9-]+$/;

// `npm` and `jsr` rather than one `name`: a third party's package has a different name on each
// registry. No `version` and no `runtimes` — both come from the registry, so an entry cannot go
// stale or claim a runtime the package never declared.
const FIELDS = z.object({
  npm: z.string().regex(NPM_NAME, 'npm name must be @green-tea/<x>, green-tea-<x> or @scope/green-tea-<x>').optional(),
  jsr: z.string().regex(JSR_NAME, 'JSR name must be @scope/<x>').optional(),
  repo: z.string().url(),
  description: z.string().min(20).max(200),
});

const ENTRY = FIELDS.refine((entry) => entry.npm ?? entry.jsr, {
  message: 'an entry needs at least one of npm / jsr — otherwise there is nothing to install',
});

const plugins = defineCollection({
  loader: pluginsLoader(ENTRY),
  // What the loader stores: the entry plus what the registry said.
  schema: FIELDS.extend({
    pkg: z.string(),
    registry: z.enum(['jsr', 'npm']),
    version: z.string(),
    versions: z.array(z.string()),
    runtimes: z.array(z.string()),
  }),
});

export const collections = { plugins };
