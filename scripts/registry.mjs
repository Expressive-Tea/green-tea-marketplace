// Every registry call lives here, and both the validator and the site build import it. One
// implementation on purpose: if the check that gates a merge and the data that renders a card came
// from two readers, a plugin could pass validation and then render wrong.

/** The four runtimes, in the order every card shows them. */
export const RUNTIMES = Object.freeze(['node', 'deno', 'bun', 'workerd']);

/**
 * Where the strictness lives.
 *
 * In GitHub Actions a package that does not answer is a failure — that is the check, and it runs
 * against the live registries on every pull request and every push to main. Locally it is a
 * warning and the entry is left out, so the site can still be looked at while one package is
 * broken — without rendering data nobody read from a registry.
 */
export const STRICT = process.env.CI === 'true';

/** Compare two semver strings. Enough for CalVer + `-beta.N`; no dependency for a dozen lines. */
function compare(a, b) {
  const split = (v) => {
    const [core, pre] = v.split('-');
    return [core.split('.').map(Number), pre ? pre.split('.') : null];
  };
  const [an, ap] = split(a);
  const [bn, bp] = split(b);
  for (let i = 0; i < 3; i += 1) if (an[i] !== bn[i]) return an[i] - bn[i];
  // A release outranks its own prerelease: 1.0.0 > 1.0.0-beta.1.
  if (!ap && !bp) return 0;
  if (!ap) return 1;
  if (!bp) return -1;
  for (let i = 0; i < Math.max(ap.length, bp.length); i += 1) {
    const x = ap[i];
    const y = bp[i];
    if (x === y) continue;
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const numeric = /^\d+$/.test(x) && /^\d+$/.test(y);
    return numeric ? Number(x) - Number(y) : String(x).localeCompare(String(y));
  }
  return 0;
}

/**
 * The newest of a version list.
 *
 * Never npm's `dist-tags.latest` and never JSR's `latest`: JSR returns `null` there while a
 * package has only prereleases, which is every green-tea package today — verified against
 * `@green-tea/core`, which has two published versions and `"latest": null`.
 */
export function newestVersion(versions) {
  return [...versions].sort(compare).pop();
}

async function getJson(url, what) {
  const response = await fetch(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${what}: ${url} answered ${response.status}`);

  return response.json();
}

/** The npm packument, reduced to what validation and the card need. */
export async function readNpm(name) {
  const packument = await getJson(`https://registry.npmjs.org/${name.replace('/', '%2f')}`, `npm ${name}`);
  const versions = Object.keys(packument.versions ?? {});
  const newest = newestVersion(versions);
  const version = newest ? packument.versions[newest] : {};

  return {
    versions,
    newest,
    description: version.description ?? '',
    engines: version.engines ?? {},
    // All three maps: a check treats core in `devDependencies` as correct and core in
    // `dependencies` or `peerDependencies` as a convention smell worth a warning, so it has to be
    // able to tell them apart rather than just miss it.
    devDependencies: version.devDependencies ?? {},
    dependencies: version.dependencies ?? {},
    peerDependencies: version.peerDependencies ?? {},
  };
}

/** JSR, reduced the same way. Three calls, because JSR splits what npm returns in one document. */
export async function readJsr(name) {
  const [scope, pkg] = name.replace(/^@/, '').split('/');
  const base = `https://api.jsr.io/scopes/${scope}/packages/${pkg}`;
  const info = await getJson(base, `jsr ${name}`);
  const listing = await getJson(`${base}/versions`, `jsr ${name} versions`);
  // `items`, not `latestVersion`. See newestVersion.
  const versions = (listing.items ?? []).map((item) => item.version);
  const newest = newestVersion(versions);
  const dependencies = newest ? await getJson(`${base}/versions/${newest}/dependencies`, `jsr ${name} deps`) : [];

  return { versions, newest, runtimeCompat: info.runtimeCompat ?? {}, dependencies };
}

/**
 * Which of the four runtimes a package declares.
 *
 * npm says it in `engines`, which also carries non-runtime keys like `npm` — hence the filter
 * against RUNTIMES rather than taking every key. JSR says it in `runtimeCompat`, where `false` is
 * a declaration that it does *not* run there and must never be read as support.
 */
export function declaredRuntimes({ engines, runtimeCompat }) {
  if (runtimeCompat && Object.keys(runtimeCompat).length > 0) {
    return RUNTIMES.filter((runtime) => runtimeCompat[runtime] === true);
  }

  return RUNTIMES.filter((runtime) => engines?.[runtime] !== undefined);
}

/**
 * Everything one card needs, live.
 *
 * Under `CI` a registry that does not answer throws and fails the build, which is the rule that
 * stops a stale or half-empty listing reaching production. Off CI it warns and returns `null`, and
 * the caller leaves the entry out.
 */
export async function readEntry(entry) {
  try {
    const npm = entry.npm ? await readNpm(entry.npm) : undefined;
    const jsr = entry.jsr ? await readJsr(entry.jsr) : undefined;

    return {
      version: (jsr ?? npm).newest,
      // npm's `engines` is the richer of the two — JSR's `runtimeCompat` is empty far more often,
      // including on `@green-tea/core` itself — so it wins when both exist.
      runtimes: declaredRuntimes({ engines: npm?.engines, runtimeCompat: jsr?.runtimeCompat }),
      live: true,
    };
  } catch (error) {
    if (STRICT) throw error;
    console.warn(`  left out, registry did not answer: ${entry.jsr ?? entry.npm} (${error.message})`);

    return null;
  }
}
