# Unix Calendar Project Context

## Overview
A React-based Unix time calendar that displays time in a metric format (YY-DDD-HH-MMM) with conversion to Gregorian calendar.

## Key Components
- `App.tsx`: Main application with time conversion logic and UI
- `main.tsx`: React app entry point
- Uses Vite build system with TypeScript

## Time Format
- YY: Year
- DDD: Day of year (000-999)
- HH: Hour (00-99)
- MMM: Minute (000-999)

## URL Time Reflection Feature
- Encodes time in URL as `?q=yy-ddd-hh-mmm` format
- Reads time from URL on app load
- Updates URL when time values change
- Uses `window.history.replaceState()` to avoid history entries

## Dependencies
- React 19.2.0
- TypeScript 5.9.3
- Vite with rolldown
- Tailwind CSS
- Lucide React icons

## Conversion Logic
- `dateToMetric()`: Converts Date to metric time
- `metricToDate()`: Converts metric time to Date
- Constants: SECONDS_IN_HH=1000, SECONDS_IN_DDD=100000, SECONDS_IN_YY=100000000

## Notes

* Don't use `npm run dev` for testing, ask the user for test and feedback.