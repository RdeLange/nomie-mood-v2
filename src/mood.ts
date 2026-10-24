// The mood rules as plain functions, so they can be tested without the app.
export type Mood = { score: number; emoji: string; label: string };
export type Entry = { day: string; score: number; at: number; note: string };

export const MOODS: Mood[] = [
  { score: 1, emoji: '😣', label: 'Rough' },
  { score: 2, emoji: '🙁', label: 'Low' },
  { score: 3, emoji: '😐', label: 'Okay' },
  { score: 4, emoji: '🙂', label: 'Good' },
  { score: 5, emoji: '😄', label: 'Great' },
];

// A day key such as 2026-10-24, in local time
export const dayKey = (date: Date): string => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

// The mood entered on a day: the last one of that day
export const moodOn = (entries: Entry[], day: Date): Entry | null => entries.filter((e) => e.day === dayKey(day)).pop() ?? null;

// The last seven days, oldest first, with the score of each day (0 when there is none)
export const week = (entries: Entry[], today: Date) =>
  Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (6 - i));
    const found = moodOn(entries, date);
    return { date, score: found ? found.score : 0 };
  });

// The text written into the timeline for a mood, with the optional note
export const moodNote = (mood: Mood, note: string): string => `Mood: ${mood.label}${note.trim() ? ` ${note.trim()}` : ''} #mood`;

// Keeps the last 400 entries, so storage does not grow for ever
export const keepRecent = (entries: Entry[]): Entry[] => entries.slice(-400);
