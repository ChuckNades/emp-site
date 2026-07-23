// Pure template function that generates ONE machine-extractable narrative
// sentence from a market series' data. This is template-generated data
// rendering, NOT editorial copy: the sentence is derived mechanically from the
// series' first and last rows, so it can never drift from the table.
import type { MarketSeries } from '../data/market/huntsville-seed';

// Shared value formatter — used by BOTH the table cells and the narrative so a
// rendered value always matches the module. Whole numbers in an integer series
// (Dollars, Persons) get thousands separators; decimal series (Percent, index)
// render with one decimal so 2.0 stays "2.0" rather than collapsing to "2".
export function formatMarketValue(series: MarketSeries, value: number): string {
  if (series.unit === 'Percent' || series.unit.startsWith('Index')) {
    return value.toFixed(1);
  }
  return value.toLocaleString('en-US');
}

// "X rose/fell from A (start period) to B (end period)." — X is the series
// label, A/B are the first/last values with their periods. Falls back to a
// neutral "held steady" when start and end values are equal.
export function marketNarrative(series: MarketSeries): string {
  const first = series.rows[0];
  const last = series.rows[series.rows.length - 1];
  const a = formatMarketValue(series, first.value);
  const b = formatMarketValue(series, last.value);
  if (last.value === first.value) {
    return `${series.label} held steady at ${a} from ${first.period} to ${last.period}.`;
  }
  const direction = last.value > first.value ? 'rose' : 'fell';
  return `${series.label} ${direction} from ${a} (${first.period}) to ${b} (${last.period}).`;
}
