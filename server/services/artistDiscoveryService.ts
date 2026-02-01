export const artistDiscoveryService = {
  async getFeaturedArtists(limit: number = 6): Promise<any[]> { return []; },
  async getTrendingArtists(limit: number = 6): Promise<any[]> { return []; },
  async getNewArtists(limit: number = 6): Promise<any[]> { return []; },
  async getArtistsByGenre(genre: string, limit: number = 6): Promise<any[]> { return []; },
  async getHomepageDiscovery(): Promise<any[]> { return []; },
  async getPopularGenres(limit: number = 8): Promise<any[]> { return []; },
  async getPersonalizedRecommendations(userId: number, userGenres: string[], limit: number = 6): Promise<any[]> { return []; },
};
