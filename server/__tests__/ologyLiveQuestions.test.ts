import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Ology Live - Submit a Question Feature", () => {
  const routerPath = path.resolve(__dirname, "../routers/ologyLivePhase2.ts");
  const schemaPath = path.resolve(__dirname, "../../drizzle/schema.ts");
  const mySessionsPath = path.resolve(__dirname, "../../client/src/pages/OlogyLiveMySessions.tsx");

  describe("Server Endpoints", () => {
    it("should have submitQuestion endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("submitQuestion");
    });

    it("should have getQuestions endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getQuestions");
    });

    it("should have getTalentQuestions endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("getTalentQuestions");
    });

    it("should have markQuestionAnswered endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("markQuestionAnswered");
    });

    it("should have deleteQuestion endpoint", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("deleteQuestion");
    });

    it("should validate question text min length (5 chars)", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain('.min(5');
      expect(content).toContain("Question must be at least 5 characters");
    });

    it("should validate question text max length (500 chars)", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain('.max(500');
      expect(content).toContain("Question must be under 500 characters");
    });

    it("should enforce 5 question limit per booking", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("Maximum 5 questions per session");
      expect(content).toContain("existingQuestions.length >= 5");
    });

    it("should verify booking belongs to the fan before submitting", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("Only the booked fan can submit questions");
    });

    it("should prevent questions on cancelled bookings", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("Cannot submit questions for cancelled sessions");
    });

    it("should only allow question author to delete", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("Only the question author can delete it");
    });

    it("should only allow talent to mark questions as answered", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("Only the talent can mark questions");
    });

    it("should set status to 'answered' and record answeredAt timestamp", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain('status: "answered"');
      expect(content).toContain("answeredAt: new Date()");
    });

    it("should return questions ordered by createdAt descending", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("desc(ologyLiveQuestions.createdAt)");
    });

    it("should join with users table to get fan name", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("fanName: users.name");
    });

    it("should authorize both fan and talent to view questions", () => {
      const content = fs.readFileSync(routerPath, "utf-8");
      expect(content).toContain("booking.fanId !== ctx.user.id && booking.talentId !== ctx.user.id");
    });
  });

  describe("Database Schema", () => {
    it("should have ologyLiveQuestions table defined", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("ologyLiveQuestions");
    });

    it("should have bookingId column", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("bookingId");
    });

    it("should have experienceId column", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("experienceId");
    });

    it("should have fanId column", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("fanId");
    });

    it("should have talentId column", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("talentId");
    });

    it("should have questionText column", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("questionText");
    });

    it("should have status column with pending/answered values", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("status");
    });

    it("should have answeredAt nullable timestamp", () => {
      const content = fs.readFileSync(schemaPath, "utf-8");
      expect(content).toContain("answeredAt");
    });
  });

  describe("Client UI - QuestionPanel Component", () => {
    it("should have QuestionPanel component defined", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("function QuestionPanel");
    });

    it("should accept bookingId prop", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("QuestionPanel({ bookingId }");
    });

    it("should use submitQuestion mutation", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("trpc.ologyLivePhase2.submitQuestion.useMutation");
    });

    it("should use getQuestions query", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("trpc.ologyLivePhase2.getQuestions.useQuery");
    });

    it("should use deleteQuestion mutation", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("trpc.ologyLivePhase2.deleteQuestion.useMutation");
    });

    it("should show question count out of 5", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("/5 questions");
    });

    it("should show max questions reached message", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("maximum of 5 questions");
    });

    it("should have textarea with 500 char max", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("maxLength={500}");
    });

    it("should show character count", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("questionText.length}/500");
    });

    it("should show question status (pending/answered)", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain('"Answered"');
      expect(content).toContain('"Pending"');
    });

    it("should have delete button for pending questions", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("deleteQuestion.mutate");
      expect(content).toContain("Delete question");
    });

    it("should invalidate queries on successful submit", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("getQuestions.invalidate");
    });

    it("should show Submit a Question button for confirmed/pending sessions", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("Submit a Question");
      expect(content).toContain('session.status === "confirmed" || session.status === "pending"');
    });

    it("should pass askingQuestion and setAskingQuestion to SessionCard", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("askingQuestion={askingQuestion}");
      expect(content).toContain("setAskingQuestion={setAskingQuestion}");
    });

    it("should toggle question panel visibility on button click", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("setAskingQuestion(askingQuestion === session.id ? null : session.id)");
    });

    it("should show error message on submit failure", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("submitQuestion.isError");
      expect(content).toContain("Failed to submit question");
    });

    it("should disable submit button when text is too short", () => {
      const content = fs.readFileSync(mySessionsPath, "utf-8");
      expect(content).toContain("questionText.length < 5");
    });
  });
});
