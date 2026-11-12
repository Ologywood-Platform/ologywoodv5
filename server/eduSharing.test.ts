import { describe, expect, it } from "vitest";
import {
  EDU_SHARE_TITLE,
  EDU_SHARE_DESCRIPTION,
  EDU_SHARE_URL,
  EDU_SHARE_IMAGE,
  EDU_SHARE_IMAGE_ALT,
} from "../shared/eduShare";
import { injectEduShareMeta } from "./services/eduShareMetadata";

// Pure string fixtures: these tests never import routes, access a database,
// fetch the image, or claim that the deployed static/CDN response was verified.
const HOMEPAGE_TITLE = "Your Talent. Your Platform. Your Next Opportunity.";
const HOMEPAGE_IMAGE =
  "https://www.ologywood.com/manus-storage/ologywood-platform-og-2026-10-10_b5a657bf.png";
const HOMEPAGE_DESCRIPTION = "Homepage booking and entertainment description.";

const headAssets = [
  '<link rel="stylesheet" crossorigin href="/assets/index-latest.css">',
  '<link rel="modulepreload" crossorigin href="/assets/vendor-latest.js">',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/edu-font.woff2">',
  '<link rel="preload" as="image" href="/images/ologywood-cinematic-hero-1280.webp" imagesrcset="/images/hero-768.webp 768w, /images/hero-1280.webp 1280w" imagesizes="100vw">',
  '<script type="module" crossorigin src="/assets/index-latest.js"></script>',
  '<script async src="https://analytics.example.test/script.js" data-website-id="offline-fixture"></script>',
  '<script>window.analyticsQueue = window.analyticsQueue || []; window.analyticsQueue.push(["init", "edu"]);</script>',
];
const body = `<body>
  <div id="root"><div data-preserve="yes">Existing SPA root content</div></div>
  <script type="module" src="/assets/body-latest.js"></script>
  <script>if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js?v=6'); }</script>
</body>`;

function shell(seo: string): string {
  return `<!doctype html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n<meta name="robots" content="index, follow">\n<meta name="theme-color" content="#6D28D9">\n${seo}\n${headAssets.join("\n")}\n</head>\n${body}\n</html>`;
}

const homepageSeo = `
<title>${HOMEPAGE_TITLE}</title>
<meta name="description" content="${HOMEPAGE_DESCRIPTION}">
<link rel="canonical" href="https://www.ologywood.com/">
<meta property="og:type" content="website">
<meta property="og:title" content="${HOMEPAGE_TITLE}">
<meta property="og:description" content="${HOMEPAGE_DESCRIPTION}">
<meta property="og:url" content="https://www.ologywood.com/">
<meta property="og:image" content="${HOMEPAGE_IMAGE}">
<meta property="og:image:secure_url" content="${HOMEPAGE_IMAGE}">
<meta property="og:image:type" content="image/webp">
<meta property="og:image:width" content="800">
<meta property="og:image:height" content="800">
<meta property="og:image:alt" content="Homepage artwork">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${HOMEPAGE_TITLE}">
<meta name="twitter:description" content="${HOMEPAGE_DESCRIPTION}">
<meta name="twitter:url" content="https://www.ologywood.com/">
<meta name="twitter:image" content="${HOMEPAGE_IMAGE}">
<meta name="twitter:image:alt" content="Homepage artwork">
<meta name="twitter:site" content="@ologywood">`;

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function attrs(tag: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of tag.matchAll(
    /([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g
  )) {
    result[match[1].toLowerCase()] = decodeHtml(
      match[2] ?? match[3] ?? match[4]
    );
  }
  return result;
}

function tags(
  html: string,
  tagName: "meta" | "link"
): Record<string, string>[] {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head\s*>/i)?.[1];
  expect(head, "injection must retain a complete document head").toBeDefined();
  return Array.from(
    head!.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi")),
    match => attrs(match[0])
  );
}

function metaValues(
  html: string,
  key: string,
  field: "name" | "property"
): string[] {
  return tags(html, "meta")
    .filter(tag => tag[field]?.toLowerCase() === key.toLowerCase())
    .map(tag => tag.content);
}

function titleValues(html: string): string[] {
  return Array.from(
    html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/gi),
    match => decodeHtml(match[1])
  );
}

function canonicalValues(html: string): string[] {
  return tags(html, "link")
    .filter(tag => tag.rel?.toLowerCase().split(/\s+/).includes("canonical"))
    .map(tag => tag.href);
}

