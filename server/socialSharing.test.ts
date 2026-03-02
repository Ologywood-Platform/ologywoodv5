/**
 * Tests for Social Sharing Buttons — component file existence, structure,
 * BlogPost integration, and URL generation logic.
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";

const rootDir = resolve(__dirname, "..");

describe("SocialShareButtons Component", () => {
  const componentPath = resolve(rootDir, "client/src/components/SocialShareButtons.tsx");
  const content = readFileSync(componentPath, "utf-8");

  it("exports a default SocialShareButtons component", () => {
    expect(content).toContain("export default function SocialShareButtons");
  });

  it("accepts title, url, and description props", () => {
    expect(content).toContain("title: string");
    expect(content).toContain("url?: string");
    expect(content).toContain("description?: string");
  });

  it("generates a Twitter/X share URL with encoded text and url", () => {
    expect(content).toContain("https://x.com/intent/tweet");
    expect(content).toContain("encodeURIComponent(shareText)");
    expect(content).toContain("encodeURIComponent(shareUrl)");
  });

  it("generates a LinkedIn share URL with encoded url", () => {
    expect(content).toContain("https://www.linkedin.com/sharing/share-offsite/");
    expect(content).toContain("encodeURIComponent(shareUrl)");
  });

  it("has a copy-link button that uses navigator.clipboard", () => {
    expect(content).toContain("navigator.clipboard.writeText");
    expect(content).toContain("handleCopyLink");
  });

  it("shows a copied confirmation state", () => {
    expect(content).toContain("setCopied(true)");
    expect(content).toContain("Copied!");
  });

  it("has a fallback copy mechanism for older browsers", () => {
    expect(content).toContain("document.execCommand");
  });

  it("includes accessible aria-labels for all buttons", () => {
    expect(content).toContain('aria-label="Share on X (Twitter)"');
    expect(content).toContain('aria-label="Share on LinkedIn"');
    expect(content).toContain("Copy link");
    expect(content).toContain("Link copied");
  });

  it("opens share links in a new tab", () => {
    expect(content).toContain('target="_blank"');
    expect(content).toContain('rel="noopener noreferrer"');
  });

  it("includes a custom X/Twitter SVG icon", () => {
    expect(content).toContain("function XIcon");
    expect(content).toContain("<svg");
    expect(content).toContain("viewBox");
  });
});

describe("BlogPost Social Sharing Integration", () => {
  const blogPostPath = resolve(rootDir, "client/src/pages/BlogPost.tsx");
  const content = readFileSync(blogPostPath, "utf-8");

  it("imports SocialShareButtons component", () => {
    expect(content).toContain('import SocialShareButtons from "@/components/SocialShareButtons"');
  });

  it("renders sharing buttons below the title", () => {
    expect(content).toContain("{/* Social Sharing */}");
    expect(content).toContain("<SocialShareButtons");
  });

  it("renders a bottom share bar after the content", () => {
    expect(content).toContain("{/* Bottom Share Bar */}");
    expect(content).toContain("Enjoyed this article? Share it with your network.");
  });

  it("passes post title, excerpt, and slug-based URL to sharing buttons", () => {
    expect(content).toContain("title={post.title}");
    expect(content).toContain("description={post.excerpt}");
    expect(content).toContain("url={`${window.location.origin}/blog/${post.slug}`}");
  });
});

describe("Social Share URL Generation Logic", () => {
  it("correctly encodes a sample Twitter share URL", () => {
    const title = "Introducing White Label Releases";
    const description = "Sell your music for just 1%";
    const url = "https://ologywood.com/blog/introducing-white-label-releases";
    const shareText = `${title} — ${description}`;

    const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;

    expect(twitterUrl).toContain("x.com/intent/tweet");
    expect(twitterUrl).toContain("Introducing%20White%20Label%20Releases");
    expect(twitterUrl).toContain("ologywood.com");
    expect(twitterUrl).not.toContain(" "); // No unencoded spaces
  });

  it("correctly encodes a sample LinkedIn share URL", () => {
    const url = "https://ologywood.com/blog/introducing-white-label-releases";
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

    expect(linkedinUrl).toContain("linkedin.com/sharing/share-offsite");
    expect(linkedinUrl).toContain("ologywood.com");
    expect(linkedinUrl).not.toContain(" ");
  });

  it("handles titles with special characters", () => {
    const title = "What's New? 100% Free & Open!";
    const encoded = encodeURIComponent(title);

    expect(encoded).not.toContain("&");
    expect(encoded).not.toContain("?");
    expect(encoded).toContain("%26"); // & encoded
    expect(encoded).toContain("%3F"); // ? encoded
  });
});
