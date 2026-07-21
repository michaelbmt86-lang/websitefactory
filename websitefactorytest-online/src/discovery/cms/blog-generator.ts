// ============================================================================
// BLOG GENERATOR (CMS Generator Engine)
//
// Generates CMS blog post pages from the posts table. Maps blog/article URLs
// from site_urls to their corresponding post content. No site-specific logic.
// ============================================================================

import db from "@/lib/db";
import type { CmsPage } from "@/types/discovery";
import type { ProjectIdentity } from "../../../deployment/types/identity";

interface DbPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  featured_image: string;
  is_published: number;
  created_at: string;
}

export function generateBlogPosts(identity: ProjectIdentity): {
  posts: CmsPage[];
  blogPostsGenerated: number;
} {
  // Get all posts from the posts table
  const posts = db.prepare("SELECT * FROM posts ORDER BY created_at DESC").all() as DbPost[];

  let blogPostsGenerated = 0;

  for (const post of posts) {
    const postUrl = `https://${identity.productDomain}/blog/${post.slug}`;
    const existingPage = db.prepare("SELECT id FROM cms_pages WHERE url = ?").get(postUrl) as { id: number } | undefined;

    if (existingPage) {
      // Update existing page with blog content
      db.prepare(`
        UPDATE cms_pages SET
          title = ?,
          description = ?,
          page_type = 'blog-post',
          og_title = ?,
          og_description = ?,
          og_image = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE url = ?
      `).run(
        post.title,
        post.excerpt || "",
        post.title,
        post.excerpt || "",
        post.featured_image || "",
        postUrl
      );
    } else {
      // Insert new blog post page
      db.prepare(`
        INSERT INTO cms_pages (url, slug, title, description, page_type, source_table, source_id,
          meta_title, meta_description, og_title, og_description, og_image, status)
        VALUES (?, ?, ?, ?, 'blog-post', 'posts', ?, ?, ?, ?, ?, ?, ?)
      `).run(
        postUrl,
        `blog-${post.slug}`,
        post.title,
        post.excerpt || "",
        post.id,
        post.title,
        post.excerpt || "",
        post.title,
        post.excerpt || "",
        post.featured_image || "",
        post.is_published ? "published" : "draft"
      );
    }

    blogPostsGenerated++;
  }

  const blogPages = db.prepare(
    "SELECT * FROM cms_pages WHERE page_type = 'blog-post' ORDER BY title"
  ).all() as CmsPage[];

  return {
    posts: blogPages,
    blogPostsGenerated,
  };
}
