export type InquiryCategory =
  | "Android"
  | "Switch"
  | "Dyson"
  | "Roomba"
  | "Windows PC"
  | "MacBook";

export type AndroidPriceMasterItem = {
  rowNumber: number;
  sortOrder: number | string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  screenPrice: number | string;
  screenStatus: string;
  batteryStatus: string;
  chargePortStatus: string;
  cameraLensStatus: string;
  sleepButtonStatus: string;
  volumeButtonStatus: string;
  note: string;
  receptionStatus: string;
};

export type SwitchEstimateMasterItem = {
  rowNumber: number;
  sortOrder: number | string;
  modelName: string;
  modelNumber: string;
  symptom: string;
  estimatedRepairType: string;
  repairPrice: number | string;
  repairStatus: string;
  note: string;
  receptionStatus: string;
};

export type DysonRoombaEstimateMasterRow = {
  rowNumber: number;
  category: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  symptomSelectionType: string;
  symptom: string;
  candidateGroupId: string;
  estimatedRepairType: string;
  price: number | string;
  leadTime: string;
  note: string;
  receptionStatus: string;
  sortOrder: number | string;
};

export type RepairItemMasterItem = {
  rowNumber: number;
  sortOrder: number | string;
  category: "Android" | "Switch" | string;
  repairItemName: string;
  displayName: string;
  priceType: string;
  standardPrice: number | string;
  repairStatus: string;
  targetModelCategory: string;
  note: string;
  receptionStatus: string;
};

export type AndroidModelRepairSettingItem = {
  rowNumber: number;
  createdAt: string;
  updatedAt: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  repairItemName: string;
  repairStatus: string;
  customPrice: number | string;
  note: string;
  receptionStatus: string;
};

export type StaffItem = {
  name?: string;
  storeName?: string;
  email?: string;
  [key: string]: number | string | boolean | null | undefined;
};

export type UserMasterItem = {
  email: string;
  storeName: string;
  role: "admin" | "staff" | string;
};

export type OptionItem = {
  optionName?: string;
  name?: string;
  label?: string;
  price?: number | string;
  optionPrice?: number | string;
  status?: string;
  [key: string]: number | string | boolean | null | undefined;
};

export type InitialData = {
  priceMaster: AndroidPriceMasterItem[];
  switchEstimateMaster: SwitchEstimateMasterItem[];
  dysonRoombaEstimateMaster: DysonRoombaEstimateMasterRow[];
  repairItemMaster: RepairItemMasterItem[];
  androidModelRepairSettings: AndroidModelRepairSettingItem[];
  staffList: StaffItem[];
  optionMaster: OptionItem[];
  users?: UserMasterItem[];
};
