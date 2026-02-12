/**
 * Centralized Auth Domain Types
 * Single source of truth for authentication and authorization types
 */

export type UserRole = "artist" | "venue" | "admin";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
  name?: string;
  profileComplete: boolean;
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}
