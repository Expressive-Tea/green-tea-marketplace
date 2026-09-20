import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Naming, from spec 5.2. Enforced here so a wrongly-named submission is rejected by the build
// rather than by a reviewer's memory.
//   internal     npm @green-tea/<x>        JSR @green-tea/<x>
//   third party  npm green-tea-<x> or @scope/green-tea-<x>
const NPM_NAME = /^(@green-tea\/[a-z0-9-]+|green-tea-[a-z0-9-]+|@[a-z0-9-]+\/green-tea-[a-z0-9-]+)$/;
const JSR_NAME = /^@[a-z0-9-]+\/(green-tea-)?[a-z0-9-]+$/;

const plugins = defineCollection({
  loader: glob({ pattern: '**/[^_]*.yaml', base: './src/content/plugins' }),
  schema: z
    .object({
      // `npm` and `jsr` rather than one `name`: a third party's package has a different name on
      // each registry. No `version` and no `runtimes` — both come from the registry, so an entry
      // cannot go stale or claim a runtime the package never declared.
      npm: z.string().regex(NPM_NAME, 'npm name must be @green-tea/<x>, green-tea-<x> or @scope/green-tea-<x>').optional(),
      jsr: z.string().regex(JSR_NAME, 'JSR name must be @scope/<x>').optional(),
      repo: z.string().url(),
      description: z.string().min(20).max(200),
    })
    .refine((entry) => entry.npm ?? entry.jsr, {
      message: 'an entry needs at least one of npm / jsr — otherwise there is nothing to install',
    }),
});

export const collections = { plugins };
