// A plugin's README is somebody else's HTML. Review reads the yaml once; the README can change on
// any later publish and reach the site at the next Friday cut. So it is cleaned against a closed
// allowlist every build, and never trusted because the entry was.
import sanitizeHtml from 'sanitize-html';

const HEX = /^#[0-9a-f]{3,8}$/i;

/** Relative URLs resolve against the published package; anchors and absolute URLs stay. */
function absolute(url, base) {
  if (!url || url.startsWith('#')) return url;
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

/** Only touch the attribute when it is there — setting it to `undefined` renders a bare `href`. */
function rebase(attribs, key, base) {
  return key in attribs ? { ...attribs, [key]: absolute(attribs[key], base) } : attribs;
}

export function cleanReadme(html, base) {
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'details', 'summary', 'picture', 'source']),
    allowedAttributes: {
      '*': ['id', 'align'],
      a: ['href', 'title'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      source: ['srcset', 'media'],
      pre: ['class', 'style', 'tabindex', 'data-language'],
      span: ['class', 'style'],
      code: ['class'],
    },
    // Only what shiki writes. Anything else (position, inset, z-index…) would let a README draw
    // over the page around it.
    allowedStyles: {
      '*': { color: [HEX], 'background-color': [HEX], 'overflow-x': [/^auto$/] },
    },
    // Only the classes shiki writes, spelled out. A README that could use any class could borrow the
    // site's own (`card__link::after` is a full-page overlay) and draw over the page that way.
    // `github-dark` is Astro's default theme; change it here if astro.config.mjs picks another.
    allowedClasses: {
      pre: ['astro-code', 'github-dark'],
      code: [/^language-[a-z0-9+#-]+$/],
      span: ['line'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: rebase(attribs, 'href', base) }),
      img: (tagName, attribs) => ({ tagName, attribs: rebase(attribs, 'src', base) }),
      // `srcset` is a comma-separated list of "url descriptor" pairs; only the url moves.
      source: (tagName, attribs) =>
        'srcset' in attribs
          ? {
              tagName,
              attribs: {
                ...attribs,
                srcset: attribs.srcset
                  .split(',')
                  .map((candidate) => {
                    const [url, ...descriptor] = candidate.trim().split(/\s+/);
                    return [absolute(url, base), ...descriptor].join(' ');
                  })
                  .join(', '),
              },
            }
          : { tagName, attribs },
    },
  });
}
