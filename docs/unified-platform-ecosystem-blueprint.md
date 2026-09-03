# OlogyWood Unified Platform Wireframe and Ecosystem Blueprint

**Prepared for:** OlogyWood  
**Purpose:** Make the platform feel like one connected creator-commerce ecosystem rather than a collection of separate tools.

## Executive assessment

OlogyWood already has the right **business ecosystem**: discovery, public profiles, bookings, contracts, riders, events, ticketing, Creator Shop, Books and eBooks, releases, Ology Live, Fan Clubs, Sandbox Posts, messaging, payments, payouts, analytics, sponsors, and administration. The fragmentation risk is primarily in the **presentation layer**. The current application exposes roughly 101 routes, the creator dashboard presents 16 quick-action destinations, and the venue dashboard places 10 sections into a six-column tab bar.[1] [3] [4]

> **The platform should not be organized around features. It should be organized around the user’s next decision.**

The recommended model is one global shell, one role-aware workspace, one profile storefront, and one transaction lifecycle. Existing feature services can remain separate behind the scenes. The user should experience them as a single system.

## What the platform looks like today

The current global header presents **Browse, Events, Ology Live, Blog, Sponsors, and Following**. Authenticated account actions then appear in a separate dropdown with Dashboard, My Bookings, My Purchases, My Music Player, Disputes, and Settings.[2] Different roles are sent to different home bases: fans return to the public homepage, venues enter a venue dashboard, administrators enter an admin dashboard, bloggers enter a blogger dashboard, and creators enter the artist dashboard.[6]

| Layer | Current structure | Fragmentation risk |
|---|---|---|
| Public discovery | Browse, Venues, Events, Ology Live, Blog, Sponsors | The user must understand several product names before understanding the journey. |
| Creator workspace | Dashboard plus 16 quick actions | Every capability looks equally important, so urgent work and occasional setup compete for attention. |
| Venue workspace | 10 tabs plus external pages | A six-column tab container holds more tabs than its declared grid, increasing cognitive and responsive pressure. |
| Fan account | Homepage plus My Purchases, My Tickets, My Bookings, Following, Music | There is no single fan home that answers “What did I buy, book, follow, or unlock?” |
| Public profile | Identity, portfolio, bookings, events, shop, releases, membership, sponsors | This is the correct ecosystem hub, but sections need a consistent order and primary action hierarchy. |
| Commerce | Bookings, tickets, merch/books, releases, memberships, and live sessions | Each flow is valid, but separate names and dashboards can hide the shared discover-to-pay-to-deliver lifecycle. |

The homepage correctly describes OlogyWood as the monetization layer and already promises “one platform, everything.” However, it introduces the ecosystem through many feature cards and separate spotlights, which can make the product appear broader than its navigation model explains.[5]

## The recommended platform wireframe

### 1. One global shell

Every page should share the same top-level structure:

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ OW  Discover  Experiences  Shop  Community      Search  + Create  Inbox  ● │
└────────────────────────────────────────────────────────────────────────────┘
```

| Global destination | Contains | Why it belongs together |
|---|---|---|
| **Discover** | Talent, venues, events, live sessions, releases | One search-and-discovery starting point. |
| **Experiences** | Bookings, ticketed events, Ology Live | Everything a fan or promoter can attend or book. |
| **Shop** | Merch, physical books, eBooks, paid releases, memberships | Everything that can be purchased without a booking request. |
| **Community** | Following, Sandbox Posts, creator updates, Fan Clubs | Every ongoing audience relationship. |
| **My Ology** | Activity, tickets, purchases, bookings, saved items | One customer-owned library and transaction home. |
| **Workspace** | Role-aware creator, venue, blogger, or admin management | One operational home rather than many unrelated dashboards. |

The current Blog, Sponsors, Pricing, Help, and company pages should remain available under **Learn/More** and the footer rather than competing with daily marketplace actions in the primary header.

### 2. One role-aware workspace shell

The workspace should use the same layout for all roles while changing only the relevant content.

```text
┌──────────────┬─────────────────────────────────────────────────────────────┐
│ OVERVIEW     │ Good morning, Adonis                         + Create      │
│ PROFILE      │─────────────────────────────────────────────────────────────│
│ SELL         │ Needs attention                                             │
│ DELIVER      │ 2 booking replies · 1 order to ship · 1 event this week    │
│ GROW         │─────────────────────────────────────────────────────────────│
│ MONEY        │ Recent activity        Business snapshot        Next step  │
│              │ Booking confirmed      $___ available           Share post │
└──────────────┴─────────────────────────────────────────────────────────────┘
```

| Workspace | Recommended sections |
|---|---|
| **Creator** | Overview, Profile, Sell, Deliver, Grow, Money |
| **Venue/Promoter** | Overview, Discover, Bookings, Events, Money, Profile |
| **Fan/Buyer** | Activity, Library, Tickets, Bookings, Following |
| **Admin** | People, Commerce, Content, Trust & Safety, System |
| **Blogger** | Posts, Media, Performance, Settings |

The overview must emphasize **needs attention**, not a grid of every possible feature. A creator should first see unanswered requests, orders awaiting fulfillment, upcoming sessions, missing profile information, and payout issues. Less frequent tools stay inside their parent section.

### 3. One public profile storefront

The public profile should be the central conversion page for every talent type.

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ Photo  Name ✓  Type · Location · Availability           Book / Follow     │
│ Bio                                                                        │
│ Current Sandbox Post                                          Share        │
├────────────────────────────────────────────────────────────────────────────┤
│ Book Me │ Experiences │ Shop │ Releases │ Fan Club │ Portfolio │ About    │
├────────────────────────────────────────────────────────────────────────────┤
│ Contextual section content                                                 │
└────────────────────────────────────────────────────────────────────────────┘
```

