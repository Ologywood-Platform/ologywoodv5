import { useLocation } from "wouter";

/**
 * RiderTemplates page - redirects to the unified RiderBuilder
 * The RiderBuilder now handles both template management and creation
 */
export function RiderTemplates() {
  const [, navigate] = useLocation();
  // Redirect to the unified rider builder
  navigate("/rider-builder");
  return null;
}
