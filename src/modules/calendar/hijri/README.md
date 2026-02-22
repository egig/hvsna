# useHijriCalendar Hook

A React hook that provides comprehensive Hijri calendar functionality with timezone, location, and manual offset support.

## Features

- **Location-aware**: Uses latitude and longitude for accurate sunset-based Hijri date calculations
- **Timezone support**: Automatically uses the user's configured timezone
- **Manual offset**: Supports manual date adjustments for customization
- **Date conversion**: Seamlessly convert between Gregorian and Hijri dates
- **Navigation utilities**: Easy navigation between dates (today, tomorrow, yesterday)
- **Week calculations**: Get week dates and start of week
- **Formatting**: Flexible date formatting with various patterns
- **TypeScript support**: Full type safety and IntelliSense support

## Usage

```tsx
import { useHijriCalendar } from './modules/calendar/hijri';

function MyComponent() {
  const {
    currentHijriDate,
    timezone,
    latitude,
    longitude,
    manualOffset,
    toHijriDate,
    fromHijriDate,
    getToday,
    getTomorrow,
    getYesterday,
    isToday,
    isTomorrow,
    isSameDay,
    getWeekDates,
    getStartOfWeek,
    formatDate,
    createHijriDate,
    loading,
    error,
    initiated,
  } = useHijriCalendar();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h1>Current Hijri Date: {formatDate(currentHijriDate, 'dddd, D MMMM YYYY')}</h1>
      <p>Timezone: {timezone}</p>
      <p>Location: {latitude}, {longitude}</p>
      <p>Manual Offset: {manualOffset} days</p>
    </div>
  );
}
```

## Options

The hook accepts optional configuration:

```tsx
const { currentHijriDate } = useHijriCalendar({
  date: new Date(), // Use specific Gregorian date
  hijriYear: 1446,  // Or use specific Hijri date components
  hijriMonth: 1,
  hijriDay: 1,
});
```

## Return Values

### Current State
- `currentHijriDate: HijriDate` - Current Hijri date based on options or current time
- `timezone: string` - User's configured timezone
- `latitude?: number` - Latitude from settings (if available)
- `longitude?: number` - Longitude from settings (if available)
- `manualOffset?: number` - Manual date offset in days

### Date Conversion
- `toHijriDate(date: Date): HijriDate` - Convert Gregorian date to Hijri
- `fromHijriDate(hijriDate: HijriDate): Date` - Convert Hijri date to Gregorian
- `toGregorianDate(hijriDate: HijriDate): Date` - Alias for fromHijriDate

### Date Navigation
- `getToday(): HijriDate` - Get today's Hijri date
- `getTomorrow(): HijriDate` - Get tomorrow's Hijri date
- `getYesterday(): HijriDate` - Get yesterday's Hijri date

### Date Utilities
- `isToday(hijriDate: HijriDate): boolean` - Check if date is today
- `isTomorrow(hijriDate: HijriDate): boolean` - Check if date is tomorrow
- `isSameDay(date1: HijriDate, date2: HijriDate): boolean` - Check if dates are same day

### Week Utilities
- `getWeekDates(hijriDate: HijriDate): HijriDate[]` - Get all dates in the week
- `getStartOfWeek(hijriDate: HijriDate): HijriDate` - Get start of week (Friday)

### Formatting
- `formatDate(hijriDate: HijriDate, format: string): string` - Format date with pattern

### Creation
- `createHijriDate(year, month, day, hour?, minute?): HijriDate` - Create specific Hijri date

### State
- `loading: boolean` - Settings loading state
- `error: string | null` - Error state
- `initiated: boolean` - Hook initialization state

## Date Formatting Patterns

The `formatDate` function supports various patterns:

- `YYYY` - 4-digit year (e.g., 1445)
- `YY` - 2-digit year (e.g., 45)
- `MMMM` - Full month name (e.g., "Ramadan")
- `MMM` - Short month name (e.g., "Ram")
- `MM` - 2-digit month (e.g., "09")
- `M` - Month (e.g., "9")
- `DDDD` - Day with suffix (e.g., "1st", "2nd")
- `DD` - 2-digit day (e.g., "01")
- `D` - Day (e.g., "1")
- `dddd` - Full day name (e.g., "Friday")
- `ddd` - Short day name (e.g., "Fri")
- `dd` - Very short day name (e.g., "Fr")
- `HH` - 24-hour format (e.g., "14")
- `H` - Hour (e.g., "14")
- `hh` - 12-hour format (e.g., "02")
- `h` - 12-hour format (e.g., "2")
- `mm` - Minutes (e.g., "05")
- `m` - Minutes (e.g., "5")
- `a` - AM/PM (lowercase)
- `A` - AM/PM (uppercase)

## Examples

### Basic Usage
```tsx
const { currentHijriDate, formatDate } = useHijriCalendar();
const formatted = formatDate(currentHijriDate, 'dddd, D MMMM YYYY');
// Result: "Friday, 15 Ramadan 1445"
```

### Date Conversion
```tsx
const { toHijriDate, formatDate } = useHijriCalendar();
const gregorianDate = new Date('2024-03-22');
const hijriDate = toHijriDate(gregorianDate);
const formatted = formatDate(hijriDate, 'D MMMM YYYY');
// Result: "15 Ramadan 1445"
```

### Custom Date Creation
```tsx
const { createHijriDate, formatDate } = useHijriCalendar();
const customDate = createHijriDate(1446, 1, 1, 12, 30);
const formatted = formatDate(customDate, 'dddd, D MMMM YYYY HH:mm');
// Result: "Friday, 1 Muharram 1446 12:30"
```

### Week Navigation
```tsx
const { getWeekDates, formatDate } = useHijriCalendar();
const weekDates = getWeekDates(currentHijriDate);
weekDates.forEach(date => {
  console.log(formatDate(date, 'ddd: D MMMM'));
});
// Output:
// Fri: 13 Ramadan
// Sat: 14 Ramadan
// Sun: 15 Ramadan
// Mon: 16 Ramadan
// Tue: 17 Ramadan
// Wed: 18 Ramadan
// Thu: 19 Ramadan
```

## Dependencies

The hook depends on:
- `useSettings` hook for configuration
- `HijriDate` class for core functionality
- `@tabby_ai/hijri-converter` for conversion algorithms
- `suncalc` for sunset calculations

## Notes

- The hook automatically uses sunset-based calculations for accurate Hijri date determination
- Islamic weeks start on Friday (Jumu'ah)
- Manual offset allows for custom calendar adjustments
- All calculations are timezone and location-aware
