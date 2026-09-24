// The `plugins` collection's loader. It replaces `glob` because `renderMarkdown` only exists inside
// a loader, and the README has to be rendered with the site's own pipeline (shiki included).
// Wrapping `glob` was tried on 2026-09-24 and the added fields did not persist; a standalone
// loader did.
import { readdirSync, readFileSync } from 'node:fs';
import yaml from 'js-yaml';

import { readEntry } from './registry.mjs';
import { cleanReadme } from './readme.mjs';

/** `entrySchema` validates one yaml file; it is the contributor-facing contract. */
export function pluginsLoader(entrySchema) {
  return {
    name: 'plugins',
    // ponytail: no file watcher — after editing a yaml in `npm run dev`, restart it. Add a watcher
    // if contributors start previewing entries locally.
    load: async ({ store, renderMarkdown, config }) => {
      store.clear();
      const dir = new URL('src/content/plugins/', config.root);
      const files = readdirSync(dir).filter((file) => file.endsWith('.yaml') && !file.startsWith('_'));

      await Promise.all(
        files.map(async (file) => {
          const parsed = entrySchema.safeParse(yaml.load(readFileSync(new URL(file, dir), 'utf8')));
          if (!parsed.success) {
            throw new Error(`src/content/plugins/${file}: ${parsed.error.issues.map((i) => i.message).join('; ')}`);
          }

          const live = await readEntry(parsed.data);
          if (!live) return;

          const { readme, readmeBase, ...data } = live;
          const rendered = await renderMarkdown(readme);
          store.set({
            id: file.replace(/\.yaml$/, ''),
            data: { ...parsed.data, ...data },
            rendered: { ...rendered, html: cleanReadme(rendered.html, readmeBase) },
          });
        }),
      );
    },
  };
}
