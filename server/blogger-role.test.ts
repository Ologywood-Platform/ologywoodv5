import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Blogger Role Feature', () => {
  // ============ SCHEMA ============
  describe('Database Schema', () => {
    it('should include "blogger" in the role enum', () => {
      const schemaContent = fs.readFileSync(
        path.resolve(__dirname, '../drizzle/schema.ts'),
        'utf-8'
      );
      expect(schemaContent).toContain('"blogger"');
      expect(schemaContent).toContain('mysqlEnum("role"');
    });
  });

  // ============ BLOG ROUTER ============
  describe('Blog Router Permissions', () => {
    it('should use blogAccess middleware instead of adminOnly', () => {
      const blogRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/blog.ts'),
        'utf-8'
      );
      // Should have blogAccess middleware
      expect(blogRouterContent).toContain('blogAccess');
      // Should check for blogger role
      expect(blogRouterContent).toContain("user.role === 'blogger'");
      // Should NOT have adminOnly (replaced with blogAccess)
      expect(blogRouterContent).not.toContain('const adminOnly');
    });

    it('should allow bloggers to access all blog CRUD operations', () => {
      const blogRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/blog.ts'),
        'utf-8'
      );
      // All admin blog endpoints should use blogAccess
      expect(blogRouterContent).toContain('adminList: blogAccess');
      expect(blogRouterContent).toContain('adminGetById: blogAccess');
      expect(blogRouterContent).toContain('create: blogAccess');
      expect(blogRouterContent).toContain('update: blogAccess');
      expect(blogRouterContent).toContain('setStatus: blogAccess');
      expect(blogRouterContent).toContain('uploadCoverImage: blogAccess');
      expect(blogRouterContent).toContain('delete: blogAccess');
    });

    it('should still allow admins and owners to access blog', () => {
      const blogRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/blog.ts'),
        'utf-8'
      );
      expect(blogRouterContent).toContain("user.role === 'admin'");
      expect(blogRouterContent).toContain('OWNER_OPEN_ID');
    });
  });

  // ============ ADMIN ROUTER ============
  describe('Admin Router - changeRole', () => {
    it('should include "blogger" in the changeRole enum', () => {
      const adminRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/admin.ts'),
        'utf-8'
      );
      expect(adminRouterContent).toContain("'admin', 'artist', 'venue', 'user', 'blogger'");
    });

    it('should include blogger in role labels', () => {
      const adminRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/admin.ts'),
        'utf-8'
      );
      expect(adminRouterContent).toContain("blogger: 'Blogger'");
    });

    it('should include blogger in role descriptions', () => {
      const adminRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/admin.ts'),
        'utf-8'
      );
      expect(adminRouterContent).toContain("blogger:");
      expect(adminRouterContent).toContain("blog posts");
    });

    it('should include blogger in getUsers filter', () => {
      const adminRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/admin.ts'),
        'utf-8'
      );
      expect(adminRouterContent).toContain('"blogger"');
    });
  });

  // ============ FRONTEND ============
  describe('Frontend - Admin Dashboard', () => {
    it('should include blogger in role options dropdown', () => {
      const dashboardContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/pages/AdminDashboard.tsx'),
        'utf-8'
      );
      expect(dashboardContent).toContain("value: 'blogger'");
      expect(dashboardContent).toContain("label: 'Blogger'");
    });

    it('should include blogger in role filter dropdown', () => {
      const dashboardContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/pages/AdminDashboard.tsx'),
        'utf-8'
      );
      expect(dashboardContent).toContain('<option value="blogger">Bloggers</option>');
    });

    it('should include blogger in role badge colors', () => {
      const dashboardContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/pages/AdminDashboard.tsx'),
        'utf-8'
      );
      expect(dashboardContent).toContain("case 'blogger':");
      expect(dashboardContent).toContain('bg-pink-100 text-pink-700');
    });

    it('should include blogger in role descriptions', () => {
      const dashboardContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/pages/AdminDashboard.tsx'),
        'utf-8'
      );
      expect(dashboardContent).toContain("blogger: 'Blog management access");
    });

    it('should include blogger in changeRole mutation type', () => {
      const dashboardContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/pages/AdminDashboard.tsx'),
        'utf-8'
      );
      expect(dashboardContent).toContain("'blogger'");
    });
  });

  // ============ NAVIGATION ============
  describe('Navigation - Dashboard URL', () => {
    it('should route bloggers to /admin/blog', () => {
      const dashboardUrlContent = fs.readFileSync(
        path.resolve(__dirname, '../client/src/utils/dashboardUrl.ts'),
        'utf-8'
      );
      expect(dashboardUrlContent).toContain("user.role === 'blogger'");
      expect(dashboardUrlContent).toContain("'/admin/blog'");
    });
  });

  // ============ DB HELPER ============
  describe('Database Helper', () => {
    it('should include blogger in updateUserRole type', () => {
      const dbContent = fs.readFileSync(
        path.resolve(__dirname, './db.ts'),
        'utf-8'
      );
      expect(dbContent).toContain('"blogger"');
    });
  });

  // ============ ROLE ACCESS LOGIC ============
  describe('Role Access Logic', () => {
    it('blogger should NOT have admin dashboard access', () => {
      // Bloggers should only access /admin/blog, not the full admin dashboard
      // The admin router uses adminOnly middleware which checks role === 'admin'
      const adminRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/admin.ts'),
        'utf-8'
      );
      // adminOnly middleware should NOT include blogger
      expect(adminRouterContent).toContain("user.role === 'admin'");
      // The adminOnly middleware should not check for blogger
      const adminOnlySection = adminRouterContent.match(/const adminOnly[\s\S]*?return opts\.next/);
      if (adminOnlySection) {
        expect(adminOnlySection[0]).not.toContain("blogger");
      }
    });

    it('blogger should have blog management access', () => {
      const blogRouterContent = fs.readFileSync(
        path.resolve(__dirname, './routers/blog.ts'),
        'utf-8'
      );
      expect(blogRouterContent).toContain("user.role === 'blogger'");
    });
  });
});
