import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { Building2, CalendarDays, Loader2, MapPin, Search, Sparkles, UserRound } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { ClearableInput } from '@/components/ui/clearable-input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type SearchResult = {
  id: number;
  type: 'artist' | 'venue' | 'event';
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string;
};

const GROUP_LABELS = {
  artist: 'Talent',
  venue: 'Venues',
  event: 'Events',
} as const;

const RESULT_ICONS = {
  artist: UserRound,
  venue: Building2,
  event: CalendarDays,
} as const;

export function GlobalSearch({ mobile = false }: { mobile?: boolean }) {
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (mobile) return;
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [mobile]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(timer);
  }, [open]);

  const { data, isFetching, isError } = trpc.discoverySearch.suggest.useQuery(
    { query: debouncedQuery, limitPerType: 4 },
    {
      enabled: open && debouncedQuery.length > 0,
      staleTime: 30_000,
      retry: false,
    },
  );

  const groups = useMemo(() => [
    { type: 'artist' as const, results: (data?.artists || []) as SearchResult[] },
    { type: 'venue' as const, results: (data?.venues || []) as SearchResult[] },
    { type: 'event' as const, results: (data?.events || []) as SearchResult[] },
  ].filter((group) => group.results.length > 0), [data]);

  const flatResults = useMemo(() => groups.flatMap((group) => group.results), [groups]);
  const waitingForDebounce = query.trim() !== debouncedQuery;
  const showLoading = query.trim().length > 0 && (waitingForDebounce || isFetching);

  useEffect(() => {
    setHighlightedIndex(flatResults.length > 0 ? 0 : -1);
  }, [debouncedQuery, flatResults.length]);

  const selectResult = (result: SearchResult) => {
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    navigate(result.href);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatResults.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % flatResults.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((current) => (current - 1 + flatResults.length) % flatResults.length);
    } else if (event.key === 'Enter' && highlightedIndex >= 0) {
      event.preventDefault();
      selectResult(flatResults[highlightedIndex]);
    }
  };

  let resultIndex = -1;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (!nextOpen) setHighlightedIndex(-1);
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={mobile ? 'icon' : 'sm'}
          className={mobile ? 'h-10 w-10 dark:text-gray-300 dark:hover:text-white' : 'h-9 gap-2 px-2.5 text-sm dark:text-gray-300 dark:hover:text-white'}
          aria-label="Search artists, venues, and events"
          title="Search OlogyWood (Ctrl+K)"
        >
          <Search className="h-4 w-4" />
          {!mobile && <span className="hidden xl:inline">Search</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-2xl" aria-describedby="global-search-help">
        <DialogHeader className="border-b px-5 pb-4 pt-5 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Find it on OlogyWood
          </DialogTitle>
          <DialogDescription id="global-search-help">
            Search public talent, venues, and events. Suggestions appear as you type.
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 sm:p-5">
          <ClearableInput
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onClear={() => {
              setQuery('');
              setDebouncedQuery('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="Try an artist, venue, event, or location"
            leftIcon={<Search className="h-5 w-5" />}
            wrapperClassName="w-full"
            className="h-12 text-base"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={query.trim().length > 0}
            aria-controls="global-search-results"
          />

          <div id="global-search-results" role="listbox" className="mt-3 max-h-[55vh] overflow-y-auto">
            {!query.trim() && (
              <div className="rounded-xl bg-purple-50 px-4 py-5 text-center dark:bg-purple-950/30">
                <Search className="mx-auto h-7 w-7 text-purple-500" />
                <p className="mt-2 text-sm font-medium">Search the whole public marketplace</p>
                <p className="mt-1 text-xs text-muted-foreground">Use a name, title, city, state, or location.</p>
              </div>
            )}

            {showLoading && (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground" role="status">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            )}

            {!showLoading && isError && (
              <div className="py-8 text-center" role="alert">
                <p className="font-medium">Search is temporarily unavailable</p>
                <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
              </div>
            )}

            {!showLoading && !isError && debouncedQuery && groups.length === 0 && (
              <div className="py-8 text-center">
                <p className="font-medium">No matches for “{debouncedQuery}”</p>
                <p className="mt-1 text-sm text-muted-foreground">Try the full name, event title, city, or state.</p>
              </div>
            )}

            {!showLoading && groups.map((group) => (
              <section key={group.type} className="py-2" aria-label={GROUP_LABELS[group.type]}>
                <h3 className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {GROUP_LABELS[group.type]}
                </h3>
                <div className="space-y-1">
                  {group.results.map((result) => {
                    resultIndex += 1;
                    const index = resultIndex;
                    const Icon = RESULT_ICONS[result.type];
                    const DetailIcon = result.type === 'event' ? CalendarDays : result.type === 'venue' ? MapPin : null;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        type="button"
                        role="option"
                        aria-selected={highlightedIndex === index}
                        className={`flex min-h-[64px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${highlightedIndex === index ? 'bg-purple-50 dark:bg-purple-950/40' : 'hover:bg-muted'}`}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => selectResult(result)}
                      >
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-muted">
                          {result.imageUrl ? (
                            <img src={result.imageUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                              <Icon className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{result.title}</p>
                          {result.subtitle && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-xs capitalize text-muted-foreground">
                              {DetailIcon && <DetailIcon className="h-3 w-3 shrink-0" />}
                              {result.subtitle}
                            </p>
                          )}
                        </div>
                        <span className="rounded-full border px-2 py-1 text-[11px] font-medium text-muted-foreground">
                          {group.type === 'artist' ? 'Talent' : group.type === 'venue' ? 'Venue' : 'Event'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlobalSearch;
