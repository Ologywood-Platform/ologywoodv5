import { router, publicProcedure } from "../_core/trpc";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Realistic test data generators
const firstNames = [
  "Alex", "Jordan", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn",
  "Jamie", "Sam", "Chris", "Pat", "Dakota", "Skyler", "River", "Phoenix"
];

const lastNames = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
  "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson",
  "Anderson", "Taylor", "Thomas", "Moore", "Jackson", "Martin"
];

const artistNames = [
  "The Echoes", "Neon Pulse", "Silent Storm", "Velvet Dreams", "Electric Soul",
  "Midnight Jazz", "Urban Legends", "Crystal Sound", "Rhythm & Blues Co.",
  "Sonic Wave", "The Harmonics", "Stellar Vibes", "Cosmic Beats", "Luna Sound",
  "Phoenix Rising", "The Wanderers", "Sunset Boulevard", "Midnight Express"
];

const venueNames = [
  "The Grand Hall", "Riverside Lounge", "Downtown Theater", "Sunset Club",
  "The Warehouse", "Rooftop Garden", "The Pavilion", "Crystal Ballroom",
  "Urban Lofts", "The Amphitheater", "Moonlight Venue", "The Studio",
  "Riverside Events", "The Atrium", "Golden Stage", "The Forum"
];

const genres = [
  "Rock", "Pop", "Jazz", "Blues", "Hip-Hop", "Electronic", "Country",
  "R&B", "Soul", "Reggae", "Latin", "Classical", "Folk", "Indie"
];

const eventTypes = [
  "Wedding", "Corporate Event", "Bar Gig", "Festival", "Private Party",
  "Conference", "Charity Event", "Birthday Party", "Anniversary", "Graduation"
];

const cities = [
  "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia",
  "San Antonio", "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville",
  "Fort Worth", "Columbus", "Charlotte", "San Francisco", "Indianapolis", "Seattle"
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomEmail(): string {
  return `test${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
}

function generateArtistData() {
  return {
    artistName: randomElement(artistNames),
    genre: randomElement(genres),
    location: `${randomElement(cities)}, ${["NY", "CA", "TX", "FL", "IL"][Math.floor(Math.random() * 5)]}`,
    bio: "Talented performer with years of experience. Available for bookings.",
    feeRangeMin: randomNumber(300, 800),
    feeRangeMax: randomNumber(1500, 5000),
    touringPartySize: randomNumber(1, 8),
  };
}

function generateVenueData() {
  return {
    organizationName: randomElement(venueNames),
    contactName: `${randomElement(firstNames)} ${randomElement(lastNames)}`,
    contactPhone: `555${randomNumber(100, 999)}${randomNumber(1000, 9999)}`,
    location: `${randomElement(cities)}, ${["NY", "CA", "TX", "FL", "IL"][Math.floor(Math.random() * 5)]}`,
    capacity: randomNumber(50, 1000),
    venueType: ["Bar/Club", "Theater", "Ballroom", "Outdoor", "Restaurant"][Math.floor(Math.random() * 5)],
  };
}

function generateBookingData() {
  const eventDate = new Date();
  eventDate.setDate(eventDate.getDate() + randomNumber(7, 90));
  
  return {
    eventType: randomElement(eventTypes),
    eventDate: eventDate.toISOString().split('T')[0],
    eventLocation: `${randomElement(cities)}, ${["NY", "CA", "TX", "FL", "IL"][Math.floor(Math.random() * 5)]}`,
    estimatedAttendees: randomNumber(50, 500),
    specialRequirements: "Standard setup with sound system and lighting",
    depositAmount: randomNumber(200, 800),
    totalBudget: randomNumber(1000, 5000),
  };
}

export const testdataRouter = router({
  generateArtists: publicProcedure
    .input(z.object({ count: z.number().min(1).max(100).default(5) }))
    .mutation(async ({ input }: { input: { count: number } }) => {
      const artists = [];
      for (let i = 0; i < input.count; i++) {
        artists.push(generateArtistData());
      }
      return {
        success: true,
        count: artists.length,
        data: artists,
        message: `Generated ${artists.length} realistic artist profiles`
      };
    }),

  generateVenues: publicProcedure
    .input(z.object({ count: z.number().min(1).max(100).default(5) }))
    .mutation(async ({ input }: { input: { count: number } }) => {
      const venues = [];
      for (let i = 0; i < input.count; i++) {
        venues.push(generateVenueData());
      }
      return {
        success: true,
        count: venues.length,
        data: venues,
        message: `Generated ${venues.length} realistic venue profiles`
      };
    }),

  generateBookings: publicProcedure
    .input(z.object({ count: z.number().min(1).max(100).default(5) }))
    .mutation(async ({ input }: { input: { count: number } }) => {
      const bookings = [];
      for (let i = 0; i < input.count; i++) {
        bookings.push(generateBookingData());
      }
      return {
        success: true,
        count: bookings.length,
        data: bookings,
        message: `Generated ${bookings.length} realistic booking requests`
      };
    }),

  generateTestScenario: publicProcedure
    .input(z.object({
      artists: z.number().min(1).max(50).default(3),
      venues: z.number().min(1).max(50).default(3),
      bookings: z.number().min(1).max(50).default(5)
    }))
    .mutation(async ({ input }: { input: { artists: number; venues: number; bookings: number } }) => {
      const artists = [];
      const venues = [];
      const bookings = [];

      for (let i = 0; i < input.artists; i++) {
        artists.push(generateArtistData());
      }

      for (let i = 0; i < input.venues; i++) {
        venues.push(generateVenueData());
      }

      for (let i = 0; i < input.bookings; i++) {
        bookings.push(generateBookingData());
      }

      return {
        success: true,
        scenario: {
          artists: {
            count: artists.length,
            data: artists
          },
          venues: {
            count: venues.length,
            data: venues
          },
          bookings: {
            count: bookings.length,
            data: bookings
          }
        },
        message: `Generated complete test scenario: ${artists.length} artists, ${venues.length} venues, ${bookings.length} bookings`
      };
    }),

  getGeneratorStats: publicProcedure
    .query(async () => {
      return {
        availableArtists: artistNames.length,
        availableVenues: venueNames.length,
        availableGenres: genres.length,
        availableEventTypes: eventTypes.length,
        availableCities: cities.length,
        maxBatchSize: 100,
        message: "Test data generator ready"
      };
    })
});
