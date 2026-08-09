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
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>
          <div>
            <h1 className="text-lg font-bold">Project Previews</h1>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Showcase upcoming albums, EPs, and mixtapes
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <PageBreadcrumb
          className="mb-4"
          segments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Project Previews' },
          ]}
        />
        <ProjectPreviewManager />
      </div>
    </div>
  );
}
