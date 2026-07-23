// HAAR (Huntsville Area Association of REALTORS) market data — LICENSED, private
// dataset. Its licensing is NOT cleared, so HAAR-derived figures may exist ONLY
// behind this build flag, which defaults OFF. While HAAR_ENABLED is false, zero
// HAAR-sourced values may appear anywhere in dist/.
//
// Enabling this flag requires clearing the data-licensing gate (PRD §8.17).
// Until that gate is cleared, haarSeries stays EMPTY — do not add values here.
import type { MarketSeries } from './huntsville-seed';

export const HAAR_ENABLED = false;

// Empty typed placeholder: no HAAR values exist in the repo today.
export const haarSeries: MarketSeries[] = [];
