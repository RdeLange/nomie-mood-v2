<script lang="ts">
  import { onMount } from 'svelte';
  import { MOODS, dayKey, keepRecent, moodNote, moodOn, week, type Entry, type Mood } from './mood';
  import { t, setLanguage, currentLanguage } from './i18n/index.svelte';
  import { paletteFrom, glassFrom, tintTextFrom, type Palette, type Glass } from './palette';
  import { offerTracker } from './tracker-offer';
  import { onPrefsChange } from './prefs-live';

  let plugin: any;
  let view = $state<'modal' | 'widget'>('modal');
  let palette = $state<Palette>(paletteFrom(undefined));
  let glass = $state<Glass>(glassFrom(undefined));
  let tintText = $state(tintTextFrom(undefined));
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
    setLanguage(plugin.prefs?.language);
    glass = glassFrom(plugin.prefs);
    tintText = tintTextFrom(plugin.prefs);
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
      offerTracker(plugin, { tag: 'mood', label: t('trackerLabel'), emoji: '🙂', color: '#F59F00' });
      if (!ready) await load();
    });
  });
</script>

<div class="card" class:widget={view === 'widget'} style="--page: {palette.page}; --card: {palette.card}; --text: {palette.text}; --muted: {palette.textSecondary}; --line: {palette.separator}; --fill: {palette.fill}; --tint: {palette.tint}; --on-tint: {palette.onTint}; --tint-soft: {palette.tintSoft}; --tint-text: {tintText}; --glass-fill: {glass.fill}; --glass-edge: {glass.edge}; --glass-blur: {glass.blur}; --glass-shadow: {glass.shadow}; --scale: {scale};">
  {#if view === 'widget'}
    <div class="moods compact">
      {#each MOODS as m (m.score)}
        <button class="mood" class:on={todays?.score === m.score} aria-label={t(m.key)} onclick={() => choose(m)}>{m.emoji}</button>
      {/each}
    </div>
  {:else}
    <header class="top"><h1>{t('title')}</h1></header>
    <p class="muted">{today.toLocaleDateString(currentLanguage(), { weekday: 'long', day: 'numeric', month: 'long' })}</p>

    <section class="panel">
      <p>{todays ? t('todayMood', { mood: t(MOODS.find((m) => m.score === todays.score)?.key ?? 'moodOkay') }) : t('howToday')}</p>
      <div class="moods">
        {#each MOODS as m (m.score)}
          <button class="mood" class:on={todays?.score === m.score} onclick={() => choose(m)}>
            <span class="face">{m.emoji}</span>
            <span class="label">{t(m.key)}</span>
          </button>
        {/each}
      </div>
      <input class="input" placeholder={t('notePlaceholder')} bind:value={note} />
    </section>

    <h2>{t('lastSeven')}</h2>
    <section class="panel week">
      {#each series as d (d.date.toDateString())}
        <div class="col">
          <div class="column"><div style="height: {(d.score / 5) * 100}%"></div></div>
          <span class="label">{d.date.toLocaleDateString(currentLanguage(), { weekday: 'short' })}</span>
        </div>
      {/each}
    </section>
  {/if}
</div>

<style>
  /* the app's text: its iOS font stack, with the app's smoothing */
  :global(body) { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif; -webkit-font-smoothing: antialiased; --ios-font-rounded: ui-rounded, -apple-system, system-ui, sans-serif; }
  /* the header is a Liquid Glass bar (D-glass): it stays at the top and the content scrolls under it */
  .top { position: sticky; top: 0; z-index: 2; margin: -16px -16px 8px; padding: 16px 16px 10px; background: var(--glass-fill); -webkit-backdrop-filter: var(--glass-blur); backdrop-filter: var(--glass-blur); border-bottom: 1px solid var(--glass-edge); }
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
