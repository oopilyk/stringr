# RallyStrings Demo Script (3 minutes)

## Demo Flow: Complete User Journey

### Setup (30 seconds)
1. **Open browser to localhost:3000**
2. **Show landing page** - "RallyStrings - Tennis Racquet Stringing Marketplace"
3. **Click demo sign in** - Show test accounts available

---

### Act 1: Player Experience (1 minute)

**Scene: Alex (Player) needs racquet stringing**

1. **Sign in as alex@example.com** (password: password123)
   - Shows player role badge in navigation
   - Redirects to Discover page

2. **Discover Stringers**
   - Map view with 3 local stringers visible
   - Show filters: radius (25km), price range, rush available
   - Point out key info on cards:
     - Marco: $25, 24h turnaround, 5⭐ rating
     - Sarah: $30, 12h turnaround, accepts rush
     - David: $20, 48h turnaround, budget option

3. **Create Request**
   - Click "Request Stringing" on Marco's card
   - Fill out form:
     - Racquet: "Babolat Pure Aero"
     - String: "RPM Blast 17"
     - Tension: "55 lbs" 
     - Drop-off: "Meet up at Stanford Tennis Courts"
     - Notes: "Need it for tournament this weekend"
   - Show price calculation: $25 base
   - Submit request

4. **View Dashboard**
   - Navigate to Dashboard
   - Show active request with "Requested" status
   - Display quick stats: 1 active request

---

### Act 2: Stringer Experience (1 minute)

**Scene: Marco (Stringer) receives and processes request**

1. **Switch User** - Sign out and sign in as marco@example.com
   - Shows stringer role badge
   - Redirects to Dashboard

2. **Stringer Dashboard**
   - Show incoming request from Alex
   - Display job details: Babolat Pure Aero, RPM Blast 17, 55 lbs
   - Show pricing: $25 quoted
   - Click "Accept Job" → Status changes to "Accepted"

3. **Update Job Progress**
   - Click "Start Work" → Status: "In Progress"
   - Simulate work completion
   - Click "Mark Ready" → Status: "Ready"
   - Show timeline progression

4. **Job Completion**
   - Click "Complete" → Status: "Completed"
   - Show earnings summary on dashboard

---

### Act 3: Reviews & Complete Loop (30 seconds)

**Scene: Close the loop with player feedback**

1. **Back to Player View** - Sign in as alex@example.com
2. **Dashboard Updates**
   - Show completed request
   - Prompt for review appears
3. **Leave Review**
   - 5-star rating
   - Comment: "Great work! Quick turnaround and perfect tension. Highly recommend!"
4. **Show Impact**
   - Marco's profile now shows updated rating
   - Review visible to future customers

---

## Key Features Demonstrated

✅ **Core Marketplace Functions**
- Stringer discovery with location-based search
- Request creation with detailed specifications  
- Two-sided dashboard (player vs stringer views)
- Status workflow management

✅ **User Experience**
- Role-based authentication and permissions
- Responsive design (mobile-friendly)
- Real-time status updates
- Clear pricing and turnaround information

✅ **Business Logic**
- Request workflow validation
- Price calculation (base + rush fees)
- Rating aggregation and display
- Geographic distance calculations

✅ **Technical Implementation**
- Modern React/Next.js frontend
- Supabase backend with RLS security
- TypeScript for type safety
- Shared components across platform

---

## Demo Talking Points

### "Why RallyStrings?"
> *"Tennis players often struggle to find reliable, nearby stringers. Traditional pro shops have limited hours and high prices. RallyStrings creates a marketplace connecting players with local home stringers who can offer competitive prices and faster turnaround."*

### "The Technology"
> *"Built with modern web technologies - Next.js frontend, Supabase backend, and designed for both web and mobile. The monorepo structure allows us to share components and business logic across platforms."*

### "Marketplace Benefits"
> *"Players get more options and better prices. Stringers get a steady stream of customers and tools to manage their business. The review system builds trust for both sides."*

### "MVP vs Future"
> *"This MVP shows core functionality. Future versions will add payments, in-app messaging, route optimization, and more sophisticated matching algorithms."*

---

## Backup Demo Data

If live demo has issues, show these prepared scenarios:

**Sample Requests:**
- Babolat Pure Aero → RPM Blast 17 → 55 lbs → $25
- Wilson Blade 98 → ALU Power 16L → 58 lbs → $30 (rush)
- Head Speed MP → Natural Gut 16 → 52 lbs → $20

**Stringer Profiles:**
- Marco: Experienced, moderate price, reliable
- Sarah: Premium service, quick turnaround, weekend availability  
- David: Budget option, good for recreational players

**Status Examples:**
- Show requests in different stages of workflow
- Demonstrate status transitions and user permissions
