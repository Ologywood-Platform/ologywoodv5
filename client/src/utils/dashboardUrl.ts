import { User } from "@/types";

export const getDashboardUrl = (user?: User | null): string => {
  if (!user) return '/get-started';
  if (!user.role || user.role === 'user') return '/get-started'; // No role or generic 'user' — send to role selection
  if (user.role === 'fan') return '/my-ology';
  return '/workspace';
};
