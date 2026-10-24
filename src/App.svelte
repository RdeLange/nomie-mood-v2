<script lang="ts">
  import { onMount } from 'svelte';
  import { MOODS, dayKey, keepRecent, moodNote, moodOn, week, type Entry, type Mood } from './mood';
  import { paletteFrom, type Palette } from './palette';
  import { offerTracker } from './tracker-offer';
  import { onPrefsChange } from './prefs-live';

  let plugin: any;
  let view = $state<'modal' | 'widget'>('modal');
  let palette = $state<Palette>(paletteFrom(undefined));
  let scale = $state(1);
  let entries = $state<Entry[]>([]);
  let ready = $state(false);
  let note = $state('');
  let today = $state(new Date());

  const todays = $derived(moodOn(entries, today));
  const series = $derived(week(entries, today));

  const applyNomieValues = () => {
    if (!plugin?.prefs) return;
    palette = paletteFrom(plugin.prefs);
    scale = plugin.prefs.fontScale || 1;
  };

  const load = async () => {
    await plugin.storage.init();
    entries = plugin.storage.getItem('moods') || [];
    today = new Date();
    ready = true;
  };

  const choose = async (mood: Mood) => {
    const entry: Entry = { day: dayKey(new Date()), score: mood.score, at: Date.now(), note: note.trim() };
    entries = keepRecent([...entries, entry]);
    await plugin.storage.setItem('moods', $state.snapshot(entries));
    plugin.createNote({ note: moodNote(mood, note), score: mood.score });
    note = '';
  };

  onMount(() => {
    plugin = new NomiePlugin({
      name: 'Nomie Mood',
      emoji: '🙂',
      description: 'One tap for your mood, with an optional note. Each mood is written into your timeline with its score, and the week is shown.',
      uses: ['createNote', 'getStorageItem', 'setStorageItem', 'getTrackable', 'openTrackableEditor', 'confirm'],
      version: '2.0',
      addToCaptureMenu: true,
      addToMoreMenu: true,
      addToWidgets: true,
    });
    onPrefsChange(plugin, () => applyNomieValues());
  plugin.onRegistered(async () => {
      applyNomieValues();
      await load();
    });
    plugin.onWidget(async () => {
      view = 'widget';
      applyNomieValues();
      if (!ready) await load();
    });
    plugin.onUIOpened(async () => {
      view = 'modal';
      applyNomieValues();
      offerTracker(plugin, { tag: 'mood', label: 'Mood', emoji: '🙂', color: '#F59F00' });
      if (!ready) await load();
    });
  });
</script>

<div class="card" class:widget={view === 'widget'} style="--page: {palette.page}; --card: {palette.card}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --scale: {scale};">
  {#if view === 'widget'}
    <div class="moods compact">
      {#each MOODS as m (m.score)}
        <button class="mood" class:on={todays?.score === m.score} aria-label={m.label} onclick={() => choose(m)}>{m.emoji}</button>
      {/each}
    </div>
  {:else}
    <h1>Mood</h1>
    <p class="muted">{today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>

    <section class="panel">
      <p>{todays ? `Today: ${MOODS.find((m) => m.score === todays.score)?.label}` : 'How are you today?'}</p>
      <div class="moods">
        {#each MOODS as m (m.score)}
          <button class="mood" class:on={todays?.score === m.score} onclick={() => choose(m)}>
            <span class="face">{m.emoji}</span>
            <span class="label">{m.label}</span>
          </button>
        {/each}
      </div>
      <input class="input" placeholder="A note, if you like" bind:value={note} />
    </section>

    <h2>The last seven days</h2>
    <section class="panel week">
      {#each series as d (d.date.toDateString())}
        <div class="col">
          <div class="column"><div style="height: {(d.score / 5) * 100}%"></div></div>
          <span class="label">{d.date.toLocaleDateString(undefined, { weekday: 'short' })}</span>
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  .card { box-sizing: border-box; min-height: 100vh; padding: 16px; background: var(--page); color: var(--text); font-size: calc(16px * var(--scale)); line-height: 1.4; }
  .card.widget { min-height: 0; padding: 12px; font-size: calc(14px * var(--scale)); }
  h1 { margin: 0; font-size: calc(26px * var(--scale)); font-weight: 700; }
  h2 { margin: 20px 0 6px; font-size: calc(13px * var(--scale)); font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
  .muted { margin: 4px 0; color: var(--muted); }
  .panel { padding: 16px; border-radius: 16px; background: var(--card); }
  .moods { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin: 8px 0 12px; }
  .moods.compact { display: flex; gap: 6px; justify-content: space-between; }
  .mood { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 2px; border: 0; border-radius: 12px; background: var(--fill); color: var(--text); font: inherit; cursor: pointer; }
  .mood.on { background: var(--tint-soft); outline: 2px solid var(--tint); }
  .face { font-size: calc(28px * var(--scale)); }
  .label { font-size: calc(12px * var(--scale)); color: var(--muted); }
  .input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; background: var(--page); color: var(--text); font: inherit; }
  .week { display: flex; gap: 6px; height: 140px; align-items: flex-end; }
  .col { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; }
  .column { flex: 1; width: 100%; display: flex; align-items: flex-end; }
  .column > div { width: 100%; min-height: 2px; background: var(--tint); border-radius: 4px 4px 0 0; }
</style>
