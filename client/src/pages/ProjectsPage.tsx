import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { ProjectPreviewManager } from '@/components/ProjectPreviewManager';
import PageBreadcrumb from '@/components/PageBreadcrumb';
import { SiteHeader } from "@/components/SiteHeader";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
        </div>

        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Project Previews' },
          ]}
        />
        <ProjectPreviewManager />
      </main>
    </div>
  );
}
