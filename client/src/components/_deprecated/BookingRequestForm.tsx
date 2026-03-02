import React, { useState } from "react";
import { Calendar, MapPin, DollarSign, FileText, Send, AlertCircle } from "lucide-react";

interface BookingRequestFormProps {
  artistId: number;
  artistName: string;
  onSubmit?: (data: BookingRequest) => void;
}

interface BookingRequest {
  artistId: number;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  eventName: string;
  eventDescription: string;
  budget: number;
  venueType: string;
  expectedAttendance: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
}

export function BookingRequestForm({ artistId, artistName, onSubmit }: BookingRequestFormProps) {
  const [formData, setFormData] = useState<BookingRequest>({
    artistId,
    eventDate: "",
    eventTime: "",
    eventLocation: "",
    eventName: "",
    eventDescription: "",
    budget: 0,
    venueType: "other",
    expectedAttendance: 0,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventName.trim()) newErrors.eventName = "Event name is required";
    if (!formData.eventDate) newErrors.eventDate = "Event date is required";
    if (!formData.eventTime) newErrors.eventTime = "Event time is required";
    if (!formData.eventLocation.trim()) newErrors.eventLocation = "Event location is required";
    if (formData.budget <= 0) newErrors.budget = "Budget must be greater than 0";
    if (formData.expectedAttendance <= 0) newErrors.expectedAttendance = "Expected attendance must be greater than 0";
    if (!formData.contactName.trim()) newErrors.contactName = "Contact name is required";
    if (!formData.contactEmail.trim()) newErrors.contactEmail = "Contact email is required";
    if (!formData.contactEmail.includes("@")) newErrors.contactEmail = "Valid email is required";
    if (!formData.contactPhone.trim()) newErrors.contactPhone = "Contact phone is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "budget" || name === "expectedAttendance" ? parseInt(value) || 0 : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (onSubmit) {
        onSubmit(formData);
      }

      setSubmitSuccess(true);
      setFormData({
        artistId,
        eventDate: "",
        eventTime: "",
        eventLocation: "",
        eventName: "",
        eventDescription: "",
        budget: 0,
        venueType: "other",
        expectedAttendance: 0,
        contactName: "",
        contactEmail: "",
        contactPhone: "",
      });

      // Reset success message after 3 seconds
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (error) {
      console.error("Error submitting booking request:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Booking</h2>
      <p className="text-gray-600 mb-6">Book {artistName} for your event</p>

      {submitSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <div className="text-green-600 mt-0.5">✓</div>
          <div>
            <p className="font-semibold text-green-900">Booking request sent!</p>
            <p className="text-sm text-green-800">The artist will review your request and contact you soon.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Event Details Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Event Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Name *</label>
              <input
                type="text"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="e.g., Summer Music Festival"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.eventName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.eventName && <p className="text-sm text-red-600 mt-1">{errors.eventName}</p>}
            </div>

            {/* Venue Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue Type *</label>
              <select
                name="venueType"
                value={formData.venueType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
              >
                <option value="club">Club</option>
                <option value="festival">Festival</option>
                <option value="theater">Theater</option>
                <option value="corporate">Corporate Event</option>
                <option value="wedding">Wedding</option>
                <option value="private">Private Event</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Event Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Date *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="date"
                  name="eventDate"
                  value={formData.eventDate}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                    errors.eventDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.eventDate && <p className="text-sm text-red-600 mt-1">{errors.eventDate}</p>}
            </div>

            {/* Event Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Time *</label>
              <input
                type="time"
                name="eventTime"
                value={formData.eventTime}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.eventTime ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.eventTime && <p className="text-sm text-red-600 mt-1">{errors.eventTime}</p>}
            </div>

            {/* Event Location */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Event Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  name="eventLocation"
                  value={formData.eventLocation}
                  onChange={handleChange}
                  placeholder="City, Venue Name, or Address"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                    errors.eventLocation ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.eventLocation && <p className="text-sm text-red-600 mt-1">{errors.eventLocation}</p>}
            </div>

            {/* Expected Attendance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expected Attendance *</label>
              <input
                type="number"
                name="expectedAttendance"
                value={formData.expectedAttendance || ""}
                onChange={handleChange}
                placeholder="Number of guests"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.expectedAttendance ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.expectedAttendance && (
                <p className="text-sm text-red-600 mt-1">{errors.expectedAttendance}</p>
              )}
            </div>

            {/* Budget */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Budget (USD) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="number"
                  name="budget"
                  value={formData.budget || ""}
                  onChange={handleChange}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                    errors.budget ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.budget && <p className="text-sm text-red-600 mt-1">{errors.budget}</p>}
            </div>
          </div>
        </div>

        {/* Event Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event Description</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 text-gray-400" size={18} />
            <textarea
              name="eventDescription"
              value={formData.eventDescription}
              onChange={handleChange}
              placeholder="Tell the artist about your event, special requirements, or any additional details..."
              rows={4}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>
        </div>

        {/* Contact Information Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
              <input
                type="text"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                placeholder="Full name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.contactName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.contactName && <p className="text-sm text-red-600 mt-1">{errors.contactName}</p>}
            </div>

            {/* Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.contactEmail ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.contactEmail && <p className="text-sm text-red-600 mt-1">{errors.contactEmail}</p>}
            </div>

            {/* Contact Phone */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 ${
                  errors.contactPhone ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.contactPhone && <p className="text-sm text-red-600 mt-1">{errors.contactPhone}</p>}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div className="text-sm text-blue-800">
            <p className="font-semibold">Your booking request will be sent to the artist.</p>
            <p>They will review your request and contact you within 24-48 hours.</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Send size={20} />
          {isSubmitting ? "Sending Request..." : "Send Booking Request"}
        </button>
      </form>
    </div>
  );
}
