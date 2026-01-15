import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { supportCategories, faqs, knowledgeBaseArticles } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";

const supportCategoriesData = [
  { id: 1, name: "Booking & Scheduling", description: "Issues related to creating and managing bookings", order: 1, isActive: true },
  { id: 2, name: "Payments & Invoicing", description: "Questions about payments, invoices, and billing", order: 2, isActive: true },
  { id: 3, name: "Contracts & Riders", description: "Help with contracts, riders, and agreements", order: 3, isActive: true },
  { id: 4, name: "Messaging & Communication", description: "Issues with messaging and communication features", order: 4, isActive: true },
  { id: 5, name: "Account & Profile", description: "Account management, profile updates, and settings", order: 5, isActive: true },
  { id: 6, name: "Technical Issues", description: "General technical problems and bugs", order: 6, isActive: true },
];

const faqsData = [
  {
    categoryId: 1,
    question: "How do I create a new booking?",
    answer: "To create a booking, navigate to the Browse page, find an artist you like, and click 'Request Booking'. Fill in your event details and submit. The artist will review and respond to your request.",
    order: 1,
    isActive: true,
  },
  {
    categoryId: 1,
    question: "Can I modify a booking after it's confirmed?",
    answer: "Yes, you can modify booking details by going to your Bookings page, selecting the booking, and clicking Edit. Some changes may require the artist's approval.",
    order: 2,
    isActive: true,
  },
  {
    categoryId: 2,
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) and digital wallets through our Stripe payment processor. Payments are secure and encrypted.",
    order: 3,
    isActive: true,
  },
  {
    categoryId: 2,
    question: "When do I get paid after a booking?",
    answer: "Artists receive payment 3 business days after the event date. Payments are transferred directly to your connected bank account.",
    order: 4,
    isActive: true,
  },
  {
    categoryId: 3,
    question: "What is a rider and why do I need one?",
    answer: "A rider is a document that outlines your technical, hospitality, and financial requirements for a performance. It helps venues understand what you need to deliver your best performance.",
    order: 5,
    isActive: true,
  },
  {
    categoryId: 4,
    question: "How do I contact an artist directly?",
    answer: "Use the Messages feature in your Dashboard. Click on a conversation or start a new message with an artist. Messages are encrypted and secure.",
    order: 6,
    isActive: true,
  },
  {
    categoryId: 5,
    question: "How do I update my profile?",
    answer: "Go to your Dashboard, click on your Profile tab, and edit your information. You can update your photo, bio, location, and other details.",
    order: 7,
    isActive: true,
  },
];

