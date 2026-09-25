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
  symptomGuide: string;
  kind: WindowsPcPriceKind;
  price?: number;
  leadTime: string;
  workTime: string;
};

const WINDOWS_PC_LEAD_TIME = "3日〜1週間程度";

export const WINDOWS_PC_REPAIR_PRICES: WindowsPcRepairPrice[] = [
  { label: "初期診断・症状確認", symptomGuide: "原因を調べたい", kind: "fixed", price: 5500, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "30分〜1時間程度" },
  { label: "OS起動不良・システム修復", symptomGuide: "Windowsが起動しない・動作がおかしい", kind: "from", price: 13000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜4時間程度" },
  { label: "Windows初期化・再セットアップ", symptomGuide: "初期化して使える状態に戻したい", kind: "from", price: 11000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "3〜5時間程度" },
  { label: "SSD・HDD交換", symptomGuide: "起動が遅い・保存装置が故障した", kind: "from", price: 27500, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜4時間程度" },
  { label: "メモリ交換・増設", symptomGuide: "動作を速くしたい・メモリ不良", kind: "from", price: 14300, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "30分〜1時間程度" },
  { label: "バッテリー交換", symptomGuide: "充電の減りが早い・充電できない", kind: "from", price: 20000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "1〜3時間程度" },
  { label: "液晶・画面交換", symptomGuide: "画面が割れた・映らない", kind: "from", price: 28000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜4時間程度" },
  { label: "キーボード交換", symptomGuide: "キーが反応しない・外れた", kind: "from", price: 15000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜4時間程度" },
  { label: "電源ジャック・充電口修理", symptomGuide: "充電口が反応しない・ぐらつく", kind: "from", price: 14300, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜4時間程度" },
  { label: "ファン交換・内部清掃", symptomGuide: "ファンがうるさい・本体が熱い", kind: "from", price: 12100, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "1〜3時間程度" },
  { label: "データ移行", symptomGuide: "新しいパソコンへデータを移したい", kind: "from", price: 11000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "2〜5時間程度" },
  { label: "データ復旧", symptomGuide: "消えた・読めないデータを取り出したい", kind: "from", price: 30000, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "要確認" },
  { label: "マザーボード・基板修理", symptomGuide: "電源が入らない・基板故障の可能性", kind: "from", price: 39800, leadTime: WINDOWS_PC_LEAD_TIME, workTime: "要確認" },
  { label: "その他", symptomGuide: "上記に当てはまらない・修理内容が分からない", kind: "check", leadTime: WINDOWS_PC_LEAD_TIME, workTime: "要確認" },
];

export function findWindowsPcRepairPrice(label: string) {
  return WINDOWS_PC_REPAIR_PRICES.find((item) => item.label === label);
}
