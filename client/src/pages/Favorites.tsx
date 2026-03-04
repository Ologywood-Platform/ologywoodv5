import { useEffect } from "react";
import { useLocation } from "wouter";

// Redirect /favorites to /following (the working implementation)
export default function Favorites() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/following", { replace: true });
  }, [navigate]);
  return null;
}
