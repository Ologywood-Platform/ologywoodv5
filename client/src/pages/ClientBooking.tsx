import { toSlug } from '@/lib/slugify';
import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { trpc } from '../lib/trpc';
import { formatEventTime } from '../lib/utils';
import { useAuth } from '../_core/hooks/useAuth';
import { Calendar, MapPin, DollarSign, User, Mail, Phone, ArrowLeft, ArrowRight, Check, Music, ChevronLeft } from 'lucide-react';
import { SiteHeader } from "@/components/SiteHeader";

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding', icon: '💒' },
  { value: 'corporate', label: 'Corporate Event', icon: '🏢' },
  { value: 'birthday', label: 'Birthday Party', icon: '🎂' },
  { value: 'church', label: 'Church / Religious', icon: '⛪' },
  { value: 'festival', label: 'Festival', icon: '🎪' },
  { value: 'house_party', label: 'House Party', icon: '🏠' },
  { value: 'restaurant', label: 'Restaurant / Bar', icon: '🍽️' },
  { value: 'other', label: 'Other', icon: '🎵' },
] as const;

type EventType = typeof EVENT_TYPES[number]['value'];

interface FormData {
  eventType: EventType | '';
  eventDate: string;
  eventTime: string;
  venueName: string;
  venueStreet: string;
  venueCity: string;
  venueState: string;
  venueZip: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  totalFee: string;
  eventDetails: string;
}

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

