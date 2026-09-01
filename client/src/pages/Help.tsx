import React, { useState, useEffect } from 'react';
import { ChevronDown, Search, Mail, MessageCircle, Phone } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import { setMetaTags, pageMetaTags } from '@/utils/seoMeta';

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  // Getting Started
  {
    id: 'getting-started-1',
    category: 'Getting Started',
    question: 'How do I create an account?',
    answer: 'Click the "Sign Up" button on the homepage. You can sign up with your email or use Google/social login. After verifying your email, choose your role: Artist, Venue, or Fan. Each role unlocks different features tailored to your needs.',
  },
  {
    id: 'getting-started-2',
    category: 'Getting Started',
    question: 'What are the different account types?',
    answer: 'Ologywood has several account types tailored to different needs. Talent accounts (Artist, Athlete, Creator, Band, DJ, Comedian, Actor, Influencer, Speaker) are for performers and creators who want to get booked, sell music, grow their fanbase, and run Fan Clubs. Venue accounts are for event organizers and clubs looking to book talent. Fan/User accounts let you browse, follow talent, book for private events, purchase music, join Fan Clubs, and leave reviews. Blogger accounts are for content creators who write blog posts for the platform.',
  },
  {
    id: 'getting-started-3',
    category: 'Getting Started',
    question: 'Is there a fee to join Ologywood?',
    answer: 'Joining is free! The Free tier includes basic features and up to 2 bookings per month. Premium subscriptions (Starter at $9/month, Professional at $29/month, and Enterprise at $79/month) unlock advanced features like unlimited bookings, Rider Builder, contracts, e-signatures, analytics, sponsor showcase, media kit, and more.',
  },
  {
    id: 'getting-started-4',
    category: 'Getting Started',
    question: 'How do I set up my artist profile?',
    answer: 'After selecting the Artist role, complete the onboarding form with your bio, genres, location, and pricing. Upload a professional profile photo. Then visit Edit Profile from your Dashboard to add social links, tip links (Cash App, Venmo, etc.), and media. Set your availability calendar so venues can see when you are free.',
  },

  // Booking & Contracts
  {
    id: 'booking-1',
    category: 'Booking & Contracts',
    question: 'How do I book an artist?',
    answer: 'Browse the artist directory, view profiles and availability, and click the booking button. Fill in the event date, time, venue address (street, city, state, zip), offered fee, and event details. The artist will review your request and respond. Once accepted, a digital contract can be generated for both parties to sign.',
  },
  {
    id: 'booking-2',
    category: 'Booking & Contracts',
    question: 'What happens after I send a booking request?',
    answer: 'The artist receives an in-app notification and email about your request. They can accept, decline, or message you to discuss details. Once accepted, you can attach a rider contract with technical requirements. Both parties sign electronically, and the booking is confirmed.',
  },
  {
    id: 'booking-3',
    category: 'Booking & Contracts',
    question: 'Can I modify a booking after it\'s confirmed?',
    answer: 'Yes, you can request modifications to date, time, or terms through the booking detail page. The other party will review and approve or counter-propose. Changes require mutual agreement. You can also cancel a booking from your dashboard.',
  },
  {
    id: 'booking-4',
    category: 'Booking & Contracts',
    question: 'What is a rider and how do I create one?',
    answer: 'A rider is a document listing technical requirements (sound, lighting, stage specs), hospitality needs, and special requests. Artists can build rider templates using the Rider Builder in their Dashboard. Choose from structured templates or create custom ones. When a booking is confirmed, attach your rider so the venue knows exactly what you need. Available on Starter and Professional plans.',
  },
  {
    id: 'booking-5',
    category: 'Booking & Contracts',
    question: 'How do contracts and e-signatures work?',
    answer: 'When a booking is confirmed, a digital contract is generated with all agreed terms including event details, fees, and rider requirements. Both the artist and venue sign electronically with drawn or typed signatures. Signatures are verified with IP logging and timestamps. Contracts are stored securely and accessible from your dashboard. Available on the Professional plan.',
  },

  // Payments & Billing
  {
    id: 'payment-1',
    category: 'Payments & Billing',
    question: 'How are payments handled?',
    answer: 'We use Stripe for secure payment processing. Artists can connect their Stripe account from the Earnings & Payouts page in their Dashboard to receive payments directly. All transactions are encrypted and secure.',
  },
  {
    id: 'payment-2',
    category: 'Payments & Billing',
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and digital wallets through Stripe. Payments are processed securely.',
  },
  {
    id: 'payment-3',
    category: 'Payments & Billing',
    question: 'Can I get a refund?',
    answer: 'Refund policies depend on when the cancellation occurs. Cancellations 30+ days before the event typically receive full refunds. Cancellations within 30 days may have reduced refunds. Check your booking terms for specifics.',
  },
  {
    id: 'payment-4',
    category: 'Payments & Billing',
    question: 'How do I view my earnings and sales analytics?',
    answer: 'Artists can view their earnings from Dashboard > Earnings & Payouts. This page shows total earnings, completed payments, pending amounts, and paid out totals. It also includes Release Sales Analytics with per-release breakdowns showing sales count, gross revenue, net revenue (after 1% platform fee), and release status.',
  },
  {
    id: 'payment-5',
    category: 'Payments & Billing',
    question: 'How does the deposit payment work for bookings?',
    answer: 'When you book an artist, you can pay in two stages. First, pay a 50% deposit to secure the booking. The artist is notified and the booking status updates to "Deposit Paid." Before the event, you can pay the remaining 50% balance. Once both payments are complete, the booking status updates to "Paid in Full." You can manage all payments from the My Bookings page by clicking the "Pay Deposit" or "Pay Remaining Balance" buttons.',
  },
  {
    id: 'payment-6',
    category: 'Payments & Billing',
    question: 'Where can I see my booking payment status?',
    answer: 'Go to My Bookings from the user dropdown menu in the navigation bar. Each booking card shows a payment status badge: "Deposit Paid" (50% paid), "Paid in Full" (100% paid), or "Refunded" if applicable. You can also pay outstanding balances directly from this page.',
  },
  {
    id: 'payment-7',
    category: 'Payments & Billing',
    question: 'I received an email from Stripe about a failing webhook. What should I do?',
    answer: 'This typically happens when a temporary development URL expires. Go to your Stripe Dashboard \u2192 Developers \u2192 Webhooks and delete any endpoint pointing to an old or expired URL (such as a sandbox URL ending in manus.computer). Then add a new webhook endpoint using your production domain: https://ologywood.com/api/stripe/webhook (current active webhook: https://ologywood-mp6flm6c.manus.space/api/stripe/webhook). Select all relevant events (checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed, payment_intent.succeeded, charge.refunded). Copy the new Signing Secret and update it in your project\'s Settings \u2192 Payment. This does not affect existing payments \u2014 it only impacts real-time event notifications.',
  },
  {
    id: 'payment-8',
    category: 'Payments & Billing',
    question: 'How do I set up Stripe for my production site?',
    answer: 'Your Stripe test keys are automatically configured during development. To go live with real payments: (1) Complete Stripe\'s KYC verification in your Stripe Dashboard, (2) Once approved, enter your live API keys in Settings \u2192 Payment in the Ologywood management panel, (3) Add a production webhook endpoint at https://ologywood.com/api/stripe/webhook in your Stripe Dashboard \u2192 Developers \u2192 Webhooks, and (4) Update the webhook signing secret in Settings \u2192 Payment. Use test card 4242 4242 4242 4242 to verify everything works in test mode before switching to live.',
  },

  // Merch & Shop
  {
    id: 'merch-1',
    category: 'Merch & Shop',
    question: 'How does Creator Shop work for talent?',
    answer: 'Eligible creators can add merchandise, physical books, or eBooks to Creator Shop from their Dashboard. Native OlogyWood checkout uses Stripe Connect, secure order tracking, and the current 1% platform fee; physical products are fulfilled by the creator and paid eBooks unlock through protected downloads. Creators may also use an optional external-store link. Upload up to 2 product images per listing (JPEG, PNG, or WebP, max 2MB each).',
  },
  {
    id: 'merch-2',
    category: 'Merch & Shop',
    question: 'How does the Shop feature work for venues?',
    answer: 'Venues on Starter and Professional plans can showcase branded items and offers on their public profile under \"Shop & Offers.\" This works the same as artist merch but is designed for venue merchandise (branded hats, glasses, shirts), gift cards, VIP packages, and promotional offers. Add items from your Dashboard \u2192 Shop & Offers quick action. Each item links out to your own store or ordering system. Starter plans allow up to 6 items; Professional plans allow up to 15.',
  },
  {
    id: 'merch-3',
    category: 'Merch & Shop',
    question: 'What are the merch item limits per subscription tier?',
    answer: 'Free accounts cannot add merch or shop items. Starter plan ($9/month) allows up to 6 items. Professional plan ($29/month) allows up to 15 items. If you reach your limit, you\'ll see an upgrade prompt. You can deactivate items without deleting them to free up slots.',
  },

  // Project Previews
  {
    id: 'project-1',
    category: 'Project Previews',
    question: 'What are Project Previews?',
    answer: 'Project Previews let artists showcase upcoming albums, EPs, mixtapes, and other unreleased projects on their public profile. You can upload cover art, add a track list with audio snippets, and link to streaming platforms. Fans can listen to short previews and share your project on social media. This feature is designed for building anticipation before a full release.',
  },
  {
    id: 'project-2',
    category: 'Project Previews',
    question: 'How many projects and tracks can I add?',
    answer: 'Project limits depend on your subscription tier. Starter plan ($9/month) allows 1 project with up to 6 tracks and 30-second audio snippets. Professional plan ($29/month) allows 3 projects with up to 12 tracks each and 60-second audio snippets. Free accounts do not have access to Project Previews.',
  },
  {
    id: 'project-3',
    category: 'Project Previews',
    question: 'How do I manage my Project Previews?',
    answer: 'Go to your Artist Dashboard and click the "Projects" quick action (or navigate to /projects). Create a new project by entering a title, release type (album, EP, mixtape, etc.), and optional release date. Upload cover art (JPEG, PNG, or WebP, max 2MB). Add tracks one by one, then upload audio snippets for each track (MP3, WAV, or M4A, max 5MB). Snippets are automatically limited to your tier\'s maximum duration. You can also add an external link to Spotify, Apple Music, or Bandcamp so fans can find the full release when it drops.',
  },

  // Music & Releases
  {
    id: 'music-1',
    category: 'Music & Releases',
    question: 'How do I sell my music on Ologywood?',
    answer: 'Go to your Artist Dashboard and navigate to the Releases section. Upload your track, add cover art, set your price, and publish. Fans can purchase and download your music directly from your artist profile. You keep 99% of each sale (1% platform fee).',
  },
  {
    id: 'music-2',
    category: 'Music & Releases',
    question: 'How do fans purchase and download releases?',
    answer: 'Fans click the "Buy" button on a release card, which opens a secure Stripe checkout. After payment, they are redirected to a Purchase Success page with a download button. Fans can also re-download from the "My Purchases" page (accessible from the user dropdown menu in the navigation bar). Each purchase allows up to 5 downloads. A branded confirmation email with download instructions is also sent to the buyer.',
  },
  {
    id: 'music-3',
    category: 'Music & Releases',
    question: 'Where can I see my purchased music?',
    answer: 'Click your name or email in the top navigation bar to open the user dropdown menu, then select "My Purchases." This page shows all your purchased releases with cover art, artist name, purchase date, and a download button. You can also access the download link from the confirmation email sent after each purchase.',
  },
  {
    id: 'music-4',
    category: 'Music & Releases',
    question: 'I completed a purchase but the page is stuck on "Processing." What should I do?',
    answer: 'If the Purchase Success page shows "Processing your purchase," wait a few seconds for automatic verification. If it takes longer, click the "Verify Payment Now" button. The system will confirm your payment directly with Stripe and unlock your download. You will also receive a confirmation email with a link to My Purchases where you can download your track anytime.',
  },
  {
    id: 'music-5',
    category: 'Music & Releases',
    question: 'How many times can I download a purchased release?',
    answer: 'Each purchase allows up to 5 downloads. You can download from the Purchase Success page immediately after buying, or return to My Purchases anytime to download again. The remaining download count is shown on each purchase card.',
  },


  // Content Releases
  {
    id: 'content-release-1',
    category: 'Content Releases',
    question: 'What are Content Releases?',
    answer: 'Content Releases let you sell access to content hosted anywhere — YouTube, Vimeo, Spotify, your own website, etc. You create a listing with title, description, trailer, and price. Fans purchase access on Ologywood, then get the link to watch or listen. You keep your content where it performs best; Ologywood handles the business side.',
  },
  {
    id: 'content-release-2',
    category: 'Content Releases',
    question: 'How do I sell access to my movie or film?',
    answer: 'Go to your Dashboard and click Releases. Click New Release, select Movie or Documentary as the type, fill in the title, description, and genre. Paste your YouTube or Vimeo URL (use an unlisted link for paid content). Set the access model to Ticketed and enter your price. When fans purchase, they get the Watch button that opens your video.',
  },
  {
    id: 'content-release-3',
    category: 'Content Releases',
    question: 'What access models are available for Content Releases?',
    answer: 'Five models: Free (anyone can watch), Ticketed (one-time purchase at a fixed price), Fan Club Members Only (restricted to your subscribers), Pay What You Want (fans choose their price), and Unlock After Purchase (content locked until payment). Choose the model that fits your content strategy.',
  },
  {
    id: 'content-release-4',
    category: 'Content Releases',
    question: 'How do scheduled premieres work?',
    answer: 'Set a future Premiere Date when creating your release. Fans can buy tickets in advance. 24 hours before the premiere, all ticket holders receive a reminder email with the Watch button. This is perfect for movie premieres, album drops, or live event recordings.',
  },
  {
    id: 'content-release-5',
    category: 'Content Releases',
    question: 'Do I need to host my content on Ologywood?',
    answer: 'No. Ologywood is a monetization layer, not a content host. Your content lives wherever you choose — YouTube, Vimeo, Twitch, Spotify, Apple Podcasts, SoundCloud, or your personal website. Ologywood handles discovery, ticketing, access control, and revenue. This keeps your infrastructure costs near zero.',
  },
  {
    id: 'content-release-6',
    category: 'Content Releases',
    question: 'What types of content can I release?',
    answer: 'Movies, Documentaries, Short Films, Web Series, Concerts, Livestreams, Podcast Episodes, Albums, Courses, Masterclasses, Interviews, Music Videos, and Behind the Scenes content. The same system works for every creator type on the platform.',
  },

  // Subscription & Tier Limits
  {
    id: 'tier-1',
    category: 'Payments & Billing',
    question: 'Why am I seeing an upgrade message when I try to use a feature?',
    answer: 'Some features are restricted by subscription tier to keep the platform sustainable. Free plan: 2 bookings/month. Rider Builder requires Starter ($9/mo). Contracts require Professional ($29/mo). Sponsor features require Enterprise ($79/mo). Content Releases require Starter or higher. Visit the Pricing page to upgrade instantly.',
  },
  {
    id: 'tier-2',
    category: 'Payments & Billing',
    question: 'What is included in each subscription plan?',
    answer: 'Free: Profile, browse, messaging, calendar, AI Ad Assistant, 2 bookings/month. Starter ($9/mo): Unlimited bookings, Rider Builder, Fan email updates, 2 content releases. Professional ($29/mo): Contracts and e-signatures, advanced analytics, unlimited releases, priority support. Enterprise ($79/mo): Sponsor Showcase, Sponsor Analytics, Media Kit, branded event pages.',
  },

  // Filmmaker
  {
    id: 'filmmaker-1',
    category: 'Getting Started',
    question: 'I am a filmmaker. What can I do on Ologywood?',
    answer: 'As a Filmmaker, you can: create a professional profile with your biography and reel, list your films/documentaries with trailers and sell tickets to premieres, build a Fan Club for recurring revenue, sell merchandise, get booked for event coverage or music video production, and monetize your entire catalog through Content Releases. Select Filmmaker as your talent type during onboarding.',
  },
  {
    id: 'visual-artist-1',
    category: 'Getting Started',
    question: 'I am an illustrator or visual artist. Which profile type and event category should I choose?',
    answer: 'Choose Visual Artist as your profile type for illustration, fine art, graphic design, photography, sculpture, digital art, and related creative work. When posting an exhibition, gallery opening, art fair, or similar event, choose Arts & Culture as the event category. Your profile type describes who you are; the event category describes the event.',
  },
  {
    id: 'author-writer-1',
    category: 'Getting Started',
    question: 'I am an author or writer. What can I do on OlogyWood?',
    answer: 'Choose Author / Writer as your profile type, add your writing genres and author bio, sell physical books or eBooks through Creator Shop, build reader relationships through followers and Fan Club, share book updates, promote readings and signings, and accept booking requests for panels, workshops, school visits, and speaking engagements. You remain the author, publisher, or rights holder; OlogyWood provides the commerce, access, discovery, and fan-relationship tools.',
  },
  {
    id: 'author-writer-2',
    category: 'Getting Started',
    question: 'How are physical books and eBooks handled?',
    answer: 'Physical books use the existing OlogyWood order system with inventory, shipping, pickup, tracking, refunds, and creator fulfillment. eBooks use the same secure checkout, but the file stays private and becomes downloadable only after a verified purchase. Authors must confirm they have the rights to sell every uploaded book.',
  },

  // Fan Club
  {
    id: 'fanclub-1',
    category: 'Fan Club',
    question: 'What is the Fan Club feature?',
    answer: 'Fan Club lets talent (artists, athletes, creators) create paid membership tiers for their fans. Fans subscribe monthly to get access to exclusive content, behind-the-scenes posts, and special perks. It\'s a way for talent to build recurring revenue and deepen their connection with supporters.',
  },
  {
    id: 'fanclub-2',
    category: 'Fan Club',
    question: 'How do I create a Fan Club as talent?',
    answer: 'Go to your Dashboard and click the "Fan Club" button (or navigate to /fan-club). From the Fan Club Manager, click "Create Tier" to set up membership levels with a name, monthly price, and list of perks. You can create multiple tiers at different price points. Each tier is automatically connected to Stripe for recurring payments.',
  },
  {
    id: 'fanclub-3',
    category: 'Fan Club',
    question: 'How do I join an artist\'s Fan Club?',
    answer: 'Visit the talent\'s public profile and click the "Fan Club" tab. You\'ll see available membership tiers with pricing and perks. Click "Join" on your preferred tier, which opens a Stripe checkout for the monthly subscription. Once subscribed, you\'ll have access to their exclusive members-only content.',
  },
  {
    id: 'fanclub-4',
    category: 'Fan Club',
    question: 'What is the revenue share for Fan Club subscriptions?',
    answer: 'The revenue split is 85% to the talent and 15% to Ologywood (platform fee). Stripe processing fees (~2.9% + $0.30) are deducted separately before the split. For example, on a $10/month subscription: Stripe takes ~$0.59, Ologywood takes $1.41 (15%), and the talent receives ~$8.00 (85% of net).',
  },
  {
    id: 'fanclub-5',
    category: 'Fan Club',
    question: 'What is exclusive content and how does it work?',
    answer: 'Talent can post content marked as "Members Only" from their Fan Club Manager. These posts are only visible to paying subscribers. Non-members see a lock icon with a "Join to unlock" prompt. Public posts are visible to everyone. This lets talent reward their paying fans with behind-the-scenes content, early access, or special announcements.',
  },
  {
    id: 'fanclub-6',
    category: 'Fan Club',
    question: 'How do I cancel my Fan Club membership?',
    answer: 'You can cancel your subscription anytime from the talent\'s profile Fan Club section. Your access continues until the end of your current billing period. After that, you\'ll lose access to members-only content but can rejoin at any time.',
  },

  // Promote & AI Ad Assistant
  {
    id: 'promote-1',
    category: 'Promote & Ads',
    question: 'What is the AI Ad Assistant?',
    answer: 'The AI Ad Assistant (accessible from Dashboard > Promote or /promote) generates ready-to-use social media ad copy for your events, releases, or profile. Choose your target platform (Instagram, Facebook, TikTok, YouTube, or X), select a tone, and the AI creates headlines, ad copy, hashtags, targeting suggestions, and creative direction instantly.',
  },
  {
    id: 'promote-2',
    category: 'Promote & Ads',
    question: 'How does Boost My Event work?',
    answer: 'Boost My Event is a managed promotion service. Submit a request with your budget (minimum $50), goals, target audience, preferred platforms, and timeline. The Ologywood team reviews your request and runs the ad campaign on your behalf. You can track the status (submitted, in review, in progress, completed) from the Promote page.',
  },
  {
    id: 'promote-3',
    category: 'Promote & Ads',
    question: 'Does the AI Ad Assistant cost anything?',
    answer: 'No, the AI Ad Copy Generator is free to use for all talent on the platform. It generates ad copy and suggestions that you can copy and use on your own social media ad accounts. The Boost My Event managed service has a separate fee based on your campaign budget.',
  },
  {
    id: 'promote-4',
    category: 'Promote & Ads',
    question: 'What is the Budget Calculator?',
    answer: 'The Budget Calculator on the Promote page helps you estimate how many people you can reach with a given ad spend. Enter your daily budget and campaign duration, and it provides estimated reach based on typical social media advertising costs for entertainment and events.',
  },

  // Tips & Support Artists
  {
    id: 'tips-1',
    category: 'Tips & Support',
    question: 'How do tip links work?',
    answer: 'Artists can add their Cash App, Venmo, PayPal, and Zelle handles in Edit Profile under the "Support This Artist" section. These appear on the artist\'s public profile as subtle branded badges. Fans can click to tip directly through their preferred payment app. Tips go directly to the artist with zero platform fees.',
  },
  {
    id: 'tips-2',
    category: 'Tips & Support',
    question: 'How do I set up my tip links as an artist?',
    answer: 'Go to Dashboard > Edit Profile and scroll to the "Support This Artist" card. Enter your username or handle for Cash App, Venmo, PayPal, and/or Zelle. Click Save. Your tip links will appear on your public profile for fans to use.',
  },
  {
    id: 'tips-3',
    category: 'Tips & Support',
    question: 'Does Ologywood take a cut from tips?',
    answer: 'No. Tips go directly from the fan to the artist through their chosen payment app (Cash App, Venmo, PayPal, or Zelle). Ologywood does not process or take any fees from tips.',
  },

  // Notifications
  {
    id: 'notifications-1',
    category: 'Notifications',
    question: 'How do notifications work?',
    answer: 'Ologywood has both in-app and email notifications. The bell icon in the navigation bar shows your in-app notifications with an unread count badge. You receive notifications for new booking requests, booking confirmations and cancellations, new messages, contract signings, reviews, and payment events. Click any notification to go directly to the relevant page.',
  },
  {
    id: 'notifications-2',
    category: 'Notifications',
    question: 'How do I manage my notifications?',
    answer: 'Click the bell icon in the top navigation to see your notifications. You can mark individual notifications as read, mark all as read, or delete them. Email notifications are sent automatically for important events like booking requests and payment confirmations.',
  },

  // Following & Fans
  {
    id: 'fans-1',
    category: 'Following & Fans',
    question: 'How do I follow an artist?',
    answer: 'Visit any artist\'s profile page and click the "Follow" button. View all artists you follow from the "Following" link in the navigation bar. You will receive email updates when artists you follow post new events or update their profiles.',
  },
  {
    id: 'fans-2',
    category: 'Following & Fans',
    question: 'What is the Send Update feature?',
    answer: 'Artists on paid plans can compose and send branded email updates to all their followers. Go to your Artist Dashboard, find the Fans section, and click "Send Update" to compose a message with a subject and body. This is a great way to announce upcoming shows, new releases, or special news.',
  },
  {
    id: 'fans-3',
    category: 'Following & Fans',
    question: 'How do I leave a review for an artist?',
    answer: 'After attending a performance or purchasing a release, visit the artist\'s profile and scroll to the Reviews section. Click "Write a Review" to rate the artist and share your experience. Reviews help other fans and venues make informed booking decisions.',
  },

  // Profile & Settings
  {
    id: 'profile-1',
    category: 'Profile & Settings',
    question: 'How do I upload photos to my profile?',
    answer: 'Go to Dashboard > Edit Profile > Media Gallery. Click "Add Photos" to upload images. We automatically optimize images for performance. Your profile photo appears on browse cards, search results, and your public profile.',
  },
  {
    id: 'profile-2',
    category: 'Profile & Settings',
    question: 'How do I manage my availability?',
    answer: 'Artists can set their availability calendar in Dashboard > Availability. Mark dates when you are available to perform and block out unavailable dates. Venues will see your availability when browsing your profile, preventing scheduling conflicts.',
  },
  {
    id: 'profile-3',
    category: 'Profile & Settings',
    question: 'Can I change my subscription plan?',
    answer: 'Yes, you can upgrade or downgrade your subscription tiers anytime from your Dashboard or Account Settings. Changes take effect immediately. Upgrades are prorated; downgrades apply at the next billing cycle. Visit the Pricing page to compare plans.',
  },
  {
    id: 'profile-4',
    category: 'Profile & Settings',
    question: 'How do I add social media links to my profile?',
    answer: 'Go to Dashboard > Edit Profile and scroll to the Social Links section. Add your Instagram, Twitter/X, Facebook, YouTube, Spotify, SoundCloud, TikTok, or website URL. These appear as clickable icons on your public artist profile.',
  },
  {
    id: 'profile-5',
    category: 'Profile & Settings',
    question: 'What is a Sandbox Post?',
    answer: 'A Sandbox Post is a playful, one-at-a-time update directly beneath your profile bio. Talent can share up to 600 characters with an optional image or 30-second video. There are no comments, downvotes, reaction counts, or public post history. Use it to share what you are creating, promoting, thinking about, or celebrating right now.',
  },
  {
    id: 'profile-6',
    category: 'Profile & Settings',
    question: 'What happens when I replace or share a Sandbox Post?',
    answer: 'Publishing a new Sandbox Post permanently deletes the current post row from OlogyWood’s active database and replaces it at the same clean share link. The old post cannot be restored. Share buttons support social networks, email, text, copy link, and your device sharing menu. The shared link always resolves to your current post, so a replaced or deleted version is no longer shown. Limited security logs or provider backups may remain only as described in the Privacy Policy.',
  },

  // Event Ticketing
  {
    id: 'ticketing-1',
    category: 'Event Ticketing',
    question: 'How do I sell tickets for my event?',
    answer: 'After creating an event from your Dashboard, click the ticket icon next to the event. This opens the Ticket Management page where you can add ticket tiers (e.g., General Admission, VIP, Early Bird) with custom names, prices, and capacity limits. Once tiers are created, a "Get Tickets" section automatically appears on your event\'s public page for fans to purchase.',
  },
  {
    id: 'ticketing-2',
    category: 'Event Ticketing',
    question: 'What are the fees for selling tickets?',
    answer: 'Ologywood charges a flat $0.99 service fee per ticket, plus standard Stripe payment processing (2.9% + $0.30). There are no hidden fees, no percentage-based platform cuts, and no long-term contracts. This is significantly lower than traditional ticketing platforms.',
  },
  {
    id: 'ticketing-3',
    category: 'Event Ticketing',
    question: 'How do ticket tiers work?',
    answer: 'Ticket tiers let you offer different ticket types for the same event. For example, you might have General Admission at $25, VIP at $75, and Early Bird at $15. Each tier has its own name, description, price, total capacity, and maximum per-order limit. You can also set sale start and end dates to control when each tier goes on sale.',
  },
  {
    id: 'ticketing-4',
    category: 'Event Ticketing',
    question: 'How do promo codes work?',
    answer: 'Event organizers can create promo codes from the Ticket Management page under the "Promos" tab. Set a code name (e.g., EARLYBIRD20), choose percentage or fixed dollar discount, set optional max uses, and minimum ticket requirements. Fans enter the code on the ticket purchase page to see their discount applied before checkout.',
  },
  {
    id: 'ticketing-5',
    category: 'Event Ticketing',
    question: 'How does QR code check-in work at the door?',
    answer: 'After purchasing tickets, buyers receive QR codes on their confirmation page and via email. At the event, venue staff open the Check-In page (accessible from Ticket Management) on any phone or tablet. Scan QR codes using the camera or enter ticket codes manually. The system validates the ticket in real-time, prevents duplicate scans, and shows live attendance stats.',
  },
  {
    id: 'ticketing-6',
    category: 'Event Ticketing',
    question: 'Can I transfer or gift a ticket to someone else?',
    answer: 'Yes! On the ticket confirmation page or in My Tickets, click "Transfer" on any valid ticket. Enter the recipient\'s email address and they will receive an email with a link to accept the transfer. Once accepted, the ticket is reassigned to the new owner with a fresh QR code. The original ticket becomes invalid.',
  },
  {
    id: 'ticketing-7',
    category: 'Event Ticketing',
    question: 'Where can I find my purchased tickets?',
    answer: 'Go to "My Tickets" from the navigation menu. This page shows all your purchased tickets organized by event, with QR codes for check-in, event details, and the option to transfer tickets. You also receive a confirmation email with your ticket details and QR codes after every purchase.',
  },
  {
    id: 'ticketing-8',
    category: 'Event Ticketing',
    question: 'How do I view ticket sales analytics?',
    answer: 'From the Ticket Management page, click the "Analytics" tab. You\'ll see total revenue, tickets sold vs. available, sell-through percentages per tier, and a list of recent orders. This helps you track performance and optimize pricing for future events.',
  },

  // Events
  {
    id: 'events-1',
    category: 'Events',
    question: 'How do events work on Ologywood?',
    answer: 'Venues and artists can create events from their Dashboard with details like date, time, location, description, and ticket tiers. Events appear on the Events page where fans can discover them, purchase tickets, and connect with organizers directly through the platform.',
  },
  {
    id: 'events-2',
    category: 'Events',
    question: 'How do I create an event?',
    answer: 'Go to your Dashboard and click "Create Event". Fill in the event name, date, time, description, and location. Once published, your event will be visible on the Events page. Then add ticket tiers from the Ticket Management page to start selling tickets.',
  },

  // Disputes
  {
    id: 'disputes-1',
    category: 'Disputes',
    question: 'What is a dispute and how do I file one?',
    answer: 'If you have a payment issue with a booking \u2014 such as a no-show, unauthorized charge, or service not delivered \u2014 you can file a dispute directly with your bank or card issuer. Stripe, our payment processor, handles the entire chargeback and dispute process in accordance with card network rules (Visa, Mastercard, etc.). You can also report issues through the booking details page to flag concerns to the other party.',
  },
  {
    id: 'disputes-2',
    category: 'Disputes',
    question: 'How long does it take to resolve a dispute?',
    answer: 'Payment disputes and chargebacks are managed by Stripe and follow card network timelines, which typically take 60-90 days for a final resolution. Stripe will notify the relevant parties throughout the process. For non-payment issues (e.g., communication problems or scheduling conflicts), use the Report Issue feature on the booking page to flag concerns directly.',
  },
  {
    id: 'disputes-3',
    category: 'Disputes',
    question: 'What evidence should I provide when filing a dispute?',
    answer: 'Include any relevant details such as screenshots of messages, contract terms, payment receipts, photos, or videos that support your claim. The more evidence you provide, the faster and more accurately our team can resolve the issue.',
  },

  // Reviews
  {
    id: 'reviews-1',
    category: 'Reviews',
    question: 'How do I leave a review?',
    answer: 'After a completed booking, both artists and venues can leave reviews for each other from the booking details page. Reviews include a star rating and written feedback. Fans can also leave reviews on purchased music releases from the artist profile or My Purchases page.',
  },
  {
    id: 'reviews-2',
    category: 'Reviews',
    question: 'Can I edit or delete a review?',
    answer: 'Currently, reviews cannot be edited once submitted. If you believe a review violates our community guidelines or is fraudulent, contact support@ologywood.com and our team will investigate.',
  },

  // Platform Setup (Admin)
  {
    id: 'setup-1',
    category: 'Platform Setup',
    question: 'How do I update my Stripe webhook endpoint after deployment?',
    answer: 'After deploying your site, go to the Stripe Dashboard \u2192 Developers \u2192 Webhooks. Remove any old endpoints pointing to expired development URLs. Click \"Add endpoint\" and enter your production webhook URL: https://ologywood.com/api/stripe/webhook (current active: https://ologywood-mp6flm6c.manus.space/api/stripe/webhook). Select the events to listen for: checkout.session.completed, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid, invoice.payment_failed, payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, payout.paid, and payout.failed. Save the endpoint, then copy the new Signing Secret and update it in your project\'s Settings \u2192 Payment panel.',
  },
  {
    id: 'setup-2',
    category: 'Platform Setup',
    question: 'Why is Stripe sending me emails about failing webhooks?',
    answer: 'Stripe sends these emails when it cannot reach your webhook endpoint URL. The most common cause is that the URL points to an old development/sandbox server that has been shut down or restarted. This does not affect existing payments or payouts. To fix it: (1) Go to Stripe Dashboard \u2192 Developers \u2192 Webhooks, (2) Delete the failing endpoint, (3) If you still need webhooks, add a new endpoint with your current production URL (https://ologywood.com/api/stripe/webhook or https://ologywood-mp6flm6c.manus.space/api/stripe/webhook). If you are only in test mode and not actively testing webhooks, you can safely remove the old endpoint to stop the emails.',
  },

  // Enterprise & Sponsors
  {
    id: 'enterprise-1',
    category: 'Enterprise & Sponsors',
    question: 'What is the Enterprise tier?',
    answer: 'The Enterprise tier ($79/month or $790/year) is our top-level plan designed for established artists with brand partnerships. It includes everything in the Professional plan plus: Sponsor Showcase (up to 5 sponsor slots on your profile and event pages), Sponsor Analytics (track impressions, clicks, and CTR for each sponsor), Auto-generated Media Kit (shareable press kit with your platform stats, bio, and achievements), and sponsor logo integration on ticket confirmation emails.',
  },
  {
    id: 'enterprise-2',
    category: 'Enterprise & Sponsors',
    question: 'How does the Sponsor Showcase work?',
    answer: 'Enterprise artists can add up to 5 sponsor slots from their Dashboard under the Sponsors section. For each sponsor, upload a logo, enter the company name, website URL, and optional description. Active sponsors appear in a "Sponsored By" section on your public artist profile and on all your event pages. Each sponsor\'s impressions and clicks are tracked automatically so you can report results to your brand partners.',
  },
  {
    id: 'enterprise-3',
    category: 'Enterprise & Sponsors',
    question: 'What is Sponsor Analytics?',
    answer: 'Sponsor Analytics is a dedicated dashboard (accessible from Dashboard > Sponsor Analytics) that shows how your sponsors are performing. Track total impressions (how many times sponsor logos were seen), clicks (how many times fans clicked through to sponsor websites), click-through rate (CTR), and breakdowns by source (profile views vs. event page views). Use these metrics to demonstrate value to your sponsors and negotiate better deals.',
  },
  {
    id: 'enterprise-4',
    category: 'Enterprise & Sponsors',
    question: 'What is the Media Kit feature?',
    answer: 'The Media Kit is an auto-generated, shareable press page that showcases your platform stats, bio, achievements, genres, and contact information. Access it from Dashboard > Media Kit. You can toggle it public or private and share the link with potential sponsors, labels, or press. It pulls your real platform data (followers, bookings, reviews) to create a professional pitch document.',
  },
  {
    id: 'enterprise-5',
    category: 'Enterprise & Sponsors',
    question: 'Do sponsor logos appear on ticket confirmation emails?',
    answer: 'Yes. When fans purchase tickets to your events, the confirmation email includes a "Sponsored By" section with your active sponsors\' logos and links. This gives your sponsors additional exposure beyond just your profile and event pages.',
  },
  {
    id: 'enterprise-6',
    category: 'Enterprise & Sponsors',
    question: 'Can I track which source generates the most sponsor engagement?',
    answer: 'Yes. Sponsor Analytics breaks down impressions and clicks by source: "profile" (from your artist profile page) and "event" (from your event detail pages). This helps you understand where fans interact with your sponsors most and optimize placement accordingly.',
  },

  // Athletes & NIL
  {
    id: 'athlete-1',
    category: 'Athletes & NIL',
    question: 'How does Ologywood work for athletes?',
    answer: 'Ologywood is purpose-built for athletes alongside artists and creators. When you sign up and select "Athlete" as your talent type, you get a profile tailored to your sport with fields for position, team, stats, achievements, and highlight reels. You can accept bookings for appearances, autograph signings, speaking engagements, camps/clinics, and brand endorsements — each with its own professional rider template.',
  },
  {
    id: 'athlete-2',
    category: 'Athletes & NIL',
    question: 'What is the NIL Engagement Contract?',
    answer: 'The NIL (Name, Image, Likeness) Engagement Contract is a professional, auto-generated document that covers all aspects of an athlete booking. It includes 10 sections: Parties, Engagement Details, Compensation Terms, Travel & Logistics, Security Requirements, Equipment & Facilities, Content & Media Rights, NIL Compliance (NCAA/conference language), Cancellation Terms, and Signatures. Both parties sign electronically with drawn or typed signatures. You can also edit clauses before finalizing and download the contract as a PDF.',
  },
  {
    id: 'athlete-3',
    category: 'Athletes & NIL',
    question: 'How do I set up my athlete profile?',
    answer: 'After selecting "Athlete" during onboarding (or changing your talent type in Edit Profile), you\'ll see sport-specific fields: select your sport, enter your position, team, key stats, and achievements. Upload highlight clips (up to 10 short videos categorized by type: Highlights, Training, Game Day, Behind-the-Scenes). Set your availability calendar so brands and venues can see when you\'re open for bookings.',
  },
  {
    id: 'athlete-4',
    category: 'Athletes & NIL',
    question: 'What types of bookings can athletes accept?',
    answer: 'Athletes can accept 5 booking types: (1) Appearances — meet & greets, event appearances, public events. (2) Autograph Signings — dedicated signing sessions. (3) Speaking Engagements — keynotes, panels, motivational talks. (4) Camps/Clinics — sports camps, training clinics, youth programs. (5) Brand Endorsements/NIL Deals — sponsored content, brand partnerships. Each type has its own rider template with relevant sections.',
  },
  {
    id: 'athlete-5',
    category: 'Athletes & NIL',
    question: 'How does the Video Portfolio work?',
    answer: 'Athletes (and artists) can upload up to 10 short video clips (1-2 minutes each) to their portfolio. Each clip gets a title, category tag (Highlights, Training, Game Day, Behind-the-Scenes, Live Performance, Studio, Music Video), and is displayed on your public profile as a "Highlight Clips" grid. Fans can click any clip to watch in a full-screen modal player with social sharing buttons.',
  },
  {
    id: 'athlete-6',
    category: 'Athletes & NIL',
    question: 'Is the NIL contract NCAA compliant?',
    answer: 'Yes. The NIL Engagement Contract includes built-in compliance language covering: disclosure requirements, school/conference approval workflows, prohibited activities under NCAA rules, and athlete representation warranties. However, athletes should always verify specific requirements with their school\'s compliance office, as rules vary by conference and institution.',
  },
  {
    id: 'athlete-7',
    category: 'Athletes & NIL',
    question: 'How does the athlete booking dashboard work?',
    answer: 'Your dashboard shows "Incoming Requests" with the venue/brand name, date, booking type, proposed budget, and event details. You can Accept, Decline, or Counter any offer. Counter offers let you propose a different amount with a message. Once accepted, you can generate the NIL Engagement Contract directly from the dashboard. A visual status indicator tracks whether the contract is pending, signed by one party, or fully executed.',
  },
  {
    id: 'athlete-8',
    category: 'Athletes & NIL',
    question: 'Can athletes sell merchandise on the platform?',
    answer: 'Yes! Athletes have full access to the Merch feature. Upload product images, set prices, and offer pre-pay merchandise — fans order and pay upfront, you produce and ship. This is perfect for custom jerseys, signed memorabilia, training gear, or branded apparel. You keep 100% of merch revenue with zero platform commission.',
  },
  {
    id: 'athlete-9',
    category: 'Athletes & NIL',
    question: 'How does the Fan Club work for athletes?',
    answer: 'Athletes can create Fan Club membership tiers just like artists. Post exclusive content categorized by type: Training Clips, Game Day footage, Behind-the-Scenes content, and Q&A Sessions. Fans subscribe monthly through Stripe. Non-members see a blurred paywall preview with a "Subscribe to Unlock" button. Members can like posts and leave comments, and athletes can reply directly to fan questions.',
  },

  // Ology Live
  {
    id: 'ology-live-1',
    category: 'Ology Live',
    question: 'What is Ology Live?',
    answer: 'Ology Live is a virtual experience marketplace built into Ologywood. Talent (artists, athletes, creators) can host paid live sessions — gaming, Q&A/AMA, music listening parties, fitness workouts, workshops, photography, film breakdowns, creative sessions, and brand building — on platforms like Twitch, Discord, Zoom, FaceTime, Google Meet, or YouTube Live. Fans browse, book, and join sessions in real time.',
  },
  {
    id: 'ology-live-2',
    category: 'Ology Live',
    question: 'How do I host an Ology Live session as talent?',
    answer: 'Go to your Dashboard and click "Ology Live." Create an experience by choosing a category, setting a title, description, duration (15-120 min), price, capacity type (one-on-one, small group, or broadcast), and your preferred platform. Add available time slots so fans can book. Once a fan books, you receive a notification and can share the session link.',
  },
  {
    id: 'ology-live-3',
    category: 'Ology Live',
    question: 'How do I book and join an Ology Live session as a fan?',
    answer: 'Browse Ology Live from the navigation menu to discover available sessions by category, price, and talent. Select an experience, pick an available time slot, add optional notes, and confirm your booking. Before the session starts, you can submit questions for the talent to answer live. A countdown timer shows when the session begins, and a Join button activates 5 minutes before start time.',
  },
  {
    id: 'ology-live-4',
    category: 'Ology Live',
    question: 'What is the Submit a Question feature?',
    answer: 'Fans who have booked a session can submit up to 5 questions (5-500 characters each) before or during the session. Talent sees all submitted questions in their dashboard and can mark them as answered during the live session. This creates a structured, interactive Q&A experience that makes every session personal and engaging.',
  },
  {
    id: 'ology-live-5',
    category: 'Ology Live',
    question: 'How much can I earn with Ology Live?',
    answer: 'You set your own price per session — from $5 to $500+. Choose one-on-one for premium pricing, small group for moderate pricing with multiple attendees, or broadcast for lower per-person pricing at scale. Track your Ology Live earnings separately in the Earnings tab of your Ology Live dashboard, with charts showing revenue over time.',
  },
  {
    id: 'ology-live-6',
    category: 'Ology Live',
    question: 'What session categories are available?',
    answer: 'Ology Live supports 10 categories: Gaming, Music/Listening Party, Fitness/Workout, Q&A/AMA, Workshop/Tutorial, Photography, Film/Content Review, Creative Session, Brand Building, and Other. Each category helps fans discover the type of experience they want.',
  },

  // Support & Contact
  {
    id: 'support-1',
    category: 'Support & Contact',
    question: 'How do I contact support?',
    answer: 'Use the Contact Us form, email support@ologywood.com, or use the chat widget in the bottom-right corner of any page. We typically respond within 24 hours.',
  },
  {
    id: 'support-2',
    category: 'Support & Contact',
    question: 'What are your support hours?',
    answer: 'Our support team is available Monday through Friday, 9 AM to 6 PM EST. For urgent issues, use the in-app chat for faster response.',
  },
  {
    id: 'support-3',
    category: 'Support & Contact',
    question: 'How do I report a problem or issue?',
    answer: 'Contact support@ologywood.com with details about what happened, including screenshots if possible. You can also use the Contact Us page or the chat widget. We will investigate and respond within 24 hours.',
  },
];

