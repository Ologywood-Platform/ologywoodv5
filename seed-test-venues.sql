-- Seed test venues for MVP testing
-- These venues will be visible in the VenueBrowse page

INSERT INTO venue_profiles (
  userId, organizationName, contactName, contactPhone, location, bio, 
  isListed, website, email, capacity, venueType, amenities, profilePhotoUrl,
  averageRating, reviewCount, emailVerified, profileCompletionScore, createdAt, updatedAt
) VALUES

-- The Blue Room - Intimate Jazz Club
(
  1001, 'The Blue Room', 'Marcus Johnson', '(213) 555-0101', 'Los Angeles, CA',
  'Intimate live music venue in downtown LA featuring local and touring artists. Cozy setting with vintage concert posters and professional stage lighting.',
  true, 'https://theblueroom.com', 'info@theblueroom.com', 300, 'Club',
  JSON_ARRAY('PA System', 'Stage', 'Parking', 'Bar', 'Sound Engineer'),
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
  4.8, 24, true, 85, NOW(), NOW()
),

-- Sunset Theater - Historic Theater
(
  1002, 'Sunset Theater', 'Sarah Chen', '(213) 555-0102', 'Los Angeles, CA',
  'Historic theater hosting concerts, comedy, and theatrical productions. Grand auditorium with ornate architecture and professional theatrical lighting.',
  true, 'https://sunsettheater.com', 'bookings@sunsettheater.com', 800, 'Theater',
  JSON_ARRAY('Full PA System', 'Professional Lighting', 'Dressing Rooms', 'Parking', 'Tech Support'),
  'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=300&fit=crop',
  4.9, 42, true, 90, NOW(), NOW()
),

-- Downtown Club - Modern Nightclub
(
  1003, 'Downtown Club', 'Alex Rodriguez', '(213) 555-0103', 'Los Angeles, CA',
  'Modern nightclub with state-of-the-art sound and lighting. Contemporary design with vibrant LED lighting and professional DJ booth.',
  true, 'https://downtownclub.com', 'info@downtownclub.com', 250, 'Club',
  JSON_ARRAY('DJ Booth', 'Dance Floor', 'Bar', 'Parking', 'Sound System'),
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  4.6, 18, true, 80, NOW(), NOW()
),

-- The Amphitheater - Outdoor Venue
(
  1004, 'The Amphitheater', 'James Wilson', '(805) 555-0104', 'Santa Monica, CA',
  'Outdoor amphitheater perfect for summer concerts and festivals. Beautiful ocean views with natural acoustics and weather protection.',
  true, 'https://amphitheater.com', 'events@amphitheater.com', 1500, 'Outdoor',
  JSON_ARRAY('Outdoor Stage', 'Parking', 'Concessions', 'Seating', 'Sound System'),
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
  4.7, 31, true, 88, NOW(), NOW()
),

-- The Groove Room - Jazz & Blues
(
  1005, 'The Groove Room', 'Diana Martinez', '(323) 555-0105', 'Los Angeles, CA',
  'Dedicated jazz and blues venue with intimate seating and excellent acoustics. Home to weekly jam sessions and touring jazz artists.',
  true, 'https://grooveroom.com', 'info@grooveroom.com', 180, 'Club',
  JSON_ARRAY('Stage', 'PA System', 'Bar', 'Parking', 'Acoustic Design'),
  'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop',
  4.9, 28, true, 87, NOW(), NOW()
),

-- The Warehouse - Alternative & Indie
(
  1006, 'The Warehouse', 'Kevin Park', '(213) 555-0106', 'Downtown LA, CA',
  'Industrial-style venue perfect for alternative, indie, and electronic music. Raw aesthetic with excellent sound system and lighting rig.',
  true, 'https://thewarehouse.com', 'bookings@thewarehouse.com', 400, 'Hall',
  JSON_ARRAY('Industrial Space', 'PA System', 'Lighting Rig', 'Parking', 'Green Room'),
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=300&fit=crop',
  4.5, 15, true, 82, NOW(), NOW()
),

-- The Garden Lounge - Upscale Venue
(
  1007, 'The Garden Lounge', 'Victoria Sterling', '(310) 555-0107', 'Beverly Hills, CA',
  'Upscale lounge featuring live music, fine dining, and cocktails. Elegant atmosphere perfect for corporate events and private performances.',
  true, 'https://gardenlounge.com', 'events@gardenlounge.com', 200, 'Lounge',
  JSON_ARRAY('Fine Dining', 'Bar', 'Elegant Decor', 'Parking', 'Private Rooms'),
  'https://images.unsplash.com/photo-1514432324607-2e467f4af445?w=400&h=300&fit=crop',
  4.8, 22, true, 86, NOW(), NOW()
),

-- The Pavilion - Multi-Purpose Venue
(
  1008, 'The Pavilion', 'Robert Thompson', '(818) 555-0108', 'Pasadena, CA',
  'Multi-purpose venue hosting concerts, festivals, and community events. Flexible space with modern amenities and excellent acoustics.',
  true, 'https://thepavilion.com', 'info@thepavilion.com', 1200, 'Arena',
  JSON_ARRAY('Flexible Stage', 'PA System', 'Lighting', 'Parking', 'Concessions'),
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=300&fit=crop',
  4.7, 35, true, 89, NOW(), NOW()
),

-- The Studio - Recording & Performance
(
  1009, 'The Studio', 'Emma Wilson', '(213) 555-0109', 'Silver Lake, CA',
  'Hybrid venue combining recording studio with live performance space. Perfect for artist showcases, album release parties, and intimate performances.',
  true, 'https://thestudio.com', 'bookings@thestudio.com', 150, 'Studio',
  JSON_ARRAY('Recording Equipment', 'Live Stage', 'Control Room', 'Parking', 'Green Room'),
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
  4.6, 12, true, 81, NOW(), NOW()
),

-- The Rooftop - Sky-High Venue
(
  1010, 'The Rooftop', 'Michael Chang', '(213) 555-0110', 'Downtown LA, CA',
  'Stunning rooftop venue with panoramic city views. Perfect for sunset performances, private events, and intimate concerts with a view.',
  true, 'https://therooftop.com', 'events@therooftop.com', 300, 'Outdoor',
  JSON_ARRAY('Rooftop Space', 'Bar', 'City Views', 'Parking', 'Sound System'),
  'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=300&fit=crop',
  4.8, 26, true, 85, NOW(), NOW()
);

-- Verify the venues were inserted
SELECT COUNT(*) as total_venues FROM venue_profiles WHERE isListed = true;
