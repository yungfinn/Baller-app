# Event Creation Workflow - Complete Code Sequence

## 1. User Fills Out Create Event Form (`/create`)

**File: `client/src/pages/create-event.tsx`**

### Form Fields Required:
- `title`: Event name (e.g. "Basketball Pickup Game")
- `description`: Event details 
- `sportType`: Sport selection (basketball, soccer, tennis, etc.)
- `skillLevel`: beginner, intermediate, advanced
- `maxPlayers`: Number of participants
- `locationName`: Venue name
- `latitude` & `longitude`: GPS coordinates
- `eventDate`: Date picker
- `eventTime`: Time picker
- `notes`: Additional information

### Form Submission Process:
```typescript
const onSubmit = (data: InsertEvent) => {
  console.log("=== FORM SUBMISSION START ===");
  
  // Convert date and time to proper timestamp
  const eventDateTime = new Date(`${data.eventDate}T${data.eventTime}`);
  
  createEventMutation.mutate({
    ...data,
    eventDate: eventDateTime,
  });
};
```

## 2. API Call to Backend (`POST /api/events`)

**File: `server/routes.ts`**

### Event Creation Endpoint:
```typescript
app.post('/api/events', async (req: any, res) => {
  try {
    const userId = "43019661"; // User ID
    
    // Check if user is verified
    const user = await storage.getUser(userId);
    if (!user || user.verificationStatus !== 'approved') {
      return res.status(403).json({ 
        message: "Identity verification required before creating events." 
      });
    }
    
    // Validate and parse event data
    const eventData = insertEventSchema.parse({
      ...req.body,
      hostId: userId,
    });
    
    // Create event in database
    const event = await storage.createEvent(eventData);
    
    // Award rep points for hosting
    await storage.addRepPoints(
      userId,
      'event_hosted',
      10,
      event.id,
      `Hosted event: ${event.title}`
    );
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: "Failed to create event" });
  }
});
```

## 3. Database Storage (`storage.createEvent`)

**File: `server/storage.ts`**

```typescript
async createEvent(event: InsertEvent): Promise<Event> {
  const [newEvent] = await db
    .insert(events)
    .values({
      ...event,
      currentPlayers: 1, // Host counts as first player
      isApproved: true,
      isCanceled: false,
    })
    .returning();
  return newEvent;
}
```

## 4. Success Response & Redirect

**File: `client/src/pages/create-event.tsx`**

```typescript
const createEventMutation = useMutation({
  mutationFn: async (data: InsertEvent) => {
    const response = await apiRequest("/api/events", "POST", data);
    return response;
  },
  onSuccess: (data) => {
    console.log("=== MUTATION SUCCESS ===");
    
    // Invalidate events cache to refresh discovery page
    queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    
    // Show success message
    toast({
      title: "Event Created",
      description: "Your event has been created successfully.",
    });
    
    // Redirect to event confirmation page
    setLocation("/event-created");
  }
});
```

## 5. Event Appears in Discovery Feed (`/discover`)

**File: `client/src/pages/discover-events.tsx`**

### Events are fetched via:
```typescript
const { data: events = [], isLoading } = useQuery({
  queryKey: ["/api/events"],
  retry: false,
});
```

### Backend endpoint (`GET /api/events`):
```typescript
app.get('/api/events', async (req, res) => {
  try {
    const events = await storage.getEvents({
      // Filter options for discovery
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch events" });
  }
});
```

## 6. Other Users Can Join Events

### RSVP System:
- Users swipe right or click "Join" on events
- Creates entry in `event_rsvps` table
- Updates `currentPlayers` count
- Host receives notifications via WebSocket

### Event Display Components:
- `EventCard`: Shows event details in grid view
- `SwipeView`: Tinder-style swiping interface
- Real-time chat via WebSocket for joined events

## Current Issue Diagnosis:

The form submission is failing because:
1. Authentication middleware is blocking the `/api/events` endpoint
2. Form validation may be preventing submission
3. WebSocket connection issues affecting real-time updates

## Resolution Steps:
1. Fix authentication bypass for development testing
2. Simplify form validation logic
3. Test complete workflow from form → database → discovery
4. Verify redirect behavior after successful creation