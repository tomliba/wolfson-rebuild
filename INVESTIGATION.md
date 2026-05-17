# Bug Investigation Report

## Codebase Overview

### Data Flow
- **src/lib/api.js**: Supabase CRUD shim. `makeEntity(tableName)` creates `list`, `filter`, `create`, `update`, `delete` methods. Exports: `Surgery`, `OneTimeTask`, `TaskCompletion`, `VideoReview`, `WetLabSession`, `User`. Also exports `auth.me()` for current user profile.
- **src/components/shared/SurgerySteps.jsx**: Constants for surgery steps (`SURGERY_STEPS`, `PHACO_LASER_STEPS`, `COMPLEX_TYPES`, `COMPLICATIONS_LIST`). Also exports `getStepLabel(stepId)` for display.

### Surgeries Flow
- **page.jsx**: Fetches surgeries filtered by `resident_email`, renders `SurgeryForm` (create/edit) and `SurgeryCard` (display). Uses react-query for cache management.
- **SurgeryForm.jsx**: Form with date picker (Popover + Calendar), patient initials, eye selector, step checkboxes, complex types, complications, and notes. Steps are toggled via parent div `onClick` calling `toggleStep()`.
- **SurgeryCard.jsx**: Displays surgery date, type, steps badges, complications, and notes.

### Tasks Flow
- **page.jsx**: Fetches all `one_time_tasks` and user's `task_completions`. Renders `TaskList` with completion/removal mutations.
- **TaskList.jsx**: Renders sorted tasks with completion state. Each task shows name, description (if present), and an inline completion form with date picker and notes.

### Videos Flow
- **page.jsx**: Fetches video reviews filtered by `resident_email`. Renders `VideoForm` and `VideoCard`.
- **VideoForm.jsx**: Form with review date, senior doctor, description, feedback, meeting presentation flag, and notes. Uses Popover + Calendar for dates.

### Calendar Component
- **calendar.jsx**: Wraps `react-day-picker` v8 `DayPicker` with shadcn styling. Passes all props through. Uses v8 API (`classNames`, `IconLeft`/`IconRight` components).

---

## Bug A: Surgeries Page Crash

### Reproduction
1. Navigate to `/surgeries` -- page loads correctly
2. Click "ניתוח חדש" -- form opens correctly with all fields
3. Click any step checkbox (e.g., "פתחים") -- **page crashes immediately**

### Error
```
React error #185: "Maximum update depth exceeded. This can happen when a
component repeatedly calls setState inside componentWillUpdate or
componentDidUpdate. React limits the number of nested updates to prevent
infinite loops."
```

Screenshot shows Next.js "This page couldn't load" crash screen.

### Root Cause
**File**: `src/components/surgery/SurgeryForm.jsx`, lines 128-144
**Interaction**: Radix Checkbox `BubbleInput` + parent div `onClick` = infinite loop

The step checkboxes are rendered inside a `<div>` with `onClick={() => toggleStep(step.id)}`. The Radix `Checkbox` has `pointer-events-none` so clicks pass through to the div. This seems correct but has a fatal flaw:

**The infinite loop cycle:**
1. User clicks div -> `toggleStep("incisions")` adds step to `steps_performed`
2. React re-renders -> `Checkbox` `checked` changes from `false` to `true`
3. Inside `@radix-ui/react-checkbox@1.3.3`, the `CheckboxBubbleInput` component has a `useEffect` that fires whenever `checked` changes. It dispatches a **synthetic `click` event** with `bubbles: true` on a hidden `<input>` element (this is how Radix syncs with native form behavior)
4. The synthetic click bubbles up the DOM to the parent `<div>`, which has `onClick={() => toggleStep(step.id)}`
5. `toggleStep` fires again, REMOVING the step from `steps_performed`
6. React re-renders -> `Checkbox` `checked` changes from `true` to `false`
7. `BubbleInput` `useEffect` fires again (prevChecked !== checked), dispatches another synthetic click
8. Back to step 4 -> infinite loop -> React error #185

**Why pointer-events-none doesn't help**: CSS `pointer-events: none` prevents mouse events from targeting the element. But the `BubbleInput`'s synthetic event is dispatched programmatically via `input.dispatchEvent(new Event("click", { bubbles }))`, which ignores CSS pointer-events.

**Evidence from source** (`node_modules/@radix-ui/react-checkbox/dist/index.mjs`):
```js
// CheckboxBubbleInput component
React.useEffect(() => {
  const input = bubbleInput;
  if (!input) return;
  if (prevChecked !== checked && setChecked) {
    const event = new Event("click", { bubbles });  // bubbles = true
    setChecked.call(input, ...);
    input.dispatchEvent(event);  // THIS BUBBLES TO PARENT DIV onClick
  }
}, [bubbleInput, prevChecked, checked, ...]);
```

The `BubbleInput` is rendered because `isFormControl` is `true` (the Checkbox is inside a `<form>` element).

### Affected Lines
The same pattern (div onClick + Checkbox pointer-events-none) exists in THREE places:
1. **Steps checkboxes**: lines 128-144
2. **Complex types**: lines 148-170
3. **Complications**: lines 174-198

### Fix Plan
In `src/components/surgery/SurgeryForm.jsx`, guard the div `onClick` handlers against synthetic events using `e.isTrusted`:

