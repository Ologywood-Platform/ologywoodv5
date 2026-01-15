import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Calendar, MessageSquare, Shield, Search, LogOut, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";

function LogoutButton() {
  const logoutMutation = trpc.auth.logout.useMutation();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    window.location.href = '/';
  };

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-red-600 hover:text-red-700"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      <LogOut className="h-4 w-4 mr-2" />
      {logoutMutation.isPending ? 'Logging out...' : 'Logout'}
    </Button>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: artists, isLoading } = trpc.artist.getAll.useQuery();

  const filteredArtists = artists?.filter(artist => 
    searchQuery === "" || 
    artist.artistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-primary">
            <Music className="h-8 w-8" />
            Ologywood
          </Link>
          
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <a>
                    <Button variant="ghost" asChild>
                      <span>Dashboard</span>
                    </Button>
                  </a>
                </Link>
                <span className="text-sm text-muted-foreground">
                  {user?.name || user?.email}
                </span>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/browse">
                  <a>
                    <Button variant="ghost" asChild>
                      <span>Browse Artists</span>
                    </Button>
                  </a>
                </Link>
                <a href={getLoginUrl()}>
                  <Button>Sign In</Button>
                </a>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-background py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-6 text-foreground">
            Book Talented Artists for Your Events
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with performing artists, manage bookings, and streamline your event planning all in one place.
          </p>
          
          {!isAuthenticated && (
            <div className="flex gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="text-lg px-8">
                  Get Started
                </Button>
              </a>
              <Link href="/browse">
                <a>
                  <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                    <span>Browse Artists</span>
                  </Button>
                </a>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Search Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-6">Find Your Perfect Artist</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                type="text"
                placeholder="Search by artist name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-6 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Artists */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Featured Artists</h2>
          
          {isLoading ? (
            <div className="text-center text-muted-foreground">Loading artists...</div>
          ) : filteredArtists && filteredArtists.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArtists.slice(0, 6).map((artist) => (
                <a key={artist.id} href={`/artist/${artist.id}`} className="no-underline">
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        {artist.profilePhotoUrl ? (
                          <img 
                            src={artist.profilePhotoUrl} 
                            alt={artist.artistName}
                            className="w-full h-48 object-cover rounded-md mb-4"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-primary/10 to-accent/10 rounded-md mb-4 flex items-center justify-center">
                            <Music className="h-16 w-16 text-primary" />
                          </div>
                        )}
                        <CardTitle>{artist.artistName}</CardTitle>
                        <CardDescription>
                          {Array.isArray(artist.genre) && artist.genre.length > 0 
                            ? artist.genre.join(", ") 
                            : "Various Genres"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          {artist.location && (
                            <p>📍 {artist.location}</p>
                          )}
                          {artist.feeRangeMin && artist.feeRangeMax && (
                            <p>💰 ${artist.feeRangeMin} - ${artist.feeRangeMax}</p>
                          )}
                        </div>
                      </CardContent>
                  </Card>
                </a>              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                {searchQuery ? "No artists found matching your search." : "No artists available yet."}
              </p>
              {isAuthenticated && user?.role === 'artist' && (
                <Link href="/dashboard">
                  <a>
                    <Button asChild>
                      <span>Create Your Artist Profile</span>
                    </Button>
                  </a>
                </Link>
              )}
            </div>
          )}
          
          {filteredArtists && filteredArtists.length > 6 && (
            <div className="text-center mt-8">
              <Link href="/browse">
                <a>
                  <Button variant="outline" size="lg" asChild>
                    <span>View All Artists</span>
                  </Button>
                </a>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose Ologywood?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Music className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Talented Artists</h3>
              <p className="text-muted-foreground">
                Browse verified performing artists across all genres
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
              <p className="text-muted-foreground">
                Check availability and book artists in just a few clicks
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Direct Communication</h3>
              <p className="text-muted-foreground">
                Message artists directly to discuss your event details
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-accent/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Secure Platform</h3>
              <p className="text-muted-foreground">
                Safe and reliable booking management for all parties
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary/80 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join Ologywood today and discover the easiest way to book talented artists for your events.
          </p>
          {!isAuthenticated && (
            <a href={getLoginUrl()} style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="secondary" className="text-lg px-8">
                Sign Up Now
              </Button>
            </a>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2026 Ologywood. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
