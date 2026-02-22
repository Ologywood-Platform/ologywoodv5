-- Ologywood Minimal Seed Data (6 Artists + 6 Venues)
-- Use this in the Manus Management UI Database panel to populate test data

-- ============= CREATE TEST USERS FOR ARTISTS =============

INSERT INTO users (email, name, role, emailVerified, createdAt, updatedAt) VALUES
('artist1@ologywood.test', 'Luna Echo', 'artist', 1, NOW(), NOW()),
('artist2@ologywood.test', 'The Midnight Collective', 'artist', 1, NOW(), NOW()),
('artist3@ologywood.test', 'Jazz Legends Quartet', 'artist', 1, NOW(), NOW()),
('artist4@ologywood.test', 'Acoustic Soul Sessions', 'artist', 1, NOW(), NOW()),
('artist5@ologywood.test', 'Retro Vibes Band', 'artist', 1, NOW(), NOW()),
('artist6@ologywood.test', 'Urban Beats Collective', 'artist', 1, NOW(), NOW());

-- ============= CREATE TEST USERS FOR VENUES =============

INSERT INTO users (email, name, role, emailVerified, createdAt, updatedAt) VALUES
('venue1@ologywood.test', 'The Grand Theater', 'venue', 1, NOW(), NOW()),
('venue2@ologywood.test', 'Brooklyn Music Hall', 'venue', 1, NOW(), NOW()),
('venue3@ologywood.test', 'Jazz Club New Orleans', 'venue', 1, NOW(), NOW()),
('venue4@ologywood.test', 'Nashville Ryman Auditorium', 'venue', 1, NOW(), NOW()),
('venue5@ologywood.test', 'Austin Live Music Venue', 'venue', 1, NOW(), NOW()),
('venue6@ologywood.test', 'Atlanta State Farm Arena', 'venue', 1, NOW(), NOW());

-- ============= CREATE ARTIST PROFILES =============

INSERT INTO artist_profiles (userId, artistName, genre, bio, location, feeRangeMin, feeRangeMax, touringPartySize, profilePhotoUrl, websiteUrl, socialLinks, createdAt, updatedAt) VALUES
(1, 'Luna Echo', JSON_ARRAY('indie', 'pop'), 'Ethereal indie-pop artist known for captivating live performances.', 'Los Angeles, CA', 1500, 3500, 2, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 'https://lunaecho.music', JSON_OBJECT('instagram', '@lunaecho', 'spotify', 'luna-echo'), NOW(), NOW()),
(2, 'The Midnight Collective', JSON_ARRAY('electronic', 'dance'), 'High-energy electronic band with cutting-edge production.', 'New York, NY', 2000, 5000, 4, 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', 'https://midnightcollective.live', JSON_OBJECT('instagram', '@midnightcollective', 'twitter', '@MidnightLive'), NOW(), NOW()),
(3, 'Jazz Legends Quartet', JSON_ARRAY('jazz', 'blues'), 'Award-winning jazz quartet with sophisticated improvisation.', 'New Orleans, LA', 1200, 2800, 4, 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop', 'https://jazzlegends.com', JSON_OBJECT('instagram', '@jazzlegends', 'spotify', 'jazz-legends-quartet'), NOW(), NOW()),
(4, 'Acoustic Soul Sessions', JSON_ARRAY('folk', 'acoustic', 'soul'), 'Intimate acoustic performances with original compositions.', 'Nashville, TN', 800, 2000, 1, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop', 'https://acousticsoul.live', JSON_OBJECT('instagram', '@acousticsoul', 'youtube', '@AcousticSoulSessions'), NOW(), NOW()),
(5, 'Retro Vibes Band', JSON_ARRAY('funk', 'soul', 'disco'), 'Groovy funk and soul band with infectious energy.', 'Austin, TX', 1800, 4000, 5, 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop', 'https://retrovibesband.com', JSON_OBJECT('instagram', '@retrovibesband', 'facebook', 'RetroVibeBand'), NOW(), NOW()),
(6, 'Urban Beats Collective', JSON_ARRAY('hip-hop', 'rap'), 'Dynamic hip-hop collective with high-energy performances.', 'Atlanta, GA', 1500, 3500, 3, 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 'https://urbanbeats.live', JSON_OBJECT('instagram', '@urbanbeatscollective', 'twitter', '@UrbanBeatsLive'), NOW(), NOW());

-- ============= CREATE VENUE PROFILES =============

INSERT INTO venue_profiles (userId, venueName, capacity, city, state, location, venueType, bio, profilePhotoUrl, websiteUrl, socialLinks, createdAt, updatedAt) VALUES
(7, 'The Grand Theater', 1500, 'Los Angeles', 'CA', 'Los Angeles, CA', 'Theater', 'Historic theater hosting world-class performances.', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop', 'https://thegrandtheater.com', JSON_OBJECT('instagram', '@thegrandtheater', 'twitter', '@GrandTheater'), NOW(), NOW()),
(8, 'Brooklyn Music Hall', 800, 'New York', 'NY', 'New York, NY', 'Music Hall', 'Intimate music venue in the heart of Brooklyn.', 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop', 'https://brooklynmusichall.com', JSON_OBJECT('instagram', '@brooklynmusichall', 'twitter', '@BrooklynMusic'), NOW(), NOW()),
(9, 'Jazz Club New Orleans', 300, 'New Orleans', 'LA', 'New Orleans, LA', 'Jazz Club', 'Legendary jazz club with authentic New Orleans atmosphere.', 'https://images.unsplash.com/photo-1511379938547-c1f69b13d835?w=400&h=400&fit=crop', 'https://jazzclubneworleans.com', JSON_OBJECT('instagram', '@jazzclubno', 'facebook', 'JazzClubNewOrleans'), NOW(), NOW()),
(10, 'Nashville Ryman Auditorium', 2300, 'Nashville', 'TN', 'Nashville, TN', 'Auditorium', 'Historic auditorium - Mother Church of Country Music.', 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop', 'https://ryman.com', JSON_OBJECT('instagram', '@rymanaudi', 'twitter', '@RymanAuditorium'), NOW(), NOW()),
(11, 'Austin Live Music Venue', 600, 'Austin', 'TX', 'Austin, TX', 'Live Music Venue', 'Premier live music destination in Austin.', 'https://images.unsplash.com/photo-1487180144351-b8472da7d491?w=400&h=400&fit=crop', 'https://austinlivemusic.com', JSON_OBJECT('instagram', '@austinlivemusic', 'twitter', '@AustinLive'), NOW(), NOW()),
(12, 'Atlanta State Farm Arena', 20000, 'Atlanta', 'GA', 'Atlanta, GA', 'Arena', 'Large-scale arena for major concerts and events.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop', 'https://statefarmarenatl.com', JSON_OBJECT('instagram', '@statefarmarenatl', 'twitter', '@StateFarmArena'), NOW(), NOW());

-- ============= VERIFY DATA =============

SELECT 'Artists Created:' as status, COUNT(*) as count FROM artist_profiles;
SELECT 'Venues Created:' as status, COUNT(*) as count FROM venue_profiles;
SELECT 'Users Created:' as status, COUNT(*) as count FROM users WHERE role IN ('artist', 'venue');