```jsx
// Instead of:  onClick={() => toggleStep(step.id)}
// Use:         onClick={(e) => { if (!e.isTrusted) return; toggleStep(step.id); }}
```

Apply this change to all three click handler locations (steps, complex types, complications).

`isTrusted` is `true` for real user clicks and `false` for programmatically dispatched events (like the BubbleInput's synthetic click). This breaks the infinite loop without changing the Radix component or the UX.

---

## Bug B: Calendar Not Registering Clicks

### Reproduction
Tested on both the Videos page and Tasks page calendars.

**Videos page:**
- Opened form, clicked date button -> calendar popover opened correctly (May 2026)
- Clicked day 1 -> date changed from 17/05/2026 to 01/05/2026 (works)
- Clicked day 15 -> date changed to 15/05/2026 (works)
- Clicked currently selected date (17) -> date stays at 17/05/2026 (correct behavior)
- Zero console errors

**Tasks page:**
- Opened completion form, clicked date button -> calendar opened
- Clicked day 5 -> date changed from 17/05/2026 to 05/05/2026 (works)
- Zero console errors

### Finding
**The calendar registers clicks correctly.** Dates change, visual selection updates, no errors.

### Possible Explanations for the Reported Bug
1. **Popover stays open after selection**: The calendar popover does not close after picking a date. This might make users think the click didn't register, even though the date value in the trigger button does update. This is a UX issue, not a functional bug. The Popover has no `open` state management to close on select.
2. **Related to Bug A**: If the user tried using the surgery form calendar AFTER the page crashed from clicking a step checkbox, obviously nothing would work. Bug A crashes the entire page.
3. **Intermittent React 19 issue**: react-day-picker v8.10.2 with React 19.2.4 -- no issues observed in testing, but there could be edge cases.

### Fix Plan
Add controlled `open` state to the Popover so it closes when a date is selected:

In `SurgeryForm.jsx`, `VideoForm.jsx`, and `TaskList.jsx`, change the Popover pattern to:
```jsx
const [calendarOpen, setCalendarOpen] = useState(false);

<Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
  <PopoverTrigger asChild>...</PopoverTrigger>
  <PopoverContent>
    <Calendar onSelect={(d) => { if (d) { setDateObj(d); setCalendarOpen(false); } }} />
  </PopoverContent>
</Popover>
```

This closes the popover after date selection, providing clear visual feedback that the click registered.

---

## Bug C: Tasks Data

### Reproduction
Navigated to `/tasks`. Page shows 5 tasks, all with names only, no descriptions:

1. השלמת קורס מבוא לקטרקט
2. צפייה ב-10 ניתוחי קטרקט
3. תרגול 5 רקסיס בוטלאב
4. ביצוע ניתוח סולו ראשון
5. השתתפות בישיבת שמיים

Header shows "0 מתוך 5 הושלמו" (0 of 5 completed).

### Root Cause
**The seed data has no descriptions.** In `tests/seed.mjs` (lines 42-48), tasks are seeded with only `task_name` and `order`:

```javascript
const tasks = [
  { task_name: 'השלמת קורס מבוא לקטרקט', order: 1 },
  { task_name: 'צפייה ב-10 ניתוחי קטרקט', order: 2 },
  // ... no description field
];
```

**The component code is correct.** `TaskList.jsx` line 86-88 renders descriptions when they exist:
```jsx
{task.description && (
  <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
)}
```

This works -- the data just isn't there.

### Fix Plan
1. **Add descriptions to the seed data** in `tests/seed.mjs`. Each task should have a `description` field explaining what it involves.
2. **Update existing DB records** with descriptions via a Supabase update (either through the seed script or directly).
3. **Verify the `description` column exists** in the `one_time_tasks` table. If it doesn't, it needs to be added via migration.

Example descriptions to add:
```javascript
const tasks = [
  { task_name: 'השלמת קורס מבוא לקטרקט', order: 1,
    description: 'השלמת קורס מבוא הכולל תיאוריה ואנטומיה בסיסית של עין' },
  { task_name: 'צפייה ב-10 ניתוחי קטרקט', order: 2,
    description: 'צפייה ב-10 ניתוחי קטרקט בחדר ניתוח עם מנתח בכיר' },
  { task_name: 'תרגול 5 רקסיס בוטלאב', order: 3,
    description: 'ביצוע 5 תרגולי רקסיס על עיניים מלאכותיות בוטלאב' },
  { task_name: 'ביצוע ניתוח סולו ראשון', order: 4,
    description: 'ביצוע ניתוח קטרקט ראשון באופן עצמאי בפיקוח מנתח בכיר' },
  { task_name: 'השתתפות בישיבת שמיים', order: 5,
    description: 'הצגת מקרה או סרט ניתוח בישיבת שמיים של המחלקה' },
];
```

---

## Summary

| Bug | Severity | Root Cause | Fix Location |
|-----|----------|-----------|--------------|
| A: Surgery crash | Critical | Radix BubbleInput synthetic click causes infinite loop with parent div onClick | SurgeryForm.jsx - 3 onClick handlers |
| B: Calendar clicks | Low/None | Calendar works; popover not closing after selection is a UX improvement | SurgeryForm.jsx, VideoForm.jsx, TaskList.jsx - Popover state |
| C: Tasks data | Medium | Seed data has no description field; DB records lack descriptions | tests/seed.mjs + DB update |