function expectSingleEduSeo(html: string): void {
  expect(titleValues(html)).toEqual([EDU_SHARE_TITLE]);
  expect(metaValues(html, "description", "name")).toEqual([
    EDU_SHARE_DESCRIPTION,
  ]);
  expect(canonicalValues(html)).toEqual([EDU_SHARE_URL]);
  for (const [key, value] of Object.entries({
    "og:type": "website",
    "og:title": EDU_SHARE_TITLE,
    "og:description": EDU_SHARE_DESCRIPTION,
    "og:url": EDU_SHARE_URL,
    "og:image": EDU_SHARE_IMAGE,
    "og:image:secure_url": EDU_SHARE_IMAGE,
    "og:image:type": "image/png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:image:alt": EDU_SHARE_IMAGE_ALT,
  })) {
    expect(metaValues(html, key, "property"), key).toEqual([value]);
  }
  for (const [key, value] of Object.entries({
    "twitter:card": "summary_large_image",
    "twitter:title": EDU_SHARE_TITLE,
    "twitter:description": EDU_SHARE_DESCRIPTION,
    "twitter:url": EDU_SHARE_URL,
    "twitter:image": EDU_SHARE_IMAGE,
    "twitter:image:alt": EDU_SHARE_IMAGE_ALT,
  })) {
    expect(metaValues(html, key, "name"), key).toEqual([value]);
    expect(
      metaValues(html, key, "property"),
      `${key} uses name, not property`
    ).toEqual([]);
  }
}

describe("EDU sharing constants (offline contract)", () => {
  it("defines the exact EDU title and canonical public /edu URL", () => {
    expect(EDU_SHARE_TITLE).toBe(
      "OlogyWood EDU — The Next Generation of Entertainment Starts Here"
    );
    expect(EDU_SHARE_URL).toBe("https://www.ologywood.com/edu");
    expect(EDU_SHARE_DESCRIPTION).toEqual(expect.any(String));
    expect(EDU_SHARE_DESCRIPTION.trim().length).toBeGreaterThan(0);
    expect(EDU_SHARE_DESCRIPTION).not.toBe(HOMEPAGE_DESCRIPTION);
    expect(EDU_SHARE_IMAGE_ALT).toEqual(expect.any(String));
    expect(EDU_SHARE_IMAGE_ALT.trim().length).toBeGreaterThan(0);
  });

  it("uses a dedicated absolute HTTPS PNG image, not the homepage social image", () => {
    const image = new URL(EDU_SHARE_IMAGE);
    expect(image.protocol).toBe("https:");
    expect(image.hostname.length).toBeGreaterThan(0);
    expect(image.username).toBe("");
    expect(image.password).toBe("");
    expect(image.pathname).toMatch(/\.png$/i);
    expect(EDU_SHARE_IMAGE).not.toBe(HOMEPAGE_IMAGE);
    expect(image.pathname).not.toContain(
      "ologywood-platform-og-2026-10-10_b5a657bf"
    );
  });
});

