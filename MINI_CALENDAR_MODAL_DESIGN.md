# Mini Calendar Modal Design Proposal

## 🎯 Goal
Show the MiniCalendar component in a modal/popover when clicking on the **Week Number** box in the calendar controls.

---

## 📍 Current State Analysis

### Week Number Box (Lines 308-325 in CalendarLayout.tsx)
```tsx
<div style={{ 
  display: 'flex', 
  flexDirection: 'column', 
  alignItems: 'center',
  padding: '0.5rem 1rem',
  backgroundColor: 'var(--accent-bg)',  // Gold/accent color
  color: 'var(--primary-bg)',           // Black text
  borderRadius: '4px',
  minWidth: '80px'
}}>
  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
    Week {getCurrentWeekInfo().weekNumber}
  </div>
  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.8 }}>
    {getCurrentWeekInfo().month} {getCurrentWeekInfo().day}
  </div>
</div>
```

### MiniCalendar Component
**Current Props:**
- `selectedDate?: Date` - Currently selected date
- `onDateSelect?: (date: Date) => void` - Callback when date is clicked
- `className?: string` - Custom styling

**Current Issues:**
- ❌ Uses `getMockEvents()` directly (Line 52)
- ❌ Should receive real events as props

---

## 💡 Design Options

### **Option A: Popover/Dropdown (Recommended)**
**Appearance:**
```
┌─────────────────────────────────┐
│  ← [Week 38] →                  │  ← Click here
│     Oct 2025                    │
└─────────────────────────────────┘
        ↓
┌───────────────────────────────┐
│  ← October 2025 →             │
│ Su Mo Tu We Th Fr Sa          │
│ 29 30  1  2  3  4  5         │ ← Event dots
│  6  7 ●8 ●9 10 11 12         │   on days
│ 13 14 15 16 17 18 19         │
│ 20 21 22 23 24 25 26         │
│ 27 28 29 30 31  1  2         │
└───────────────────────────────┘
```

**Pros:**
- ✅ Contextual - appears near trigger
- ✅ No full-screen takeover
- ✅ Easy to dismiss (click outside)
- ✅ Minimal UI disruption

**Cons:**
- ⚠️ May overlap with calendar content
- ⚠️ Requires positioning logic

---

### **Option B: Modal/Dialog**
**Appearance:**
```
┌─────────────────────────────────────┐
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Calendar Navigation     [X] │   │ ← Centered modal
│  │                             │   │
│  │  ← October 2025 →          │   │
│  │ Su Mo Tu We Th Fr Sa        │   │
│  │ 29 30  1 ●2 ●3  4  5       │   │
│  │  6  7 ●8 ●9 10 11 12       │   │
│  │ 13 14 15 16 17 18 19       │   │
│  │ 20 21 22 23 24 25 26       │   │
│  │ 27 28 29 30 31  1  2       │   │
│  │                             │   │
│  │      [Go to Selected Week]  │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Pros:**
- ✅ Clear focus
- ✅ No overlap issues
- ✅ Can add title/actions

**Cons:**
- ⚠️ More disruptive
- ⚠️ Requires backdrop/overlay

---

### **Option C: Slide-out Panel (Similar to EventDetailsPanel)**
**Appearance:**
```
┌───────────────────────────────────────────┐
│  Main Calendar Content                    │ ┌──────────────┐
│                                           │ │ Navigation   │
│  [Companies] [Events Grid]                │ │              │
│                                           │ │ ← Oct 2025 → │
│                                           │ │ Su Mo Tu ... │
│                                           │ │ 29 30  1  2  │
│                                           │ │  ●  ●        │
│                                           │ │              │
│                                           │ │ [Select Week]│
│                                           │ └──────────────┘
└───────────────────────────────────────────┘
```

**Pros:**
- ✅ Consistent with EventDetailsPanel UX
- ✅ No overlap
- ✅ Side-by-side view possible

**Cons:**
- ⚠️ Takes up more space
- ⚠️ Slides calendar content

---

## 🎨 Recommended Solution: **Option A (Popover)**

### Why Popover?
1. **Lightweight interaction** - Quick date selection
2. **Contextual** - Appears right where you click
3. **Non-disruptive** - Doesn't take over the screen
4. **Mobile-friendly** - Works well on touch devices

---

## 🛠️ Implementation Plan

### Step 1: Add State for Modal Visibility
```typescript
// In CalendarLayout.tsx
const [showMiniCalendar, setShowMiniCalendar] = useState(false);
const miniCalendarRef = useRef<HTMLDivElement>(null);
```

### Step 2: Fix MiniCalendar to Accept Real Events
```typescript
// Update MiniCalendar interface
interface MiniCalendarProps {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
  events: CalendarEvent[];  // NEW: Pass real events
  className?: string;
}

