import { User } from "@/types";

export const getDashboardUrl = (user?: User | null): string => {
  if (!user) return '/get-started';
  if (!user.role || user.role === 'user') return '/get-started'; // No role or generic 'user' — send to role selection
  if (user.role === 'fan') return '/'; // Fans go to homepage to browse and discover
  if (user.role === 'venue') return '/venue-dashboard';
  if (user.role === 'admin') return '/admin';
  if (user.role === 'blogger') return '/admin/blog'; // Bloggers go directly to blog management
  return '/dashboard'; // Default to artist dashboard
};
