#!/usr/bin/env node

/**
 * Email Testing Script
 * Tests all email templates by sending them to a test email address
 */

import { testAllEmailTemplates, getSummary } from './server/emailTestingService.ts';

const testEmail = process.argv[2] || 'garychisolm30@gmail.com';

console.log('🚀 Starting Email Template Test Suite');
console.log(`📧 Test email: ${testEmail}`);
console.log('─'.repeat(60));

try {
  const results = await testAllEmailTemplates(testEmail);
  const summary = getSummary(results);

  console.log('\n📊 Test Results Summary:');
  console.log(`   Total Templates: ${summary.total}`);
  console.log(`   ✅ Successful: ${summary.successful}`);
  console.log(`   ❌ Failed: ${summary.failed}`);
  console.log(`   📈 Success Rate: ${summary.successRate}%`);
  console.log('─'.repeat(60));

  console.log('\n📋 Detailed Results:');
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.templateName}`);
    if (result.status === 'failed') {
      console.log(`   └─ Error: ${result.message}`);
    }
  });

  console.log('\n' + '─'.repeat(60));
  console.log(`\n✨ Email test suite completed!`);
  console.log(`\n📬 Check ${testEmail} for all test emails.`);
  console.log('\n📌 What you should see in your inbox:');
  console.log('   1. Password Reset Email');
  console.log('   2. Payment Failed Notification');
  console.log('   3. Subscription Upgraded Confirmation');
  console.log('   4. Subscription Downgraded Notification');
  console.log('   5. Invoice/Billing Statement');
  console.log('   6. Dispute Resolution Email');
  console.log('   7. Welcome Email (Artist)');
  console.log('   8. Welcome Email (Venue)');
  console.log('   9. Onboarding Tips (Artist)');
  console.log('   10. Onboarding Tips (Venue)');
  console.log('   11. Booking Request Notification');
  console.log('   12. Booking Confirmation');
  console.log('   13. Subscription Created');
  console.log('   14. Trial Ending Reminder');

  process.exit(summary.failed > 0 ? 1 : 0);
} catch (error) {
  console.error('\n❌ Error running email tests:');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