describe("injectEduShareMeta (offline runtime)", () => {
  it("replaces the homepage title, description, canonical, and every main social field with one EDU set", () => {
    expectSingleEduSeo(injectEduShareMeta(shell(homepageSeo)));
  });

  it("removes duplicate SEO tags even when their values differ", () => {
    const duplicates = `${homepageSeo}\n${homepageSeo}
<title>Another stale title</title>
<meta name="description" content="Another stale description">
<link rel="canonical" href="https://www.ologywood.com/edu/">
<meta property="og:title" content="Another stale title">
<meta property="og:url" content="https://attacker.example/edu">
<meta property="og:image" content="https://attacker.example/stale.png">
<meta name="twitter:image" content="https://attacker.example/stale.png">`;
    expectSingleEduSeo(injectEduShareMeta(shell(duplicates)));
  });

  it("handles single quotes, reordered attributes, multiline tags, and case-insensitive HTML attributes", () => {
    const variant = `
<TITLE data-stale='true'>Old mixed-case title</TITLE>
<META content='Stale description' data-stale='yes' NAME='description'>
<LINK href='https://attacker.example/' data-stale='yes' REL='canonical' />
<META content='Old OG title' PROPERTY='og:title'>
<meta content='https://attacker.example/'\n data-stale='yes' property='og:url' />
<meta content='${HOMEPAGE_IMAGE}' property='og:image'>
<meta content='Old Twitter title' name='twitter:title'>
<meta content='${HOMEPAGE_IMAGE}' property='twitter:image'>
<meta content='${HOMEPAGE_IMAGE}' name='og:image'>`;
    const output = injectEduShareMeta(shell(variant));
    expectSingleEduSeo(output);
    expect(output).not.toContain("Old mixed-case title");
    expect(output).not.toContain("Stale description");
    expect(output).not.toContain("attacker.example");
    expect(metaValues(output, "og:image", "name")).toEqual([]);
  });

  it("removes stale unknown og: and twitter: fields rather than leaving mixed homepage metadata", () => {
    const output = injectEduShareMeta(
      shell(`${homepageSeo}
<meta property="og:video" content="https://attacker.example/home.mp4">
<meta name="og:audio" content="https://attacker.example/home.mp3">
<meta name="twitter:player" content="https://attacker.example/player">
<meta property="twitter:app:id:iphone" content="stale-homepage-app">`)
    );
    expectSingleEduSeo(output);
    expect(output).not.toContain("attacker.example");
    expect(output).not.toContain("stale-homepage-app");
    const socialTags = tags(output, "meta").filter(tag =>
      /^(og:|twitter:)/i.test(tag.name ?? tag.property ?? "")
    );
    for (const field of ["name", "property"] as const) {
      const keys = socialTags
        .map(tag => tag[field]?.toLowerCase())
        .filter(Boolean);
      expect(new Set(keys).size, `no duplicate social ${field} keys`).toBe(
        keys.length
      );
    }
  });

  it("does not retain the homepage social image, title, or description", () => {
    const output = injectEduShareMeta(shell(homepageSeo));
    expect(output).not.toContain(HOMEPAGE_IMAGE);
    expect(output).not.toContain(HOMEPAGE_TITLE);
    expect(output).not.toContain(HOMEPAGE_DESCRIPTION);
    expect(metaValues(output, "og:image:type", "property")).toEqual([
      "image/png",
    ]);
    expect(metaValues(output, "og:image:width", "property")).toEqual(["1200"]);
    expect(metaValues(output, "og:image:height", "property")).toEqual(["630"]);
  });

  it("emits X/Twitter fields as name attributes, including the /edu URL and image alt", () => {
    const output = injectEduShareMeta(shell(homepageSeo));
    const twitterTags = tags(output, "meta").filter(tag =>
      /^twitter:/i.test(tag.name ?? tag.property ?? "")
    );
    expect(twitterTags.length).toBeGreaterThanOrEqual(6);
    for (const tag of twitterTags) {
      expect(tag.name).toMatch(/^twitter:/);
      expect(tag.property).toBeUndefined();
    }
    expect(metaValues(output, "twitter:url", "name")).toEqual([
      "https://www.ologywood.com/edu",
    ]);
    expect(metaValues(output, "twitter:image", "name")).toEqual([
      EDU_SHARE_IMAGE,
    ]);
    expect(metaValues(output, "twitter:image:alt", "name")).toEqual([
      EDU_SHARE_IMAGE_ALT,
    ]);
  });

  it("preserves the entire body, #root, and current bundle, stylesheet, font, preload, and analytics tags", () => {
    const input = shell(homepageSeo);
    const output = injectEduShareMeta(input);
    expect(output.slice(output.indexOf("<body>"))).toBe(
      input.slice(input.indexOf("<body>"))
    );
    expect(output.match(/id="root"/g)).toHaveLength(1);
    for (const asset of headAssets) {
      expect(output, `preserve ${asset}`).toContain(asset);
      expect(output.split(asset)).toHaveLength(2);
    }
    expect(metaValues(output, "viewport", "name")).toEqual([
      "width=device-width, initial-scale=1",
    ]);
    expect(metaValues(output, "robots", "name")).toEqual(["index, follow"]);
    expect(metaValues(output, "theme-color", "name")).toEqual(["#6D28D9"]);
  });

  it("adds a complete EDU set when the valid SPA head has no SEO tags", () => {
    const output = injectEduShareMeta(shell(""));
    expectSingleEduSeo(output);
    expect(output).toContain(body);
  });

  it("keeps exactly one correct SEO set when an already-injected shell is injected again", () => {
    const once = injectEduShareMeta(shell(homepageSeo));
    const twice = injectEduShareMeta(once);
    expectSingleEduSeo(twice);
    expect(twice.slice(twice.indexOf("<body>"))).toBe(
      once.slice(once.indexOf("<body>"))
    );
    for (const asset of headAssets) expect(twice.split(asset)).toHaveLength(2);
  });

  it("uses trusted constants, not hostile origins inherited from the input shell", () => {
    const hostile = homepageSeo
      .replaceAll(
        "https://www.ologywood.com",
        "https://untrusted-host.example:9443"
      )
      .replaceAll(HOMEPAGE_TITLE, "Untrusted Host title");
    const output = injectEduShareMeta(shell(hostile));
    expectSingleEduSeo(output);
    expect(output).not.toContain("untrusted-host.example");
    expect(canonicalValues(output)).toEqual(["https://www.ologywood.com/edu"]);
    expect(metaValues(output, "og:url", "property")).toEqual([
      "https://www.ologywood.com/edu",
    ]);
  });

  it.each([
    [
      "unclosed head",
      '<html><head><title>Homepage</title><body><div id="root"></div></body></html>',
    ],
    ["no head", '<html><body><div id="root"></div></body></html>'],
    ["empty input", ""],
  ])(
    "fails for %s instead of returning a false-success EDU shell",
    (_name, input) => {
      expect(() => injectEduShareMeta(input)).toThrow();
    }
  );
});
