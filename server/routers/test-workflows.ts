import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

/**
 * Test Workflows Router
 * Provides pre-configured test scenarios that chain multiple API calls
 */
export const testWorkflowsRouter = router({
  /**
   * Complete Booking Workflow
   * Creates: artist user → artist profile → venue user → venue profile → booking request → acceptance
   */
  runCompleteBookingWorkflow: protectedProcedure
    .input(z.object({ 
      artistName: z.string().default('Test Artist'),
      venueName: z.string().default('Test Venue'),
      eventDate: z.date().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const workflow = {
        steps: [
          {
            step: 1,
            action: 'Create Artist User',
            data: {
              email: `artist-${Date.now()}@test.ologywood`,
              name: input.artistName,
              role: 'artist'
            }
          },
          {
            step: 2,
            action: 'Create Artist Profile',
            data: {
              artistName: input.artistName,
              genre: 'Rock',
              location: 'New York, NY',
              feeRangeMin: 1000,
              feeRangeMax: 3000,
              bio: 'Test artist for workflow validation'
            }
          },
          {
            step: 3,
            action: 'Create Venue User',
            data: {
              email: `venue-${Date.now()}@test.ologywood`,
              name: input.venueName,
              role: 'venue'
            }
          },
          {
            step: 4,
            action: 'Create Venue Profile',
            data: {
              organizationName: input.venueName,
              contactName: 'Test Contact',
              contactPhone: '555-0000'
            }
          },
          {
            step: 5,
            action: 'Send Booking Request',
            data: {
              eventDate: input.eventDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              eventLocation: 'Test Venue Location',
              eventType: 'Concert',
              estimatedAttendees: 200,
              quotedFee: 2000
            }
          },
          {
            step: 6,
            action: 'Artist Accepts Booking',
            data: {
              status: 'accepted'
            }
          }
        ],
        expectedOutcome: 'Booking created and accepted by artist',
        nextSteps: [
          'Process deposit payment with Stripe test card',
          'Artist signs contract',
          'Venue pays full amount',
          'Event occurs and both parties leave reviews'
        ]
      };

      return {
        success: true,
        workflow,
        message: 'Complete Booking Workflow generated. Follow the steps to execute.'
      };
    }),

  /**
   * Payment Processing Workflow
   * Tests: deposit payment → full payment → refund
   */
  runPaymentWorkflow: protectedProcedure
    .input(z.object({ 
      bookingId: z.number().optional(),
      depositAmount: z.number().default(500),
      fullAmount: z.number().default(2000)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const workflow = {
        steps: [
          {
            step: 1,
            action: 'Process Deposit Payment',
            data: {
              amount: input.depositAmount,
              stripeTestCard: '4242 4242 4242 4242',
              description: 'Booking deposit payment'
            }
          },
          {
            step: 2,
            action: 'Verify Deposit Recorded',
            data: {
              expectedStatus: 'deposit_paid',
              expectedAmount: input.depositAmount
            }
          },
          {
            step: 3,
            action: 'Process Full Payment',
            data: {
              amount: input.fullAmount - input.depositAmount,
              stripeTestCard: '4242 4242 4242 4242',
              description: 'Booking full payment'
            }
          },
          {
            step: 4,
            action: 'Verify Full Payment Recorded',
            data: {
              expectedStatus: 'fully_paid',
              expectedTotalAmount: input.fullAmount
            }
          },
          {
            step: 5,
            action: 'Test Refund (Optional)',
            data: {
              refundAmount: input.depositAmount,
              reason: 'Testing refund functionality'
            }
          }
        ],
        testCards: {
          success: '4242 4242 4242 4242',
          decline: '4000 0000 0000 0002',
          requiresAuth: '4000 0025 0000 3155'
        },
        expectedOutcome: 'All payments processed successfully',
        notes: [
          'Use test Stripe cards - no real charges',
          'Check email for payment confirmations',
          'Verify booking status updates after each payment'
        ]
      };

      return {
        success: true,
        workflow,
        message: 'Payment Processing Workflow generated. Use test Stripe cards.'
      };
    }),

  /**
   * Contract Signing Workflow
   * Tests: contract generation → artist signature → venue signature → PDF download
   */
  runContractSigningWorkflow: protectedProcedure
    .input(z.object({ 
      bookingId: z.number().optional(),
      contractType: z.enum(['ryder', 'standard']).default('ryder')
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const workflow = {
        steps: [
          {
            step: 1,
            action: 'Generate Contract',
            data: {
              type: input.contractType,
              includeRider: true,
              includePaymentTerms: true
            }
          },
          {
            step: 2,
            action: 'Artist Reviews Contract',
            data: {
              expectedFields: [
                'Event Date',
                'Event Location',
                'Artist Name',
                'Venue Name',
                'Fee Amount',
                'Technical Requirements',
                'Hospitality Requirements'
              ]
            }
          },
          {
            step: 3,
            action: 'Artist Signs Contract',
            data: {
              signatureMethod: 'canvas',
              instructions: 'Draw signature on canvas or type name'
            }
          },
          {
            step: 4,
            action: 'Venue Reviews Signed Contract',
            data: {
              expectedFields: ['Artist Signature', 'Signature Date']
            }
          },
          {
            step: 5,
            action: 'Venue Signs Contract',
            data: {
              signatureMethod: 'typed',
              instructions: 'Type venue representative name'
            }
          },
          {
            step: 6,
            action: 'Download Signed Contract',
            data: {
              format: 'PDF',
              includeSignatures: true
            }
          }
        ],
        signatureMethods: {
          canvas: 'Draw signature on canvas',
          typed: 'Type name as signature',
          upload: 'Upload signature image'
        },
        expectedOutcome: 'Fully signed contract with both signatures',
        nextSteps: [
          'Archive contract in user dashboard',
          'Send signed contract to both parties via email',
          'Proceed with payment processing'
        ]
      };

      return {
        success: true,
        workflow,
        message: 'Contract Signing Workflow generated. Follow steps to test signature capture.'
      };
    }),

  /**
   * End-to-End Booking Lifecycle
   * Complete workflow: booking → payment → contract → review
   */
  runFullBookingLifecycle: protectedProcedure
    .input(z.object({ 
      includePayment: z.boolean().default(true),
      includeContract: z.boolean().default(true),
      includeReview: z.boolean().default(true)
    }))
    .mutation(async ({ input, ctx }) => {
      if (ctx.user.role !== 'admin') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
      }

      const phases = [
        {
          phase: 'Booking Creation',
          steps: [
            'Create artist and venue accounts',
            'Complete artist profile with availability',
            'Complete venue profile',
            'Send booking request from venue to artist',
            'Artist accepts booking'
          ]
        }
      ];

      if (input.includePayment) {
        phases.push({
          phase: 'Payment Processing',
          steps: [
            'Venue pays deposit (50% of fee)',
            'Verify deposit recorded',
            'Venue pays remaining balance',
            'Verify full payment recorded',
            'Both parties receive payment confirmation emails'
          ]
        });
      }

      if (input.includeContract) {
        phases.push({
          phase: 'Contract Signing',
          steps: [
            'Generate Ryder contract',
            'Artist reviews and signs contract',
            'Venue reviews and signs contract',
            'Both parties download signed PDF',
            'Contract archived in dashboards'
          ]
        });
      }

      if (input.includeReview) {
        phases.push({
          phase: 'Post-Event',
          steps: [
            'Mark booking as completed',
            'Artist submits review of venue',
            'Venue submits review of artist',
            'Both parties receive review notifications',
            'Reviews appear on profiles'
          ]
        });
      }

      return {
        success: true,
        lifecycle: {
          phases,
          estimatedDuration: '30-45 minutes',
          testDataRequired: {
            users: 2,
            profiles: 2,
            bookings: 1
          }
        },
        message: 'Full Booking Lifecycle workflow generated. Estimated 30-45 minutes to complete.'
      };
    })
});