The order should remain consistent across musicians, athletes, filmmakers, visual artists, authors, entertainers, creators, and influencers. Irrelevant modules should disappear rather than show empty or role-inappropriate language. For example, My Music should not appear for an author, and NIL should not appear for a non-athlete.

### 4. One creation entry point

Instead of asking creators to remember which dashboard owns a feature, a global **+ Create** menu should offer only actions relevant to their role and plan.

| Creator action | Destination |
|---|---|
| Share what is happening now | Sandbox Post |
| Offer something people can book | Booking offer or Ology Live session |
| Sell admission | Event and tickets |
| Sell a product | Creator Shop item, physical book, or eBook |
| Monetize hosted content | Content Release |
| Build recurring support | Fan Club tier |

This menu does not replace dedicated management pages. It provides one predictable starting point.

## The ecosystem operating model

Every monetization feature should visibly follow the same six-step journey:

| Stage | User question | Platform responsibility |
|---|---|---|
| **Discover** | What can I find? | Search, recommendations, profile previews, availability. |
| **Evaluate** | Is this right for me? | Profile identity, media, Sandbox Post, terms, price, trust signals. |
| **Commit** | How do I book or buy? | Request, checkout, contract, ticket, membership, or unlock. |
| **Prepare** | What happens next? | Messages, reminders, riders, shipping, event details, access rules. |
| **Deliver** | How do I receive it? | Performance, check-in, shipment, signed download, external hosted content. |
| **Continue** | How do we stay connected? | Follow, Fan Club, updates, recommendations, repeat purchase, analytics. |

The platform should use a shared status vocabulary wherever possible:

```text
Draft → Live → Pending → Confirmed/Paid → In progress → Fulfilled/Completed
                                      ↘ Cancelled / Refunded / Disputed
```

This does not require combining every database table. It requires a presentation layer that translates feature-specific states into a common language and a unified activity stream.

## What currently creates the fragmented feeling

| Priority | Problem | Recommended correction |
|---|---|---|
| **Critical** | Too many equal-weight creator quick actions | Replace the 16-button grid with Needs Attention, four business pillars, and a role-aware Create menu. |
| **Critical** | Fans do not have a true account home | Build My Ology with purchases, tickets, bookings, follows, unlocked releases, and live sessions. |
| **High** | Similar concepts have separate destinations | Canonicalize Bookings/My Bookings, Releases/Content Releases, Venue/Venues, Rider Builder/Templates/Saved Riders, and Earnings variants. Preserve old URLs as redirects. |
| **High** | Public navigation uses product names instead of journeys | Group Ology Live under Experiences and Sponsors/Blog under Learn/More while preserving direct URLs. |
| **High** | Profiles can become long stacks of disconnected modules | Add a sticky section navigator and consistent Book, Buy, Follow, and Share action hierarchy. |
| **High** | Notifications report events but do not organize work | Create a unified action center linking each alert directly to the next required step. |
| **Medium** | Role-inappropriate labels still surface | Apply the shared talent taxonomy to all navigation, helper copy, empty states, and account-menu items. |
| **Medium** | Metrics are scattered by feature | Present one revenue overview with filters for bookings, tickets, shop, releases, memberships, and live sessions. |

## Recommended implementation sequence

| Sequence | Work | Outcome |
|---|---|---|
| **1. Navigation contract** | Define canonical names, destinations, breadcrumbs, redirects, and role visibility. | Users stop wondering whether similar labels lead to different systems. |
| **2. Unified workspace shell** | Add the shared sidebar/top bar, Needs Attention, recent activity, and Create menu. | Every role learns one operating pattern. |
| **3. My Ology** | Combine fan tickets, purchases, bookings, follows, music, releases, and sessions. | Buyers gain a reason to return after checkout. |
| **4. Profile storefront** | Standardize section order, primary actions, module visibility, and section navigation. | Every public profile becomes a coherent conversion page. |
| **5. Transaction timeline** | Introduce shared display statuses and cross-feature activity cards. | Booking and buying feel like variations of one trusted lifecycle. |
| **6. Unified money and audience views** | Aggregate revenue, fulfillment, followers, members, and campaign outcomes. | Creators manage a business rather than separate products. |

## What not to do

OlogyWood should **not** merge every service into one oversized backend table, remove useful specialist workflows, or redesign every page at once. It should first unify navigation, language, activity, and status. The underlying booking, ticket, merch, Books, release, Fan Club, and Ology Live services can remain independently testable.

## Final recommendation

The highest-impact next build is a **Unified Workspace Shell with Needs Attention and + Create**, followed by **My Ology** for fans. These two changes would connect the platform without dismantling working features.

> **OlogyWood’s ecosystem should feel like one loop: discover a creator, build trust on the profile, book or buy, receive the experience, stay connected, and return.**

## References

[1]: ../client/src/App.tsx "Current application route map and global shell"
[2]: ../client/src/components/SiteHeader.tsx "Current desktop, mobile, account, and role navigation"
[3]: ../client/src/pages/ArtistDashboardV3.tsx "Current creator dashboard hierarchy and quick actions"
[4]: ../client/src/pages/VenueDashboard.tsx "Current venue workspace tabs and overview actions"
[5]: ../client/src/pages/Home.tsx "Current platform positioning and feature-story sequence"
[6]: ../client/src/utils/dashboardUrl.ts "Current role-to-dashboard routing"
