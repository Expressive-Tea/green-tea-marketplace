# Listing a plugin

## What counts as a green-tea plugin

A factory that returns `{ name, mount }`. It imports `@green-tea/core` as types only, with core in
`devDependencies`, so installing the plugin never pulls in a second copy of core. It needs
`@green-tea/core@26.9.0-beta.2` or newer. That is the release where plugins took this shape and
`app.boot()` became public.

## Where to publish it

JSR is what we recommend. It records which runtimes a package supports, and the listing shows
that on every card.

npm works too, as long as the package is ESM only: `"type": "module"`, no `require` condition, and
no `.cjs` file in `main` or `exports`. Dual ESM/CJS packages are turned away. green-tea is ESM from
end to end, and a `require` path is the first thing to break when the Node version floor moves.

The quickest start is [matcha](https://github.com/Expressive-Tea/matcha), green-tea's CLI:
`matcha create plugin --package` writes a package that already meets the ESM rule, with the
Runtimes table the review asks for in its README.

## Add the entry

Add one file, `src/content/plugins/<name>.yaml`:

```yaml
jsr: "@your-scope/green-tea-your-plugin"   # or npm: green-tea-your-plugin
repo: https://github.com/you/green-tea-your-plugin
description: "One sentence, 20 to 200 characters."
```

Names follow one pattern per registry: `green-tea-<x>` or `@scope/green-tea-<x>` on npm,
`@scope/<x>` on JSR. There is no version field and no runtimes field. The listing reads both from
the registry, so your entry can't go stale.

## What gets checked

The build checks two things on its own: the package exists on the registry you named, and an npm
package is ESM only. A package that fails either one is not listed.

A person checks the rest. The package has to be a factory returning `{ name, mount }` and keep
core as a type-only dependency. Its README has to cover all four runtimes (Node, Deno, Bun,
workerd) and give a reason next to each one it doesn't support.

## When it goes live

Merged entries go out with the next Friday cut.
