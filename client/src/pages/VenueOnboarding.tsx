import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function VenueOnboarding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Venue Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Venue onboarding is currently being updated. Please try again later.
          </p>
          <a href="/dashboard">
            <Button variant="outline" className="w-full">← Back to Dashboard</Button>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
