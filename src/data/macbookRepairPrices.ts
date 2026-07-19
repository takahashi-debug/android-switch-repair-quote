export const MACBOOK_REPAIR_TYPES = [
  "画面交換", "バッテリー交換", "キーボード交換", "基板修理", "水没修理", "ファン交換",
] as const;

export type MacBookRepairType = (typeof MACBOOK_REPAIR_TYPES)[number];
export type MacBookRepairPrice = number | `${number}〜` | null;

export type MacBookModelPrice = {
  year: number;
  size: 13 | 14 | 15 | 16;
  family: "Air" | "Pro";
  modelNumber: string;
  prices: Record<MacBookRepairType, MacBookRepairPrice>;
};

const prices = (
  screen: MacBookRepairPrice,
  battery: MacBookRepairPrice,
  keyboard: MacBookRepairPrice,
  board: MacBookRepairPrice,
  water: MacBookRepairPrice = "11000〜",
  fan: MacBookRepairPrice = "26500〜",
): Record<MacBookRepairType, MacBookRepairPrice> => ({
  画面交換: screen, バッテリー交換: battery, キーボード交換: keyboard,
  基板修理: board, 水没修理: water, ファン交換: fan,
});

export const MACBOOK_REPAIR_PRICES: MacBookModelPrice[] = [
  { year: 2025, size: 16, family: "Pro", modelNumber: "", prices: prices(null, null, null, "39800〜") },
  { year: 2024, size: 16, family: "Pro", modelNumber: "A2991", prices: prices(79600, 26000, 36100, "39800〜") },
  { year: 2023, size: 16, family: "Pro", modelNumber: "A2780", prices: prices(79600, 23300, 33400, "39800〜") },
  { year: 2021, size: 16, family: "Pro", modelNumber: "A2485", prices: prices(79600, 26000, 36100, "39800〜") },
  { year: 2019, size: 16, family: "Pro", modelNumber: "A2141", prices: prices(82300, 23300, 32800, "39800〜") },
  { year: 2025, size: 15, family: "Air", modelNumber: "A3241", prices: prices(null, null, null, 34800) },
  { year: 2024, size: 15, family: "Air", modelNumber: "A3114", prices: prices(60800, 21000, 25100, 34800) },
  { year: 2023, size: 15, family: "Air", modelNumber: "A2941", prices: prices(60800, 21000, 25100, 34800) },
  { year: 2019, size: 15, family: "Pro", modelNumber: "A1990", prices: prices(70400, 22800, 35600, 39800) },
  { year: 2018, size: 15, family: "Pro", modelNumber: "A1990", prices: prices(70400, 22800, 35600, 39800) },
  { year: 2017, size: 15, family: "Pro", modelNumber: "A1707", prices: prices(70200, 22000, 34100, 39800) },
  { year: 2025, size: 14, family: "Pro", modelNumber: "A3434", prices: prices(null, null, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3401", prices: prices(68000, null, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3112", prices: prices(68000, null, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3185", prices: prices(68000, null, null, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2779", prices: prices(78200, 26500, 36600, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2992", prices: prices(78200, 26500, 36600, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2918", prices: prices(78200, 26500, 36600, 39800) },
  { year: 2021, size: 14, family: "Pro", modelNumber: "A2442", prices: prices(78000, 22900, 33000, 39800) },
  { year: 2025, size: 13, family: "Air", modelNumber: "A3240", prices: prices(54900, 24000, 25100, 34800) },
  { year: 2024, size: 13, family: "Air", modelNumber: "A3113", prices: prices(59000, 21000, 25100, 34800) },
  { year: 2022, size: 13, family: "Air", modelNumber: "A2681", prices: prices(54900, 20000, 25100, 34800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2338", prices: prices(55100, 21100, 31200, 39800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2289", prices: prices(55100, 21100, 31200, 39800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2251", prices: prices(55100, 21100, 31200, 39800) },
  { year: 2020, size: 13, family: "Air", modelNumber: "A2337", prices: prices(54900, 17000, 25100, 34800) },
  { year: 2020, size: 13, family: "Air", modelNumber: "A2179", prices: prices(54900, 17000, 25100, 34800) },
  { year: 2019, size: 13, family: "Pro", modelNumber: "A2159", prices: prices(53600, 21100, null, 39800) },
  { year: 2019, size: 13, family: "Pro", modelNumber: "A1708", prices: prices(53600, 21100, null, 39800) },
  { year: 2019, size: 13, family: "Air", modelNumber: "A1932", prices: prices(53700, 17000, 29500, 34800) },
  { year: 2018, size: 13, family: "Pro", modelNumber: "A1989", prices: prices(53600, 21100, 33900, 39800) },
  { year: 2018, size: 13, family: "Air", modelNumber: "A1932", prices: prices(53700, 17000, 29500, 34800) },
  { year: 2017, size: 13, family: "Pro", modelNumber: "A1708", prices: prices(52900, 21100, 33200, 39800) },
  { year: 2017, size: 13, family: "Pro", modelNumber: "A1706", prices: prices(52900, 22400, 33200, 39800) },
];

export function formatMacBookModel(model: MacBookModelPrice) {
  return `${model.year} ${model.size}インチ ${model.family}${model.modelNumber ? ` ${model.modelNumber}` : ""}`;
}

export function findMacBookModel(modelName: string, modelNumber: string) {
  return MACBOOK_REPAIR_PRICES.find((model) =>
    formatMacBookModel(model) === modelName && model.modelNumber === modelNumber,
  );
}
