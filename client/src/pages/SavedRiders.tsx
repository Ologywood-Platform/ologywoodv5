import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * SavedRiders page - redirects to the unified RiderBuilder
 * The RiderBuilder now handles both template management and creation
 */
export default function SavedRiders() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/rider-builder");
  }, [navigate]);
  return null;
}
