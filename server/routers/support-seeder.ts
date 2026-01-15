import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { supportCategories, faqs, knowledgeBaseArticles } from "../../drizzle/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

const supportCategoriesData = [
  { id: 1, name: "Booking & Scheduling", description: "Issues related to creating and managing bookings", order: 1, isActive: true },
  { id: 2, name: "Payments & Invoicing", description: "Questions about payments, invoices, and billing", order: 2, isActive: true },
  { id: 3, name: "Contracts & Riders", description: "Help with contracts, riders, and agreements", order: 3, isActive: true },
  { id: 4, name: "Messaging & Communication", description: "Issues with messaging and communication features", order: 4, isActive: true },
  { id: 5, name: "Account & Profile", description: "Account management, profile updates, and settings", order: 5, isActive: true },
  { id: 6, name: "Technical Issues", description: "General technical problems and bugs", order: 6, isActive: true },
];

const faqsData = [
  { categoryId: 1, question: "How do I create a new booking?", answer: "To create a booking, navigate to the Browse page, find an artist you like, and click 'Request Booking'. Fill in your event details and submit. The artist will review and respond to your request.", order: 1, isActive: true },
  { categoryId: 1, question: "Can I modify a booking after it's confirmed?", answer: "Yes, you can modify booking details by going to your Bookings page, selecting the booking, and clicking Edit. Some changes may require the artist's approval.", order: 2, isActive: true },
  { categoryId: 2, question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, Mastercard, American Express) and digital wallets through our Stripe payment processor. Payments are secure and encrypted.", order: 3, isActive: true },
  { categoryId: 2, question: "When do I get paid after a booking?", answer: "Artists receive payment 3 business days after the event date. Payments are transferred directly to your connected bank account.", order: 4, isActive: true },
  { categoryId: 3, question: "What is a rider and why do I need one?", answer: "A rider is a document that outlines your technical, hospitality, and financial requirements for a performance. It helps venues understand what you need to deliver your best performance.", order: 5, isActive: true },
  { categoryId: 4, question: "How do I contact an artist directly?", answer: "Use the Messages feature in your Dashboard. Click on a conversation or start a new message with an artist. Messages are encrypted and secure.", order: 6, isActive: true },
  { categoryId: 5, question: "How do I update my profile?", answer: "Go to your Dashboard, click on your Profile tab, and edit your information. You can update your photo, bio, location, and other details.", order: 7, isActive: true },
];

