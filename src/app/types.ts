export type InquiryCategory = "Android" | "Switch";

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
  staffList: StaffItem[];
  optionMaster: OptionItem[];
  users?: UserMasterItem[];
};
