import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf-8');

describe('index.html SEO compliance', () => {
  it('title is under 60 characters', () => {
    const match = html.match(/<title>(.*?)<\/title>/);
    expect(match).not.toBeNull();
    const title = match![1];
    expect(title.length).toBeLessThanOrEqual(60);
  });

  it('does not contain fabricated aggregateRating', () => {
    expect(html).not.toContain('aggregateRating');
    expect(html).not.toContain('ratingValue');
    expect(html).not.toContain('ratingCount');
  });

  it('has valid JSON-LD structured data', () => {
    const jsonLdMatch = html.match(
      /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
    );
    expect(jsonLdMatch).not.toBeNull();
    const parsed = JSON.parse(jsonLdMatch![1]);
    expect(parsed['@type']).toBe('WebApplication');
    expect(parsed.name).toBeDefined();
    expect(parsed.url).toBeDefined();
  });

  it('has noscript fallback content', () => {
    expect(html).toContain('<noscript>');
    expect(html).toContain('Chkobba en Ligne');
    expect(html).toContain('JavaScript est requis');
  });

  it('has meta description', () => {
    expect(html).toMatch(/<meta name="description" content=".+"/);
  });

  it('has canonical URL', () => {
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/chkobba\.app\/"/);
  });

  it('has Open Graph tags', () => {
    expect(html).toMatch(/<meta property="og:title"/);
    expect(html).toMatch(/<meta property="og:description"/);
    expect(html).toMatch(/<meta property="og:image"/);
  });

  it('preloads critical assets', () => {
    expect(html).toContain('rel="preload" href="/quadrilato.png"');
  });

  it('does not reference external texture URLs', () => {
    // The transparenttextures.com URL was removed from GameTable
    // Verify it's not in the HTML either
    expect(html).not.toContain('transparenttextures.com');
  });
});