export default function ClientBooking() {
  const [, params] = useRoute('/book/:artistId');
  const artistId = params?.artistId ? parseInt(params.artistId) : 0;
  const [, navigate] = useLocation();
  const { user, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookingId, setBookingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const [form, setForm] = useState<FormData>({
    eventType: '',
    eventDate: '',
    eventTime: '',
    venueName: '',
    venueStreet: '',
    venueCity: '',
    venueState: '',
    venueZip: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    totalFee: '',
    eventDetails: '',
  });

  // Fetch artist info
  const { data: artist } = trpc.artist.getProfile.useQuery(
    { id: artistId },
    { enabled: artistId > 0 }
  );

  const clientCreateMutation = trpc.booking.clientCreate.useMutation();

  // Pre-fill user info
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        clientName: prev.clientName || user.name || '',
        clientEmail: prev.clientEmail || user.email || '',
      }));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <SiteHeader />
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Music className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign In to Book</h2>
          <p className="text-gray-600 mb-6">Create a free account or sign in to book this artist for your event.</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const updateForm = (field: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const today = new Date().toISOString().split('T')[0];

  const canProceedStep1 = form.eventType !== '';
  const canProceedStep2 = form.eventDate !== '' && form.venueName.trim() !== '' && form.venueCity.trim() !== '' && form.venueState.trim() !== '';
  const canProceedStep3 = form.clientName.trim() !== '' && form.clientEmail.trim() !== '';

  const handleSubmit = async () => {
    if (!form.eventType) return;
    setSubmitting(true);
    setError('');

    try {
      const addressParts = [form.venueStreet, form.venueCity, form.venueState, form.venueZip].filter(Boolean);
      const result = await clientCreateMutation.mutateAsync({
        artistId,
        eventDate: form.eventDate,
        eventTime: form.eventTime || undefined,
        eventType: form.eventType as EventType,
        venueName: form.venueName,
        venueAddress: addressParts.join(', ') || undefined,
        eventDetails: form.eventDetails || undefined,
        totalFee: form.totalFee ? parseFloat(form.totalFee) : undefined,
        clientName: form.clientName,
        clientEmail: form.clientEmail,
        clientPhone: form.clientPhone || undefined,
      });
      setSuccess(true);
      setBookingId(result.bookingId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Booking Request Sent!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Your booking request has been sent to <strong>{artist?.artistName || 'the artist'}</strong>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
            Reference #{bookingId} &middot; You'll receive an email when the artist responds.
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Event Type</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize">{form.eventType?.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Date</span>
              <span className="font-medium text-gray-900 dark:text-white">{new Date(form.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Location</span>
              <span className="font-medium text-gray-900 dark:text-white">{form.venueName}, {form.venueCity}, {form.venueState}</span>
            </div>
            {form.totalFee && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Offered Fee</span>
                <span className="font-medium text-gray-900 dark:text-white">${parseFloat(form.totalFee).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/my-bookings')}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition"
            >
              View My Bookings
            </button>
            <button
              onClick={() => navigate(`/artist/${toSlug(artist?.artistName || '')}`)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Back to Artist
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalSteps = 4;
  const progressPercent = (step / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : navigate(`/artist/${toSlug(artist?.artistName || '')}`)}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Book {artist?.artistName || 'Artist'}
              </h1>
              <p className="text-sm text-gray-500">Step {step} of {totalSteps}</p>
            </div>
            {artist?.profilePhotoUrl && (
              <img
                src={artist.profilePhotoUrl}
                alt={artist.artistName}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
          </div>
          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-purple-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Event Type */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">What type of event?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select the type of event you're planning.</p>
            <div className="grid grid-cols-2 gap-3">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateForm('eventType', type.value)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    form.eventType === type.value
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <span className="text-2xl mb-2 block">{type.icon}</span>
                  <span className={`font-medium ${
                    form.eventType === type.value
                      ? 'text-purple-700 dark:text-purple-300'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {type.label}
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Event Details & Location */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Event Details</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">When and where is your event?</p>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" /> Event Date *
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={form.eventDate}
                    onChange={(e) => updateForm('eventDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Event Time
                  </label>
                  <input
                    type="time"
                    value={form.eventTime}
                    onChange={(e) => updateForm('eventTime', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    style={{ WebkitAppearance: 'none' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" /> Venue / Location Name *
                </label>
                <input
                  type="text"
                  value={form.venueName}
                  onChange={(e) => updateForm('venueName', e.target.value)}
                  placeholder="e.g., The Grand Ballroom, My Backyard, First Baptist Church"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Street Address</label>
                <input
                  type="text"
                  value={form.venueStreet}
                  onChange={(e) => updateForm('venueStreet', e.target.value)}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    value={form.venueCity}
                    onChange={(e) => updateForm('venueCity', e.target.value)}
                    placeholder="Atlanta"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State *</label>
                  <select
                    value={form.venueState}
                    onChange={(e) => updateForm('venueState', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">--</option>
                    {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zip</label>
                  <input
                    type="text"
                    value={form.venueZip}
                    onChange={(e) => updateForm('venueZip', e.target.value)}
                    placeholder="30301"
                    maxLength={10}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Your Info & Budget */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Your Information</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">How can the artist reach you?</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <User className="w-4 h-4 inline mr-1" /> Your Name *
                </label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={(e) => updateForm('clientName', e.target.value)}
                  placeholder="John Smith"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Mail className="w-4 h-4 inline mr-1" /> Email *
                  </label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => updateForm('clientEmail', e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Phone className="w-4 h-4 inline mr-1" /> Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={form.clientPhone}
                    onChange={(e) => updateForm('clientPhone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" /> Budget / Offered Fee (optional)
                </label>
                <input
                  type="number"
                  value={form.totalFee}
                  onChange={(e) => updateForm('totalFee', e.target.value)}
                  placeholder="Enter your budget"
                  min="0"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {(artist?.feeRangeMin || artist?.feeRangeMax) && (
                  <p className="text-xs text-gray-500 mt-1">Artist's listed rate: ${artist.feeRangeMin?.toLocaleString() || '?'} - ${artist.feeRangeMax?.toLocaleString() || '?'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Event Details (optional)
                </label>
                <textarea
                  value={form.eventDetails}
                  onChange={(e) => updateForm('eventDetails', e.target.value)}
                  placeholder="Tell the artist about your event — expected guests, set length, vibe, special requests..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!canProceedStep3}
                className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Review <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Submit */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Review Your Booking</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Make sure everything looks good before submitting.</p>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
              {/* Artist */}
              <div className="p-4 flex items-center gap-4">
                {artist?.profilePhotoUrl ? (
                  <img src={artist.profilePhotoUrl} alt={artist.artistName} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                    <Music className="w-6 h-6 text-purple-600" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{artist?.artistName || 'Artist'}</p>
                  <p className="text-sm text-gray-500">{Array.isArray(artist?.genre) ? [...new Set(artist.genre)].join(', ') : (artist?.genre || '')} {artist?.location ? `· ${artist.location}` : ''}</p>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Event</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="text-gray-900 dark:text-white capitalize">{form.eventType?.replace('_', ' ')}</span>
                  <span className="text-gray-500">Date</span>
                  <span className="text-gray-900 dark:text-white">
                    {form.eventDate ? new Date(form.eventDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                  </span>
                  {form.eventTime && (
                    <>
                      <span className="text-gray-500">Time</span>
                      <span className="text-gray-900 dark:text-white">{formatEventTime(form.eventTime)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Location</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Venue</span>
                  <span className="text-gray-900 dark:text-white">{form.venueName}</span>
                  <span className="text-gray-500">Address</span>
                  <span className="text-gray-900 dark:text-white">
                    {[form.venueStreet, form.venueCity, form.venueState, form.venueZip].filter(Boolean).join(', ')}
                  </span>
                </div>
              </div>

              {/* Contact & Budget */}
              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Contact & Budget</h3>
                <div className="grid grid-cols-2 gap-y-2 text-sm">
                  <span className="text-gray-500">Name</span>
                  <span className="text-gray-900 dark:text-white">{form.clientName}</span>
                  <span className="text-gray-500">Email</span>
                  <span className="text-gray-900 dark:text-white">{form.clientEmail}</span>
                  {form.clientPhone && (
                    <>
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-900 dark:text-white">{form.clientPhone}</span>
                    </>
                  )}
                  {form.totalFee && (
                    <>
                      <span className="text-gray-500">Offered Fee</span>
                      <span className="text-gray-900 dark:text-white font-semibold">${parseFloat(form.totalFee).toLocaleString()}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Event Details */}
              {form.eventDetails && (
                <div className="p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Event Details</h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{form.eventDetails}</p>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-400 px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" /> Send Booking Request
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                By submitting this booking request, you acknowledge that OlogyWood facilitates but is not a party to agreements between you and the talent.{' '}
                <a href="/disclaimer" className="text-purple-600 hover:underline">View Disclaimer</a>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
