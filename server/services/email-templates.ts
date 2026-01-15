/**
 * Email notification templates for support system
 * Provides branded, professional email templates for ticket lifecycle events
 */

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Template for new support ticket confirmation
 */
export function getTicketCreatedTemplate(
  ticketId: number,
  subject: string,
  userName: string,
  ticketUrl: string
): EmailTemplate {
  return {
    subject: `Support Ticket #${ticketId} Created - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .ticket-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Support Ticket Created</h1>
              <p>We've received your support request and assigned it ticket #${ticketId}</p>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Thank you for contacting Ologywood support. We've created a support ticket for your issue:</p>
              
              <div class="ticket-info">
                <strong>Ticket ID:</strong> #${ticketId}<br>
                <strong>Subject:</strong> ${subject}<br>
                <strong>Status:</strong> Open<br>
                <strong>Priority:</strong> Medium
              </div>
              
              <p>Our support team will review your ticket and respond as soon as possible. You can track the status of your ticket at any time:</p>
              
              <a href="${ticketUrl}" class="button">View Your Ticket</a>
              
              <p>If you have any additional information to add, please reply to this email or visit your ticket page.</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
              <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Support Ticket Created\n\nHi ${userName},\n\nThank you for contacting Ologywood support. We've created a support ticket for your issue:\n\nTicket ID: #${ticketId}\nSubject: ${subject}\nStatus: Open\n\nOur support team will review your ticket and respond as soon as possible.\n\nView your ticket: ${ticketUrl}\n\n© 2026 Ologywood`,
  };
}

/**
 * Template for ticket response notification
 */
export function getTicketResponseTemplate(
  ticketId: number,
  subject: string,
  userName: string,
  responseMessage: string,
  ticketUrl: string
): EmailTemplate {
  return {
    subject: `Re: Support Ticket #${ticketId} - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .message-box { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; font-style: italic; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Support Ticket Update</h1>
              <p>Your support ticket #${ticketId} has been updated</p>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Our support team has responded to your ticket:</p>
              
              <div class="message-box">
                ${responseMessage.replace(/\n/g, '<br>')}
              </div>
              
              <p>You can view the full conversation and add your reply:</p>
              
              <a href="${ticketUrl}" class="button">View Ticket & Reply</a>
              
              <p>We appreciate your patience and look forward to resolving your issue.</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Support Ticket Update\n\nHi ${userName},\n\nOur support team has responded to your ticket #${ticketId}:\n\n${responseMessage}\n\nView your ticket: ${ticketUrl}\n\n© 2026 Ologywood`,
  };
}

/**
 * Template for ticket resolution notification
 */
export function getTicketResolvedTemplate(
  ticketId: number,
  subject: string,
  userName: string,
  resolutionMessage: string,
  ticketUrl: string
): EmailTemplate {
  return {
    subject: `Resolved: Support Ticket #${ticketId} - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .resolution-box { background: #ecfdf5; padding: 15px; border-left: 4px solid #10b981; margin: 15px 0; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✓ Support Ticket Resolved</h1>
              <p>Your support ticket #${ticketId} has been marked as resolved</p>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Great news! Your support ticket has been resolved:</p>
              
              <div class="resolution-box">
                <strong>Resolution:</strong><br>
                ${resolutionMessage.replace(/\n/g, '<br>')}
              </div>
              
              <p>If you have any follow-up questions or if the issue persists, please reopen your ticket:</p>
              
              <a href="${ticketUrl}" class="button">View Resolved Ticket</a>
              
              <p>Thank you for choosing Ologywood support!</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Support Ticket Resolved\n\nHi ${userName},\n\nGreat news! Your support ticket #${ticketId} has been resolved:\n\n${resolutionMessage}\n\nView your ticket: ${ticketUrl}\n\nThank you for choosing Ologywood support!\n\n© 2026 Ologywood`,
  };
}

/**
 * Template for ticket assignment notification (for support staff)
 */
export function getTicketAssignedTemplate(
  ticketId: number,
  subject: string,
  staffName: string,
  customerName: string,
  priority: string,
  ticketUrl: string
): EmailTemplate {
  return {
    subject: `Ticket #${ticketId} Assigned to You - ${subject}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .ticket-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 15px 0; }
            .priority-high { color: #dc2626; font-weight: bold; }
            .priority-medium { color: #f59e0b; font-weight: bold; }
            .priority-low { color: #10b981; font-weight: bold; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 30px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>New Ticket Assignment</h1>
              <p>You have been assigned a new support ticket</p>
            </div>
            
            <div class="content">
              <p>Hi ${staffName},</p>
              <p>A new support ticket has been assigned to you:</p>
              
              <div class="ticket-info">
                <strong>Ticket ID:</strong> #${ticketId}<br>
                <strong>Subject:</strong> ${subject}<br>
                <strong>Customer:</strong> ${customerName}<br>
                <strong>Priority:</strong> <span class="priority-${priority.toLowerCase()}">${priority}</span><br>
                <strong>Status:</strong> Open
              </div>
              
              <p>Please review and respond to this ticket as soon as possible:</p>
              
              <a href="${ticketUrl}" class="button">View Ticket</a>
              
              <p>Thank you for your support!</p>
            </div>
            
            <div class="footer">
              <p>© 2026 Ologywood. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `New Ticket Assignment\n\nHi ${staffName},\n\nA new support ticket has been assigned to you:\n\nTicket ID: #${ticketId}\nSubject: ${subject}\nCustomer: ${customerName}\nPriority: ${priority}\n\nView ticket: ${ticketUrl}\n\n© 2026 Ologywood`,
  };
}
