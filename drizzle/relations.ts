import { relations } from "drizzle-orm/relations";
import { supportTickets, supportTicketResponses, ticketAssignments, ticketResponses } from "./schema";

export const supportTicketResponsesRelations = relations(supportTicketResponses, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [supportTicketResponses.ticketId],
		references: [supportTickets.id]
	}),
}));

export const supportTicketsRelations = relations(supportTickets, ({many}) => ({
	supportTicketResponses: many(supportTicketResponses),
	ticketAssignments: many(ticketAssignments),
	ticketResponses: many(ticketResponses),
}));

export const ticketAssignmentsRelations = relations(ticketAssignments, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [ticketAssignments.ticketId],
		references: [supportTickets.id]
	}),
}));

export const ticketResponsesRelations = relations(ticketResponses, ({one}) => ({
	supportTicket: one(supportTickets, {
		fields: [ticketResponses.ticketId],
		references: [supportTickets.id]
	}),
}));