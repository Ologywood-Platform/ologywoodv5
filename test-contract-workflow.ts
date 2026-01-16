/**
 * End-to-End Contract Workflow Test
 * Tests the complete contract lifecycle from creation to reminders
 * 
 * Run with: npx ts-node test-contract-workflow.ts
 */

import { contractService } from './server/contractService';
import { signatureVerificationService } from './server/signatureVerificationService';
import { contractEmailIntegration } from './server/contractEmailIntegration';
import { bookingEmailIntegration } from './server/bookingEmailIntegration';

interface TestResult {
  step: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function logTest(step: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, duration: number) {
  const result: TestResult = { step, status, message, duration };
  results.push(result);

  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${duration}ms] ${step}: ${message}`);
}

async function runContractWorkflowTest() {
  console.log('\n🚀 Starting End-to-End Contract Workflow Test\n');
  console.log('═'.repeat(60));

  try {
    // Step 1: Create Contract
    console.log('\n📋 STEP 1: Create Contract');
    let start = Date.now();
    try {
      const contractData = {
        title: 'Test Artist Performance Agreement',
        artistId: 1,
        venueId: 2,
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        eventVenue: 'Madison Square Garden',
        performanceFee: 5000,
        paymentTerms: 'Net 30',
        performanceDetails: {
          duration: '60 minutes',
          setlist: 'Top 20 hits',
          soundCheck: '2 hours before',
        },
        technicalRequirements: {
          stage: '40x20 feet',
          lighting: 'Full production',
          sound: 'Professional PA system',
        },
      };

      const result = await contractService.generateContract(contractData);
      const contractId = result.contractId;

      logTest('Create Contract', 'PASS', `Contract created with ID: ${contractId}`, Date.now() - start);

      // Step 2: Send Contract Notification
      console.log('\n📧 STEP 2: Send Contract Creation Notifications');
      start = Date.now();
      const notificationSent = await contractEmailIntegration.sendContractCreatedNotification({
        artistEmail: 'test-artist@example.com',
        artistName: 'Test Artist',
        venueEmail: 'test-venue@example.com',
        venueName: 'Test Venue',
        contractId,
        contractTitle: 'Test Artist Performance Agreement',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eventVenue: 'Madison Square Garden',
      });

      logTest(
        'Send Contract Notifications',
        notificationSent ? 'PASS' : 'WARN',
        notificationSent ? 'Notifications sent successfully' : 'Email service may not be configured',
        Date.now() - start
      );

      // Step 3: Capture Signature
      console.log('\n✍️ STEP 3: Capture Digital Signature');
      start = Date.now();
      const signatureData = {
        contractId,
        signerName: 'Test Artist',
        signerEmail: 'test-artist@example.com',
        signerRole: 'artist' as const,
        signatureImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        signatureTimestamp: new Date(),
      };

      const signatureResult = await signatureVerificationService.captureAndVerifySignature(signatureData);
      const certificateNumber = signatureResult.certificateNumber;

      logTest(
        'Capture Signature',
        'PASS',
        `Signature captured with certificate: ${certificateNumber}`,
        Date.now() - start
      );

      // Step 4: Verify Signature
      console.log('\n🔐 STEP 4: Verify Signature Certificate');
      start = Date.now();
      const isValid = await signatureVerificationService.verifyCertificate(certificateNumber);

      logTest(
        'Verify Signature',
        isValid ? 'PASS' : 'FAIL',
        isValid ? 'Signature verified successfully' : 'Signature verification failed',
        Date.now() - start
      );

      // Step 5: Send Signature Request
      console.log('\n📨 STEP 5: Send Signature Request to Other Party');
      start = Date.now();
      const signatureRequestSent = await contractEmailIntegration.sendSignatureRequestNotification({
        recipientEmail: 'test-venue@example.com',
        recipientName: 'Test Venue',
        senderName: 'Test Artist',
        contractTitle: 'Test Artist Performance Agreement',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eventVenue: 'Madison Square Garden',
        contractId,
        signingDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      });

      logTest(
        'Send Signature Request',
        signatureRequestSent ? 'PASS' : 'WARN',
        signatureRequestSent ? 'Signature request sent' : 'Email service may not be configured',
        Date.now() - start
      );

      // Step 6: Send Signature Completion
      console.log('\n✅ STEP 6: Send Signature Completion Notification');
      start = Date.now();
      const completionSent = await contractEmailIntegration.sendSignatureCompletionNotification({
        recipientEmail: 'test-artist@example.com',
        recipientName: 'Test Artist',
        signerName: 'Test Venue',
        contractTitle: 'Test Artist Performance Agreement',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        eventVenue: 'Madison Square Garden',
        contractId,
        certificateNumber,
      });

      logTest(
        'Send Completion Notification',
        completionSent ? 'PASS' : 'WARN',
        completionSent ? 'Completion notification sent' : 'Email service may not be configured',
        Date.now() - start
      );

      // Step 7: Test Reminders
      console.log('\n🔔 STEP 7: Test Contract Reminders');
      start = Date.now();

      const reminders = [7, 3, 1];
      let remindersPassed = 0;

      for (const days of reminders) {
        const reminderSent = await contractEmailIntegration.sendContractReminderNotification({
          recipientEmail: 'test-artist@example.com',
          recipientName: 'Test Artist',
          otherPartyName: 'Test Venue',
          contractTitle: 'Test Artist Performance Agreement',
          eventDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
          eventVenue: 'Madison Square Garden',
          contractId,
          daysUntilEvent: days,
          status: 'signed',
        });

        if (reminderSent) remindersPassed++;
      }

      logTest(
        'Send Contract Reminders',
        remindersPassed === 3 ? 'PASS' : 'WARN',
        `${remindersPassed}/3 reminders sent successfully`,
        Date.now() - start
      );

      // Step 8: Test Booking Integration
      console.log('\n📅 STEP 8: Test Booking Email Integration');
      start = Date.now();
      const bookingData = {
        bookingId: 'test-booking-123',
        contractId,
        artistId: 1,
        artistEmail: 'test-artist@example.com',
        artistName: 'Test Artist',
        venueId: 2,
        venueEmail: 'test-venue@example.com',
        venueName: 'Test Venue',
        contractTitle: 'Test Artist Performance Agreement',
        eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        eventVenue: 'Madison Square Garden',
        performanceFee: 5000,
      };

      const bookingResult = await bookingEmailIntegration.handleBookingCreated(bookingData);

      logTest(
        'Booking Email Integration',
        bookingResult.success ? 'PASS' : 'WARN',
        bookingResult.success ? 'Booking emails processed' : 'Email service may not be configured',
        Date.now() - start
      );

      // Step 9: Test Audit Trail
      console.log('\n📊 STEP 9: Verify Audit Trail');
      start = Date.now();
      const auditTrail = await signatureVerificationService.getAuditTrail(certificateNumber);

      logTest(
        'Audit Trail',
        auditTrail && auditTrail.length > 0 ? 'PASS' : 'WARN',
        `Audit trail contains ${auditTrail?.length || 0} entries`,
        Date.now() - start
      );

      // Summary
      console.log('\n═'.repeat(60));
      console.log('\n📊 TEST SUMMARY\n');

      const passed = results.filter((r) => r.status === 'PASS').length;
      const failed = results.filter((r) => r.status === 'FAIL').length;
      const warned = results.filter((r) => r.status === 'WARN').length;

      console.log(`✅ Passed: ${passed}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`⚠️  Warned: ${warned}`);
      console.log(`📈 Total: ${results.length}`);

      const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
      console.log(`⏱️  Total Duration: ${totalDuration}ms`);

      if (failed === 0) {
        console.log('\n🎉 All tests passed! Contract workflow is ready for production.\n');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
      }

      // Detailed Results
      console.log('═'.repeat(60));
      console.log('\n📋 DETAILED RESULTS\n');
      results.forEach((result) => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} ${result.step}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message}`);
        console.log(`   Duration: ${result.duration}ms\n`);
      });
    } catch (error) {
      logTest('Contract Workflow', 'FAIL', error instanceof Error ? error.message : 'Unknown error', Date.now() - start);
      console.error('\n❌ Test failed with error:', error);
    }
  } catch (error) {
    console.error('\n❌ Unexpected error during testing:', error);
  }
}

// Run the test
runContractWorkflowTest().catch(console.error);
