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
  { year: 2025, size: 16, family: "Pro", modelNumber: "", prices: prices(null, null, null, 39800) },
  { year: 2024, size: 16, family: "Pro", modelNumber: "A2991", prices: prices(82800, 29500, 36100, 39800) },
  { year: 2023, size: 16, family: "Pro", modelNumber: "A2780", prices: prices(82800, 23200, 33400, 39800) },
  { year: 2021, size: 16, family: "Pro", modelNumber: "A2485", prices: prices(82800, 23200, 36100, 39800) },
  { year: 2019, size: 16, family: "Pro", modelNumber: "A2141", prices: prices(82800, 23200, 32800, 39800) },
  { year: 2025, size: 15, family: "Air", modelNumber: "A3241", prices: prices(52700, null, null, 34800) },
  { year: 2024, size: 15, family: "Air", modelNumber: "A3114", prices: prices(54200, 20200, null, 34800) },
  { year: 2023, size: 15, family: "Air", modelNumber: "A2941", prices: prices(54200, 20200, null, 34800) },
  { year: 2019, size: 15, family: "Pro", modelNumber: "A1990", prices: prices(65100, 22800, 35600, 39800) },
  { year: 2018, size: 15, family: "Pro", modelNumber: "A1990", prices: prices(65100, 22800, 35600, 39800) },
  { year: 2017, size: 15, family: "Pro", modelNumber: "A1707", prices: prices(71900, 21200, 34100, 39800) },
  { year: 2025, size: 14, family: "Pro", modelNumber: "A3434", prices: prices(null, null, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3401", prices: prices(61200, 25100, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3112", prices: prices(61200, 25100, null, 39800) },
  { year: 2024, size: 14, family: "Pro", modelNumber: "A3185", prices: prices(61200, 25100, null, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2779", prices: prices(61200, 25000, 36600, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2992", prices: prices(61200, 25000, 36600, 39800) },
  { year: 2023, size: 14, family: "Pro", modelNumber: "A2918", prices: prices(61200, 25000, 36600, 39800) },
  { year: 2021, size: 14, family: "Pro", modelNumber: "A2442", prices: prices(61200, 22800, 33000, 39800) },
  { year: 2025, size: 13, family: "Air", modelNumber: "A3240", prices: prices(53800, 23400, 25100, 34800) },
  { year: 2024, size: 13, family: "Air", modelNumber: "A3113", prices: prices(51300, 23800, 25100, 34800) },
  { year: 2022, size: 13, family: "Air", modelNumber: "A2681", prices: prices(50500, 18200, 25100, 34800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2338", prices: prices(47300, 21000, 31200, 39800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2289", prices: prices(55700, 21000, 31200, 39800) },
  { year: 2020, size: 13, family: "Pro", modelNumber: "A2251", prices: prices(55700, 21000, 31200, 39800) },
  { year: 2020, size: 13, family: "Air", modelNumber: "A2337", prices: prices(46600, 17100, 25100, 34800) },
  { year: 2020, size: 13, family: "Air", modelNumber: "A2179", prices: prices(52800, 17000, 25100, 34800) },
  { year: 2019, size: 13, family: "Pro", modelNumber: "A2159", prices: prices(55700, 21000, null, 39800) },
  { year: 2019, size: 13, family: "Pro", modelNumber: "A1708", prices: prices(53900, 21000, null, 39800) },
  { year: 2019, size: 13, family: "Air", modelNumber: "A1932", prices: prices(58000, 17100, 29500, 34800) },
  { year: 2018, size: 13, family: "Pro", modelNumber: "A1989", prices: prices(54600, 21000, 33900, 39800) },
  { year: 2018, size: 13, family: "Air", modelNumber: "A1932", prices: prices(58000, 17100, 29500, 34800) },
  { year: 2017, size: 13, family: "Pro", modelNumber: "A1708", prices: prices(43700, 21000, 33200, 39800) },
  { year: 2017, size: 13, family: "Pro", modelNumber: "A1706", prices: prices(43700, 21000, 33200, 39800) },
];

export function formatMacBookModel(model: MacBookModelPrice) {
  return `${model.year} ${model.size}インチ ${model.family}${model.modelNumber ? ` ${model.modelNumber}` : ""}`;
}

export function findMacBookModel(modelName: string, modelNumber: string) {
  return MACBOOK_REPAIR_PRICES.find((model) =>
    formatMacBookModel(model) === modelName && model.modelNumber === modelNumber,
  );
}
