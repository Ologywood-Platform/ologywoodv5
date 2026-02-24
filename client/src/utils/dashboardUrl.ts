import { User } from "@/types";

export const getDashboardUrl = (user?: User | null): string => {
  if (!user) return '/dashboard';
  if (user.role === 'venue') return '/venue-dashboard';
  if (user.role === 'admin') return '/admin';
  return '/dashboard'; // Default to artist dashboard
};