const knowledgeBaseArticlesData = [
  {
    categoryId: 1,
    title: "Getting Started with Bookings",
    slug: "getting-started-bookings",
    content: `# Getting Started with Bookings\n\nOlogywood makes it easy to book talented artists for your events. Here's how to get started:\n\n## For Venues:\n1. Browse our artist directory by genre, location, or rating\n2. Click on an artist's profile to see their details and availability\n3. Click "Request Booking" to start the booking process\n4. Fill in your event details (date, time, location, budget)\n5. Submit your request and wait for the artist to respond\n\n## For Artists:\n1. Set your availability on the Calendar page\n2. Create your rider with technical and hospitality requirements\n3. Respond to booking requests from venues\n4. Confirm bookings and manage contracts\n\n## Tips:\n- Add as much detail as possible in your booking request\n- Respond quickly to booking inquiries\n- Use the messaging feature to clarify any details`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 1,
    title: "Managing Your Calendar and Availability",
    slug: "managing-calendar-availability",
    content: `# Managing Your Calendar and Availability\n\nKeep your calendar up to date so venues can see when you're available.\n\n## How to Update Your Availability:\n1. Go to the Calendar page\n2. Click on dates to mark them as available or unavailable\n3. You can block dates for personal time or other commitments\n4. Your availability is visible to venues when they browse\n\n## Color Coding:\n- Green: Available for bookings\n- Red: Unavailable/Blocked\n- Blue: Booked events\n\n## Best Practices:\n- Update your calendar at least 3 months in advance\n- Block dates you're unavailable to prevent booking requests\n- Mark confirmed bookings on your calendar\n- Review and update regularly`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 2,
    title: "Understanding Payment Processing",
    slug: "understanding-payment-processing",
    content: `# Understanding Payment Processing\n\nLearn how payments work on Ologywood.\n\n## Payment Timeline:\n1. Venue creates a booking request with payment amount\n2. Once confirmed, payment is processed immediately\n3. Artists receive payment 3 business days after the event\n4. Payments are sent to your connected bank account\n\n## Payment Methods:\n- Credit/Debit Cards (Visa, Mastercard, Amex)\n- Digital Wallets\n- Bank Transfers (for large amounts)\n\n## Fees:\n- Artists: 15% platform fee on bookings\n- Venues: No booking fees (payment processing fees apply)\n\n## Invoices:\n- Automatic invoices are generated for all transactions\n- Download invoices from your Payments page\n- Invoices are sent via email for your records`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 3,
    title: "Creating and Managing Your Rider",
    slug: "creating-managing-rider",
    content: `# Creating and Managing Your Rider\n\nYour rider is your professional requirements document.\n\n## What to Include:\n1. Technical Requirements\n   - Sound system needs\n   - Lighting requirements\n   - Stage setup\n   - Equipment provided\n\n2. Hospitality Requirements\n   - Dressing room needs\n   - Catering requirements\n   - Parking/Transportation\n   - Guest list accommodations\n\n3. Financial Terms\n   - Performance fee\n   - Payment terms\n   - Cancellation policy\n   - Additional fees\n\n## How to Create a Rider:\n1. Go to Riders page\n2. Click "Create New Rider"\n3. Fill in your requirements\n4. Save and download as PDF\n5. Share with venues during booking process\n\n## Tips:\n- Keep your rider professional and clear\n- Update regularly as your needs change\n- Be specific about requirements\n- Include your cancellation policy`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 4,
    title: "Using the Messaging Feature",
    slug: "using-messaging-feature",
    content: `# Using the Messaging Feature\n\nStay connected with artists and venues through secure messaging.\n\n## How to Send a Message:\n1. Go to the Messages page\n2. Click on a conversation or start a new one\n3. Type your message\n4. Click Send\n\n## Message Features:\n- Real-time notifications\n- Message history\n- Search conversations\n- Read receipts\n- Typing indicators\n\n## Best Practices:\n- Be professional and courteous\n- Respond promptly to inquiries\n- Keep important details in writing\n- Use messages for clarifications and questions\n\n## Privacy:\n- All messages are encrypted\n- Only you and the recipient can see messages\n- Messages are stored securely on our servers`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 5,
    title: "Setting Up Your Artist Profile",
    slug: "setting-up-artist-profile",
    content: `# Setting Up Your Artist Profile\n\nYour profile is your storefront on Ologywood.\n\n## Profile Components:\n1. Profile Photo\n   - High quality headshot or band photo\n   - Professional appearance\n   - Clear, well-lit image\n\n2. Bio\n   - Brief description of your music/performance\n   - Genres and styles\n   - Notable achievements\n   - Keep it concise (200-300 words)\n\n3. Location\n   - Your primary location\n   - Willing to travel radius\n   - Tour schedule if applicable\n\n4. Rates\n   - Your standard booking rate\n   - Minimum booking amount\n   - Special rates for different event types\n\n5. Media\n   - Photos from past performances\n   - Video clips or performance reels\n   - Press photos\n\n## Tips:\n- Use professional photos\n- Write a compelling bio\n- Keep information current\n- Add media to showcase your talent\n- Respond to booking requests quickly`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
  {
    categoryId: 6,
    title: "Troubleshooting Common Issues",
    slug: "troubleshooting-common-issues",
    content: `# Troubleshooting Common Issues\n\n## I can't log in to my account\n- Check that you're using the correct email address\n- Reset your password if you've forgotten it\n- Clear your browser cache and cookies\n- Try a different browser\n- Contact support if the issue persists\n\n## My bookings aren't showing up\n- Refresh the page\n- Check that you're logged in to the correct account\n- Verify the booking status in your Dashboard\n- Check your email for booking confirmations\n\n## Payment issues\n- Verify your payment method is valid\n- Check that your card hasn't expired\n- Ensure sufficient funds are available\n- Try a different payment method\n- Contact support for assistance\n\n## Messages not sending\n- Check your internet connection\n- Refresh the page\n- Try sending again\n- Clear your browser cache\n- Contact support if the issue continues\n\n## Profile not updating\n- Save your changes before leaving the page\n- Refresh to see updates\n- Check file sizes for images (max 5MB)\n- Try a different browser\n- Contact support for help`,
    isPublished: true,
    views: 0,
    helpfulVotes: 0,
    unhelpfulVotes: 0,
  },
];

export const supportSeederRouter = router({
  seedSupportData: protectedProcedure.mutation(async ({ ctx }) => {
    // Check if user is admin
    if (ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      let categoriesCount = 0;
      let faqsCount = 0;
      let articlesCount = 0;

      // Seed categories
      for (const category of supportCategoriesData) {
        const existing = await db
          .select()
          .from(supportCategories)
          .where(eq(supportCategories.id, category.id))
          .then((res: any) => res[0]);

        if (!existing) {
          await db.insert(supportCategories).values(category);
          categoriesCount++;
        }
      }

      // Seed FAQs
      for (const faq of faqsData) {
        await db.insert(faqs).values(faq);
        faqsCount++;
      }

      // Seed knowledge base articles
      for (const article of knowledgeBaseArticlesData) {
        await db.insert(knowledgeBaseArticles).values(article);
        articlesCount++;
      }

      return {
        success: true,
        message: `✅ Seeded ${categoriesCount} categories, ${faqsCount} FAQs, and ${articlesCount} articles`,
        stats: {
          categories: categoriesCount,
          faqs: faqsCount,
          articles: articlesCount,
        },
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
