// Huntsville market report seed data — PUBLIC federal sources only.
//
// Every value below was retrieved from a public source on 2026-07-23 and
// hardcoded here so the build stays offline (no runtime fetches). Each series
// records its sourceName, sourceUrl, and retrievedDate. NEVER invent or
// estimate a number; if a value cannot be verified against the source, drop
// the row (or the series) rather than guess.
//
// Series notes:
// - ATNHPIUS26620Q: All-Transactions House Price Index for Huntsville, AL (MSA),
//   quarterly, index 1995:Q1=100, not seasonally adjusted. Source: FHFA via FRED.
// - HUNT601URN: Unemployment Rate in Huntsville, AL (MSA), monthly, percent,
//   not seasonally adjusted. Source: BLS via FRED. NOTE: the task brief named
//   "HUNT101URN"; that id is retired — the current Huntsville MSA unemployment
//   series id is HUNT601URN (verified at fred.stlouisfed.org/series/HUNT601URN).
//   ANNUALIZATION RULE: each annual value is the calendar-year average of that
//   year's monthly values, rounded to one decimal. 2025 is the average of its
//   11 reported months (Oct 2025 not yet reported at retrieval time).
// - Census ACS 5-year estimates (Madison County, AL; GEO_ID 0500000US01089):
//   B19013_001E median household income and B01003_001E total population, taken
//   from the Census Bureau table-based summary files (values as published, no
//   rounding). Vintages 2022, 2023, 2024.

export interface MarketSeriesRow {
  period: string;
  value: number;
}

export interface MarketSeries {
  label: string;
  unit: string;
  sourceName: string;
  sourceUrl: string;
  retrievedDate: string;
  rows: MarketSeriesRow[];
}

const RETRIEVED = '2026-07-23';

export const huntsvilleSeed: MarketSeries[] = [
  {
    label: 'All-Transactions House Price Index, Huntsville, AL (MSA)',
    unit: 'Index 1995:Q1=100',
    sourceName: 'FRED (FHFA), series ATNHPIUS26620Q',
    sourceUrl: 'https://fred.stlouisfed.org/series/ATNHPIUS26620Q',
    retrievedDate: RETRIEVED,
    rows: [
      { period: '2023 Q4', value: 298.7 },
      { period: '2024 Q1', value: 309.86 },
      { period: '2024 Q2', value: 310.04 },
      { period: '2024 Q3', value: 319.58 },
      { period: '2024 Q4', value: 316.86 },
      { period: '2025 Q1', value: 316.64 },
      { period: '2025 Q2', value: 320.77 },
      { period: '2025 Q3', value: 319.53 },
      { period: '2025 Q4', value: 326.72 },
      { period: '2026 Q1', value: 324.85 },
    ],
  },
  {
    label: 'Unemployment Rate, Huntsville, AL (MSA), annual average',
    unit: 'Percent',
    sourceName: 'FRED (BLS), series HUNT601URN',
    sourceUrl: 'https://fred.stlouisfed.org/series/HUNT601URN',
    retrievedDate: RETRIEVED,
    rows: [
      { period: '2021', value: 2.5 },
      { period: '2022', value: 2.0 },
      { period: '2023', value: 2.0 },
      { period: '2024', value: 2.5 },
      { period: '2025', value: 2.4 },
    ],
  },
  {
    label: 'Median Household Income, Madison County, AL (ACS 5-year, B19013)',
    unit: 'Dollars',
    sourceName: 'U.S. Census Bureau, ACS 5-year estimates, table B19013',
    sourceUrl:
      'https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/5YRData/acsdt5y2024-b19013.dat',
    retrievedDate: RETRIEVED,
    rows: [
      { period: '2022 ACS 5-year', value: 78058 },
      { period: '2023 ACS 5-year', value: 83528 },
      { period: '2024 ACS 5-year', value: 86499 },
    ],
  },
  {
    label: 'Total Population, Madison County, AL (ACS 5-year, B01003)',
    unit: 'Persons',
    sourceName: 'U.S. Census Bureau, ACS 5-year estimates, table B01003',
    sourceUrl:
      'https://www2.census.gov/programs-surveys/acs/summary_file/2024/table-based-SF/data/5YRData/acsdt5y2024-b01003.dat',
    retrievedDate: RETRIEVED,
    rows: [
      { period: '2022 ACS 5-year', value: 389781 },
      { period: '2023 ACS 5-year', value: 397135 },
      { period: '2024 ACS 5-year', value: 405718 },
    ],
  },
];