// Update MiniCalendar component
const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
  selectedDate = new Date(), 
  onDateSelect,
  events,  // Use this instead of getMockEvents()
  className = '' 
}) => {
  // Replace getMockEvents() with events prop
  useEffect(() => {
    const counts: EventCountByDate = {};
    
    events.forEach((event) => {
      const dateKey = format(new Date(event.start_date), 'yyyy-MM-dd');
      // ... count logic
    });
    
    setEventCounts(counts);
  }, [events]);  // Re-calculate when events change
};
```

### Step 3: Make Week Box Clickable
```typescript
// In CalendarLayout.tsx
<div 
  onClick={() => setShowMiniCalendar(!showMiniCalendar)}
  style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: 'var(--accent-bg)',
    color: 'var(--primary-bg)',
    borderRadius: '4px',
    minWidth: '80px',
    cursor: 'pointer',  // NEW: Show it's clickable
    transition: 'all 0.2s ease',
    transform: showMiniCalendar ? 'scale(0.98)' : 'scale(1)'  // Click feedback
  }}
  onMouseEnter={(e) => {
    (e.target as HTMLDivElement).style.transform = 'scale(1.05)';
  }}
  onMouseLeave={(e) => {
    (e.target as HTMLDivElement).style.transform = 'scale(1)';
  }}
>
  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
    Week {getCurrentWeekInfo().weekNumber}
  </div>
  <div style={{ fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.8 }}>
    {getCurrentWeekInfo().month} {getCurrentWeekInfo().day}
  </div>
</div>
```

### Step 4: Add Popover Positioning
```typescript
// Calculate popover position
const getPopoverPosition = () => {
  if (!miniCalendarRef.current) return { top: 0, left: 0 };
  
  const rect = miniCalendarRef.current.getBoundingClientRect();
  
  return {
    top: rect.bottom + 8,  // 8px below the week box
    left: rect.left - 100,  // Center it roughly
  };
};
```

### Step 5: Render MiniCalendar Popover
```typescript
{/* Mini Calendar Popover */}
{showMiniCalendar && (
  <>
    {/* Backdrop - click to close */}
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'transparent',
        zIndex: 999
      }}
      onClick={() => setShowMiniCalendar(false)}
    />
    
    {/* Popover */}
    <div
      style={{
        position: 'fixed',
        top: `${getPopoverPosition().top}px`,
        left: `${getPopoverPosition().left}px`,
        zIndex: 1000,
        backgroundColor: 'var(--secondary-bg)',
        border: '2px solid var(--accent-bg)',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        padding: '1rem',
        animation: 'slideDown 0.2s ease-out'
      }}
    >
      <MiniCalendar
        selectedDate={currentWeek}
        events={events}  // Pass real events
        onDateSelect={(date) => {
          setCurrentWeek(startOfWeek(date, { weekStartsOn: 1 }));
          setShowMiniCalendar(false);  // Close after selection
        }}
      />
    </div>
  </>
)}
```

### Step 6: Add Animation CSS
```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

## 🎯 User Experience Flow

1. **User sees Week box** with current week number
   - Hover shows scale-up effect
   - Clear visual feedback it's clickable

2. **User clicks Week box**
   - MiniCalendar popover appears below
   - Shows current month with event dots
   - Backdrop prevents interaction with calendar

