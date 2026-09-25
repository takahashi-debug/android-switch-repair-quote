export const WINDOWS_PC_MANUFACTURERS = [
  "NEC", "富士通", "Dynabook", "Panasonic", "VAIO", "Microsoft Surface",
  "Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI", "マウスコンピューター",
  "パソコン工房", "ドスパラ", "自作PC", "その他",
] as const;

export const WINDOWS_PC_DEVICE_TYPES = [
  "ノートパソコン", "デスクトップパソコン", "オールインワン", "タブレット・2in1",
] as const;

export type WindowsPcPriceKind = "fixed" | "parts" | "check" | "from";

export type WindowsPcRepairPrice = {
  label: string;
  kind: WindowsPcPriceKind;
  price?: number;
  leadTime: string;
  workTime: string;
};

export const WINDOWS_PC_REPAIR_PRICES: WindowsPcRepairPrice[] = [
  { label: "初期診断・症状確認", kind: "fixed", price: 5500, leadTime: "当日〜3日程度", workTime: "30分〜1時間程度" },
  { label: "OS起動不良・システム修復", kind: "from", price: 13000, leadTime: "1日〜3日程度", workTime: "2〜4時間程度" },
  { label: "Windows初期化・再セットアップ", kind: "from", price: 11000, leadTime: "1日〜3日程度", workTime: "3〜5時間程度" },
  { label: "SSD・HDD交換", kind: "from", price: 27500, leadTime: "3日〜1週間程度", workTime: "2〜4時間程度" },
  { label: "メモリ交換・増設", kind: "from", price: 14300, leadTime: "3日〜1週間程度", workTime: "30分〜1時間程度" },
  { label: "バッテリー交換", kind: "from", price: 20000, leadTime: "1週間〜2週間程度", workTime: "1〜3時間程度" },
  { label: "液晶・画面交換", kind: "from", price: 28000, leadTime: "1週間〜2週間程度", workTime: "2〜4時間程度" },
  { label: "キーボード交換", kind: "from", price: 15000, leadTime: "1週間〜2週間程度", workTime: "2〜4時間程度" },
  { label: "電源ジャック・充電口修理", kind: "from", price: 14300, leadTime: "1週間〜2週間程度", workTime: "2〜4時間程度" },
  { label: "ファン交換・内部清掃", kind: "from", price: 12100, leadTime: "3日〜1週間程度", workTime: "1〜3時間程度" },
  { label: "データ移行", kind: "from", price: 11000, leadTime: "当日〜3日程度", workTime: "2〜5時間程度" },
  { label: "データ復旧", kind: "from", price: 30000, leadTime: "要確認", workTime: "要確認" },
  { label: "マザーボード・基板修理", kind: "from", price: 39800, leadTime: "1週間〜3週間程度", workTime: "要確認" },
  { label: "その他", kind: "check", leadTime: "要確認", workTime: "要確認" },
];

export function findWindowsPcRepairPrice(label: string) {
  return WINDOWS_PC_REPAIR_PRICES.find((item) => item.label === label);
}
