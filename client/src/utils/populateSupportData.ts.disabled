/**
 * Utility to populate support data via TRPC admin endpoints
 * Call this from the admin dashboard to seed support categories, FAQs, and knowledge base articles
 */

export async function populateSupportData(trpcClient: any) {
  try {
    console.log("Starting support data population...");

    // Seed support data
    const result = await trpcClient.adminSeed.seedSupportData.mutate();

    console.log("Support data populated successfully:", result);
    return result;
  } catch (error) {
    console.error("Error populating support data:", error);
    throw error;
  }
}
