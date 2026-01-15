/**
 * Email templates for rider acknowledgment workflow
 */

export function riderSubmittedEmail(artistName: string, venueName: string, eventDate: string): string {
  return `
    <h2>Rider Submitted for Review</h2>
    <p>Hello,</p>
    <p><strong>${artistName}</strong> has submitted a performance rider for your event at <strong>${venueName}</strong> on <strong>${eventDate}</strong>.</p>
    
    <h3>Next Steps:</h3>
    <ol>
      <li>Review the rider requirements carefully</li>
      <li>Acknowledge that you can meet the requirements, or</li>
      <li>Propose modifications if needed</li>
    </ol>
    
    <p>Please review and respond within 48 hours to keep the booking process moving forward.</p>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Review Rider
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderAcknowledgedEmail(artistName: string, venueName: string, eventDate: string): string {
  return `
    <h2>Your Rider Has Been Acknowledged</h2>
    <p>Hello ${artistName},</p>
    <p>Great news! <strong>${venueName}</strong> has acknowledged your performance rider for the event on <strong>${eventDate}</strong>.</p>
    
    <p>They have confirmed that they can meet all your technical and hospitality requirements.</p>
    
    <h3>What's Next:</h3>
    <p>The booking is now confirmed. You should receive additional event details and logistics information shortly.</p>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        View Booking Details
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderModificationsProposedEmail(artistName: string, venueName: string, eventDate: string, modificationsCount: number): string {
  return `
    <h2>Rider Modifications Proposed</h2>
    <p>Hello ${artistName},</p>
    <p><strong>${venueName}</strong> has reviewed your rider for the event on <strong>${eventDate}</strong> and has proposed <strong>${modificationsCount}</strong> modification${modificationsCount !== 1 ? 's' : ''}.</p>
    
    <p>They may not be able to meet all requirements as originally submitted, but have proposed alternatives that might work.</p>
    
    <h3>What You Need to Do:</h3>
    <ol>
      <li>Review the proposed modifications</li>
      <li>Approve the changes if they work for you, or</li>
      <li>Reject and suggest counter-proposals</li>
    </ol>
    
    <p>Please respond within 24 hours to keep the booking process on track.</p>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Review Modifications
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderModificationsApprovedEmail(venueName: string, artistName: string, eventDate: string): string {
  return `
    <h2>Rider Modifications Approved</h2>
    <p>Hello,</p>
    <p><strong>${artistName}</strong> has approved the modifications you proposed to their rider for the event on <strong>${eventDate}</strong>.</p>
    
    <p>The rider is now finalized and both parties have agreed on the requirements.</p>
    
    <h3>What's Next:</h3>
    <p>You can now proceed with finalizing the event details and logistics. Make sure to have all the required equipment and arrangements in place.</p>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        View Finalized Rider
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderModificationsRejectedEmail(venueName: string, artistName: string, eventDate: string, reason: string): string {
  return `
    <h2>Rider Modifications Rejected</h2>
    <p>Hello,</p>
    <p><strong>${artistName}</strong> has rejected the modifications you proposed to their rider for the event on <strong>${eventDate}</strong>.</p>
    
    <h3>Their Reason:</h3>
    <p><em>${reason}</em></p>
    
    <h3>What's Next:</h3>
    <p>You have a few options:</p>
    <ol>
      <li>Accept the original rider requirements as submitted</li>
      <li>Propose alternative modifications</li>
      <li>Contact the artist directly to discuss</li>
    </ol>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        Continue Negotiation
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderFinalizedEmail(artistName: string, venueName: string, eventDate: string): string {
  return `
    <h2>Rider Finalized - Event Confirmed</h2>
    <p>Hello ${artistName},</p>
    <p>Excellent! Your rider has been finalized for your performance at <strong>${venueName}</strong> on <strong>${eventDate}</strong>.</p>
    
    <p>Both you and the venue have agreed on all technical and hospitality requirements. The event is now confirmed and ready to go!</p>
    
    <h3>Important Reminders:</h3>
    <ul>
      <li>Confirm your arrival time with the venue</li>
      <li>Bring all necessary equipment as specified in your rider</li>
      <li>Plan for the required setup and soundcheck time</li>
      <li>Confirm any travel or accommodation arrangements</li>
    </ul>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        View Event Details
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}

export function riderRejectedEmail(venueName: string, artistName: string, eventDate: string): string {
  return `
    <h2>Rider Rejected</h2>
    <p>Hello ${artistName},</p>
    <p>Unfortunately, <strong>${venueName}</strong> cannot accommodate your rider requirements for the event on <strong>${eventDate}</strong>.</p>
    
    <p>They are unable to meet the specifications you've outlined and no suitable modifications could be agreed upon.</p>
    
    <h3>What's Next:</h3>
    <p>You have the following options:</p>
    <ol>
      <li>Modify your rider to be more flexible</li>
      <li>Contact the venue directly to discuss alternatives</li>
      <li>Decline the booking and look for other opportunities</li>
    </ol>
    
    <p>
      <a href="{{bookingUrl}}" style="background-color: #7c3aed; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
        View Booking
      </a>
    </p>
    
    <p>Best regards,<br>The Ologywood Team</p>
  `;
}