const knowledgeBaseArticlesData = [
  {
    categoryId: 1,
    title: "Getting Started with Bookings",
    slug: "getting-started-bookings",
    content: `# Getting Started with Bookings

Ologywood makes it easy to book talented artists for your events. Here's how to get started:

## For Venues:
1. Browse our artist directory by genre, location, or rating
2. Click on an artist's profile to see their details and availability
3. Click "Request Booking" to start the booking process
4. Fill in your event details (date, time, location, budget)
5. Submit your request and wait for the artist to respond

## For Artists:
1. Set your availability on the Calendar page
2. Create your rider with technical and hospitality requirements
3. Respond to booking requests from venues
4. Confirm bookings and manage contracts

## Tips:
- Add as much detail as possible in your booking request
- Respond quickly to booking inquiries
- Use the messaging feature to clarify any details`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 1,
    title: "Managing Your Calendar and Availability",
    slug: "managing-calendar-availability",
    content: `# Managing Your Calendar and Availability

Keep your calendar up to date so venues can see when you're available.

## How to Update Your Availability:
1. Go to the Calendar page
2. Click on dates to mark them as available or unavailable
3. You can block dates for personal time or other commitments
4. Your availability is visible to venues when they browse

## Color Coding:
- Green: Available for bookings
- Red: Unavailable/Blocked
- Blue: Booked events

## Best Practices:
- Update your calendar at least 3 months in advance
- Block dates you're unavailable to prevent booking requests
- Mark confirmed bookings on your calendar
- Review and update regularly`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 2,
    title: "Understanding Payment Processing",
    slug: "understanding-payment-processing",
    content: `# Understanding Payment Processing

Learn how payments work on Ologywood.

## Payment Timeline:
1. Venue creates a booking request with payment amount
2. Once confirmed, payment is processed immediately
3. Artists receive payment 3 business days after the event
4. Payments are sent to your connected bank account

## Payment Methods:
- Credit/Debit Cards (Visa, Mastercard, Amex)
- Digital Wallets
- Bank Transfers (for large amounts)

## Fees:
- Artists: 15% platform fee on bookings
- Venues: No booking fees (payment processing fees apply)

## Invoices:
- Automatic invoices are generated for all transactions
- Download invoices from your Payments page
- Invoices are sent via email for your records`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 3,
    title: "Creating and Managing Your Rider",
    slug: "creating-managing-rider",
    content: `# Creating and Managing Your Rider

Your rider is your professional requirements document.

## What to Include:
1. Technical Requirements
   - Sound system needs
   - Lighting requirements
   - Stage setup
   - Equipment provided

2. Hospitality Requirements
   - Dressing room needs
   - Catering requirements
   - Parking/Transportation
   - Guest list accommodations

3. Financial Terms
   - Performance fee
   - Payment terms
   - Cancellation policy
   - Additional fees

## How to Create a Rider:
1. Go to Riders page
2. Click "Create New Rider"
3. Fill in your requirements
4. Save and download as PDF
5. Share with venues during booking process

## Tips:
- Keep your rider professional and clear
- Update regularly as your needs change
- Be specific about requirements
- Include your cancellation policy`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 4,
    title: "Using the Messaging Feature",
    slug: "using-messaging-feature",
    content: `# Using the Messaging Feature

Stay connected with artists and venues through secure messaging.

## How to Send a Message:
1. Go to the Messages page
2. Click on a conversation or start a new one
3. Type your message
4. Click Send

## Message Features:
- Real-time notifications
- Message history
- Search conversations
- Read receipts
- Typing indicators

## Best Practices:
- Be professional and courteous
- Respond promptly to inquiries
- Keep important details in writing
- Use messages for clarifications and questions

## Privacy:
- All messages are encrypted
- Only you and the recipient can see messages
- Messages are stored securely on our servers`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 5,
    title: "Setting Up Your Artist Profile",
    slug: "setting-up-artist-profile",
    content: `# Setting Up Your Artist Profile

Your profile is your storefront on Ologywood.

## Profile Components:
1. Profile Photo
   - High quality headshot or band photo
   - Professional appearance
   - Clear, well-lit image

2. Bio
   - Brief description of your music/performance
   - Genres and styles
   - Notable achievements
   - Keep it concise (200-300 words)

3. Location
   - Your primary location
   - Willing to travel radius
   - Tour schedule if applicable

4. Rates
   - Your standard booking rate
   - Minimum booking amount
   - Special rates for different event types

5. Media
   - Photos from past performances
   - Video clips or performance reels
   - Press photos

## Tips:
- Use professional photos
- Write a compelling bio
- Keep information current
- Add media to showcase your talent
- Respond to booking requests quickly`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 6,
    title: "Troubleshooting Common Issues",
    slug: "troubleshooting-common-issues",
    content: `# Troubleshooting Common Issues

## I can't log in to my account
- Check that you're using the correct email address
- Reset your password if you've forgotten it
- Clear your browser cache and cookies
- Try a different browser
- Contact support if the issue persists

## My bookings aren't showing up
- Refresh the page
- Check that you're logged in to the correct account
- Verify the booking status in your Dashboard
- Check your email for booking confirmations

## Payment issues
- Verify your payment method is valid
- Check that your card hasn't expired
- Ensure sufficient funds are available
- Try a different payment method
- Contact support for assistance

## Messages not sending
- Check your internet connection
- Refresh the page
- Try sending again
- Clear your browser cache
- Contact support if the issue continues

## Profile not updating
- Save your changes before leaving the page
- Refresh to see updates
- Check file sizes for images (max 5MB)
- Try a different browser
- Contact support for help`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
];

export const adminSeedRouter = router({
  seedSupportData: protectedProcedure.mutation(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Seed categories
      for (const category of supportCategoriesData) {
        await db
          .insert(supportCategories)
          .values(category)
          .onDuplicateKeyUpdate({ set: { name: category.name } });
      }

      // Seed FAQs
      for (const faq of faqsData) {
        await db.insert(faqs).values(faq);
      }

      // Seed knowledge base articles
      for (const article of knowledgeBaseArticlesData) {
        await db.insert(knowledgeBaseArticles).values(article);
      }

      return {
        success: true,
        message: `Seeded ${supportCategoriesData.length} categories, ${faqsData.length} FAQs, and ${knowledgeBaseArticlesData.length} articles`,
      };
    } catch (error) {
      console.error("Seed error:", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to seed support data",
      });
    }
  }),
});
