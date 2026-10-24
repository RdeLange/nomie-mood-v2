import { describe, expect, it } from 'vitest';
import { MOODS, dayKey, keepRecent, moodNote, moodOn, week, type Entry } from '../mood';

const today = new Date(2026, 9, 24);
const entry = (day: Date, score: number): Entry => ({ day: dayKey(day), score, at: 0, note: '' });

describe('the mood', () => {
  it('finds the last mood of a day', () => {
    expect(moodOn([entry(today, 2), entry(today, 4)], today)?.score).toBe(4);
    expect(moodOn([], today)).toBeNull();
  });

  it('gives seven days, oldest first, with 0 for a day without a mood', () => {
    const series = week([entry(today, 5)], today);
    expect(series).toHaveLength(7);
    expect(series[6].score).toBe(5);
    expect(series[0].score).toBe(0);
  });

  it('writes the mood with its note into the timeline', () => {
    expect(moodNote(MOODS[3], ' a good walk ')).toBe('Mood: Good a good walk #mood');
    expect(moodNote(MOODS[0], '')).toBe('Mood: Rough #mood');
  });

  it('keeps the last 400 entries', () => {
    const many = Array.from({ length: 450 }, (_, i) => ({ day: `d${i}`, score: 3, at: i, note: '' }));
    expect(keepRecent(many)).toHaveLength(400);
  });
});