3. **User interacts with MiniCalendar**
   - Can navigate months (← →)
   - See event dots on days (colored by RSVP status)
   - Click a date to navigate to that week

4. **User selects a date**
   - Calendar jumps to that week
   - Popover closes automatically
   - Smooth transition

5. **User clicks outside** (or on backdrop)
   - Popover closes
   - Returns to normal calendar view

---

## 🎨 Visual Design Details

### Week Box States
```typescript
// Normal state
backgroundColor: 'var(--accent-bg)',  // Gold
color: 'var(--primary-bg)',           // Black

// Hover state
transform: 'scale(1.05)',
boxShadow: '0 2px 8px rgba(184, 134, 11, 0.4)',

// Active/Open state
transform: 'scale(0.98)',
boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
```

### Popover Styling
```typescript
{
  backgroundColor: 'var(--secondary-bg)',  // Dark background
  border: '2px solid var(--accent-bg)',    // Gold border
  borderRadius: '8px',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
  padding: '1rem',
  minWidth: '300px'
}
```

### Event Dots (in MiniCalendar)
```typescript
// Accepted events
backgroundColor: '#10b981',  // Green

// Declined events
backgroundColor: '#ef4444',  // Red

// Pending events
backgroundColor: '#f59e0b',  // Yellow/Orange
```

---

## 📱 Mobile Considerations

### Touch Interactions
- **Tap Week box** → Show MiniCalendar
- **Tap backdrop** → Close popover
- **Swipe left/right** → Navigate months (in MiniCalendar)

### Responsive Positioning
```typescript
const getPopoverPosition = () => {
  const isMobile = window.innerWidth < 768;
  
  if (isMobile) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'  // Center on mobile
    };
  }
  
  // Desktop positioning
  return {
    top: rect.bottom + 8,
    left: rect.left - 100
  };
};
```

---

## ✅ Benefits of This Approach

1. **Fixes MiniCalendar Mock Data Issue**
   - ✅ Passes real events as props
   - ✅ No more `getMockEvents()` calls
   - ✅ Production-ready

2. **Enhanced UX**
   - ✅ Quick date navigation
   - ✅ Visual event overview
   - ✅ Intuitive interaction

3. **Maintains Consistency**
   - ✅ Uses existing MiniCalendar component
   - ✅ Matches calendar visual style
   - ✅ Same RSVP color scheme

4. **Performance**
   - ✅ Lazy renders (only when open)
   - ✅ Reuses filtered events
   - ✅ Minimal re-renders

---

## 🤔 Discussion Points

### 1. **Positioning Preference**
   - **Question:** Should popover appear below week box (desktop) or center screen (mobile)?
   - **My Recommendation:** Below on desktop, centered on mobile

### 2. **Close Behavior**
   - **Option A:** Auto-close after date selection ✅ (Recommended)
   - **Option B:** Keep open until manual close
   - **My Recommendation:** Option A for quick navigation

### 3. **Event Dot Size**
   - **Question:** How should we handle days with many events?
   - **Options:**
     - Small dot (1-3 events)
     - Medium dot (4-6 events)
     - Large dot (7+ events)
   - **OR:** Show count number instead of dots

### 4. **Animation Preference**
   - **Slide down** (current proposal)
   - **Fade in**
   - **Scale up**
   - **No animation** (instant)

### 5. **Click to Navigate**
   - **Question:** When user clicks a date in MiniCalendar, should we:
     - **A:** Jump to the week containing that date ✅ (Recommended)
     - **B:** Just highlight the date
     - **C:** Show events for that specific day

---

## 🚀 Next Steps

**If you approve this design:**
1. I'll update MiniCalendar to accept events prop (fixes mock data issue)
2. Add state management for popover visibility
3. Implement click handler on Week box
4. Add popover rendering with positioning
5. Style and animate the transition
6. Test on desktop and mobile

**Let me know:**
- Which positioning option you prefer (A/B/C)
- Any specific animation preference
- How you want event dots to display
- Any other customizations you'd like!

