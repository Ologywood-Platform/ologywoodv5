import { MapPin } from 'lucide-react';
import { US_STATES } from '../../../shared/locationData';

interface LocationInputProps {
  city: string;
  state: string;
  country: string;
  onChange: (fields: { city: string; state: string; country: string }) => void;
}

export function LocationInput({ city, state, country, onChange }: LocationInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Location</span>
      </div>
      <p className="text-xs text-muted-foreground">Help bookers find you by entering your venue's city and state.</p>
      
      <div className="grid grid-cols-2 gap-3">
        {/* City */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">City</label>
          <input
            type="text"
            value={city}
            onChange={(e) => onChange({ city: e.target.value, state, country })}
            placeholder="e.g. Atlanta"
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-input focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">State</label>
          <select
            value={state}
            onChange={(e) => onChange({ city, state: e.target.value, country })}
            className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-input focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Select state</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Country - defaulted to US, shown as read-only for now */}
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
        <select
          value={country || 'US'}
          onChange={(e) => onChange({ city, state, country: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-lg bg-background text-foreground border-input focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
          <option value="AU">Australia</option>
        </select>
      </div>
    </div>
  );
}
