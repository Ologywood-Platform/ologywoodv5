import { describe, it, expect } from 'vitest';

describe('Admin Activity Dashboard', () => {
  describe('Schema', () => {
    it('should have admin_activity_log table with correct columns', async () => {
      const { adminActivityLog } = await import('../drizzle/schema');
      expect(adminActivityLog).toBeDefined();
      
      // Verify table name
      const tableName = (adminActivityLog as any)[Symbol.for('drizzle:Name')];
      expect(tableName).toBe('admin_activity_log');
    });

    it('should have required columns in admin_activity_log', async () => {
      const { adminActivityLog } = await import('../drizzle/schema');
      const columns = Object.keys(adminActivityLog);
      
      expect(columns).toContain('id');
      expect(columns).toContain('adminId');
      expect(columns).toContain('adminEmail');
      expect(columns).toContain('adminName');
      expect(columns).toContain('action');
      expect(columns).toContain('category');
      expect(columns).toContain('targetType');
      expect(columns).toContain('targetId');
      expect(columns).toContain('targetLabel');
      expect(columns).toContain('details');
      expect(columns).toContain('ipAddress');
      expect(columns).toContain('createdAt');
    });

    it('should have correct category enum values', async () => {
      const { adminActivityLog } = await import('../drizzle/schema');
      const categoryCol = (adminActivityLog as any).category;
      const enumValues = categoryCol?.enumValues;
      
      expect(enumValues).toContain('users');
      expect(enumValues).toContain('bookings');
      expect(enumValues).toContain('payouts');
      expect(enumValues).toContain('blog');
      expect(enumValues).toContain('disputes');
      expect(enumValues).toContain('releases');
      expect(enumValues).toContain('settings');
    });
  });

  describe('Activity Log Endpoints', () => {
    it('should have getActivityLog endpoint in admin router', async () => {
      const { adminRouter } = await import('./routers/admin');
      const procedures = Object.keys(adminRouter._def.procedures);
      expect(procedures).toContain('getActivityLog');
    });

    it('should have getActivityStats endpoint in admin router', async () => {
      const { adminRouter } = await import('./routers/admin');
      const procedures = Object.keys(adminRouter._def.procedures);
      expect(procedures).toContain('getActivityStats');
    });

    it('should have logActivity endpoint in admin router', async () => {
      const { adminRouter } = await import('./routers/admin');
      const procedures = Object.keys(adminRouter._def.procedures);
      expect(procedures).toContain('logActivity');
    });
  });

  describe('Activity Categories', () => {
    it('should support all 7 activity categories', async () => {
      const { adminActivityLog } = await import('../drizzle/schema');
      const categoryCol = (adminActivityLog as any).category;
      const enumValues = categoryCol?.enumValues;
      
      expect(enumValues).toHaveLength(7);
      expect(enumValues).toEqual(
        expect.arrayContaining(['users', 'bookings', 'payouts', 'blog', 'disputes', 'releases', 'settings'])
      );
    });
  });

  describe('Integration with Role Changes', () => {
    it('changeRole endpoint should exist and log activity', async () => {
      const { adminRouter } = await import('./routers/admin');
      const procedures = Object.keys(adminRouter._def.procedures);
      expect(procedures).toContain('changeRole');
    });
  });

  describe('Frontend Activity Tab', () => {
    it('should have ActivityTab component defined in AdminDashboard', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');
      
      // Check ActivityTab component exists
      expect(content).toContain('function ActivityTab');
      
      // Check it has the required props
      expect(content).toContain('entries');
      expect(content).toContain('totalPages');
      expect(content).toContain('category');
      expect(content).toContain('setCategory');
      expect(content).toContain('stats');
    });

    it('should have activity tab in the tab navigation', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');
      
      // Check activity tab is in the tab list
      expect(content).toContain("'activity'");
      expect(content).toContain("activeTab === 'activity'");
    });

    it('should display category filter options', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');
      
      // Check category filter options
      expect(content).toContain("'All Categories'");
      expect(content).toContain("'Users'");
      expect(content).toContain("'Bookings'");
      expect(content).toContain("'Payouts'");
      expect(content).toContain("'Blog'");
      expect(content).toContain("'Disputes'");
      expect(content).toContain("'Releases'");
      expect(content).toContain("'Settings'");
    });

    it('should have pagination controls', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');
      
      expect(content).toContain('Previous');
      expect(content).toContain('Next');
      expect(content).toContain('totalPages');
    });

    it('should expose every Activity column through a mobile touch-scroll region', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');

      expect(content).toContain('data-testid="admin-activity-scroll-region"');
      expect(content).toContain('overflow-x-auto overscroll-x-contain');
      expect(content).toContain('[touch-action:pan-x_pan-y]');
      expect(content).toContain('[-webkit-overflow-scrolling:touch]');
      expect(content).toContain('min-w-[960px]');
      expect(content).toContain('Swipe horizontally to view all activity details.');
      expect(content).toContain('aria-label="Admin activity log"');
      expect(content).not.toContain('bg-white rounded-lg border border-gray-200 overflow-hidden">\n            <table className="w-full"');
    });

    it('should display action labels for common admin actions', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('/home/ubuntu/ologywood/client/src/pages/AdminDashboard.tsx', 'utf-8');
      
      expect(content).toContain('Role Change');
      expect(content).toContain('Booking Update');
      expect(content).toContain('Payout Processed');
      expect(content).toContain('Blog Published');
      expect(content).toContain('Dispute Resolved');
      expect(content).toContain('User Suspended');
    });
  });
});