export default function Help() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Set SEO meta tags
  useEffect(() => {
    setMetaTags(pageMetaTags.help);
  }, []);

  const categories = ['All', ...new Set(faqItems.map(item => item.category))];
  
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Help Center</h1>
          <p className="text-purple-100 text-lg">Find answers to common questions about Ologywood</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400 z-10" size={20} />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="max-w-4xl mx-auto px-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* FAQ Items */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        {filteredFAQs.length > 0 ? (
          <div className="space-y-3">
            {filteredFAQs.map(item => (
              <div key={item.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <button
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full px-6 py-4 flex items-start justify-between text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{item.question}</h3>
                    <p className="text-sm text-gray-500 mt-1">{item.category}</p>
                  </div>
                  <ChevronDown
                    size={20}
                    className={`text-purple-600 flex-shrink-0 ml-4 transition-transform ${
                      expandedId === item.id ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {expandedId === item.id && (
                  <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No results found. Try a different search term.</p>
          </div>
        )}
      </div>

      {/* Contact Support Section */}
      <div className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Still need help?</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Email */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Mail className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Email Support</h3>
              <p className="text-gray-600 mb-4">support@ologywood.com</p>
              <p className="text-sm text-gray-500">Response time: 24 hours</p>
            </div>

            {/* Chat */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <MessageCircle className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
              <p className="text-gray-600 mb-4">Available in your dashboard</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
            </div>

            {/* Phone */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <Phone className="text-purple-600" size={24} />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Phone Support</h3>
              <p className="text-gray-600 mb-4">+1 (678) 525-0891</p>
              <p className="text-sm text-gray-500">Mon-Fri, 9 AM - 6 PM EST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Form CTA */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Can't find what you're looking for?</h2>
          <p className="text-purple-100 mb-6">Send us a message and our support team will get back to you shortly.</p>
          <a
            href="/contact"
            className="inline-block bg-white text-purple-600 font-semibold px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
      </div>

    </div>
  );
}
