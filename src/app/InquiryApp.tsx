"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
  AndroidModelRepairSettingItem,
  AndroidPriceMasterItem,
  InitialData,
  InquiryCategory,
  OptionItem,
  RepairItemMasterItem,
  SwitchEstimateMasterItem,
  UserMasterItem,
} from "./types";

type OrderStatus = "受注" | "検討";
type SaveFeedbackTone = "muted" | "success" | "error";
type AuthUser = UserMasterItem;

type SaveFeedback = {
  tone: SaveFeedbackTone;
  message: string;
  savingStatus?: OrderStatus;
};

type SwitchStockStatus = "inStock" | "outOfStock" | "outsourced" | "needCheck";
type SwitchWorkTime = "30分" | "60分" | "90分" | "120分" | "要確認";

type SwitchStockCheck = {
  status: SwitchStockStatus;
  workTime?: SwitchWorkTime;
};

type SwitchStockCheckByLine = Record<string, SwitchStockCheck>;

type AdminReportFeedback = {
  tone: SaveFeedbackTone;
  message: string;
};

type AdminReportForm = {
  reportType: AdminReportType;
  category: string;
  targetModel: string;
  targetRepairOrSymptom: string;
  message: string;
};

type AdminReportType = (typeof adminReportTypes)[number];
type UsageGuideTab = "common" | "android" | "switch";
type MasterManagementTab = "Android" | "Switch" | "修理メニュー";
type AndroidMasterMode = "新規機種追加" | "既存データ変更";
type SwitchMasterMode = "新規項目追加" | "既存データ変更";
type RepairItemMode = "修理メニュー追加" | "既存メニュー変更";

type AndroidMasterForm = {
  rowNumber?: number;
  sortOrder: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  screenPrice: string;
  screenStatus: string;
  batteryManualPrice: string;
  batteryStatus: string;
  chargePortManualPrice: string;
  chargePortStatus: string;
  cameraLensManualPrice: string;
  cameraLensStatus: string;
  sleepButtonManualPrice: string;
  sleepButtonStatus: string;
  volumeButtonManualPrice: string;
  volumeButtonStatus: string;
  note: string;
  receptionStatus: string;
  additionalRepairSettings: AndroidModelRepairSettingForm[];
};

type AndroidModelRepairSettingForm = {
  repairItemName: string;
  repairStatus: string;
  customPrice: string;
  note: string;
  receptionStatus: string;
};

type SwitchMasterForm = {
  rowNumber?: number;
  sortOrder: string;
  modelName: string;
  modelNumber: string;
  symptom: string;
  estimatedRepairType: string;
  repairPrice: string;
  repairStatus: string;
  note: string;
  receptionStatus: string;
};

type RepairItemForm = {
  rowNumber?: number;
  sortOrder: string;
  category: string;
  repairItemName: string;
  displayName: string;
  priceType: string;
  standardPrice: string;
  repairStatus: string;
  targetModelCategory: string;
  note: string;
  receptionStatus: string;
};

type MasterFeedback = {
  tone: SaveFeedbackTone;
  message: string;
};

type AndroidMasterModelOption = {
  key: string;
  label: string;
};

type RepairItemNameOption = {
  key: string;
  label: string;
};

type FormState = {
  category: InquiryCategory;
  maker: string;
  modelName: string;
  modelNumber: string;
  repairType: string;
  symptom: string;
  switchSelectedModels: SwitchSelectedModel[];
  switchUnitInputs: SwitchUnitInput[];
  switchOptionSelections: SwitchOptionSelectionState;
  orderStatus: OrderStatus;
  selectedOptionKeys: string[];
  selectedAndroidRepairKeys: string[];
};

type SwitchSelectedModel = {
  modelName: string;
  modelNumber?: string;
  quantity: number;
};

type SwitchUnitInput = {
  unitId: string;
  modelName: string;
  modelNumber?: string;
  unitIndex: number;
  selectedSymptoms: string[];
  selectedRepairTypes: string[];
};

type OpenDropdownKey = string | null;

type SwitchOptionSelectionState = Record<
  string,
  {
    selected: boolean;
    quantity: number;
  }
>;

type ModelCandidate = {
  label: string;
  maker: string;
  modelName: string;
  modelNumber: string;
};

type AndroidRepairDefinition = {
  key: keyof typeof ANDROID_FIXED_REPAIR_PRICES | "screen";
  label: string;
  priceKey?: keyof AndroidPriceMasterItem;
  statusKey: keyof AndroidPriceMasterItem;
};

type DynamicAndroidRepairDefinition = {
  key: string;
  label: string;
  repairItemName: string;
  standardPrice: number | string;
  note: string;
  receptionStatus: string;
};

type NormalizedOption = {
  key: string;
  label: string;
  price: number;
};

type AndroidRepairMenuItem = {
  key: string;
  label: string;
  price: number | null;
  priceLabel: string;
  supportStatus: string;
  isUnsupported: boolean;
  isPriceIncludedInTotal: boolean;
  note: string;
  guidanceText: string;
  powerFailureEstimateMinimum?: number;
};

type EstimateQuote = {
  modelName: string;
  modelNumber: string;
  symptom: string;
  repairType: string;
  price: number | string | undefined;
  status: string;
  note: string;
  receptionStatus: string;
};

type SwitchEstimateLine = {
  unitId: string;
  modelName: string;
  unitIndex: number;
  originalOrder: number;
  source: "symptom" | "repairType";
  symptom?: string;
  repairType: string;
  price: number | string;
  lineTotal?: number;
  isVariablePrice: boolean;
  isSimultaneousRepairPrice?: boolean;
  status: string;
  note: string;
  receptionStatus: string;
};

type SwitchOptionLine = {
  label: string;
  price: number;
  quantity: number;
  lineTotal: number;
};

type ConfirmedEstimate = {
  form: FormState;
  quote: EstimateQuote;
  estimateText: string;
  customerMessage: string;
  reservationCopy: string;
  switchStockCheck?: SwitchStockCheckByLine;
  selectedOptions: NormalizedOption[];
  switchRepairLines: SwitchEstimateLine[];
  switchOptionLines: SwitchOptionLine[];
  unsupportedAndroidRepairLabels: string[];
};

const categories: InquiryCategory[] = ["Android", "Switch"];
const orderStatuses: OrderStatus[] = ["受注", "検討"];
const adminReportTypes = [
  "価格マスター修正",
  "機種追加依頼",
  "修理内容追加依頼",
  "症状追加依頼",
  "表示不具合",
  "その他",
] as const;
const masterManagementTabs: MasterManagementTab[] = ["Android", "Switch", "修理メニュー"];
const androidMasterModes: AndroidMasterMode[] = ["新規機種追加", "既存データ変更"];
const switchMasterModes: SwitchMasterMode[] = ["新規項目追加", "既存データ変更"];
const repairItemModes: RepairItemMode[] = ["修理メニュー追加", "既存メニュー変更"];
const androidMasterModeLabels: Record<AndroidMasterMode, string> = {
  新規機種追加: "機種を追加",
  既存データ変更: "登録済み機種を変更",
};
const switchMasterModeLabels: Record<SwitchMasterMode, string> = {
  新規項目追加: "修理メニューを追加",
  既存データ変更: "登録済みメニューを変更",
};
const repairItemModeLabels: Record<RepairItemMode, string> = {
  修理メニュー追加: "修理メニューを追加",
  既存メニュー変更: "既存メニューを変更",
};
const supportStatusOptions = ["店舗対応可", "要確認", "委託対応", "非対応"];
const ANDROID_BOARD_REPAIR = {
  price: 33000,
  priceLabel: "税込 33,000円〜",
  leadTime: "1週間〜10日程度",
} as const;
const ANDROID_POWER_FAILURE_MENU_KEY = "android-power-failure";
const ANDROID_DONOR_REPAIR_MENU_KEY = "android-donor-repair";
const ANDROID_WATER_DAMAGE_GUIDANCE = [
  "水没洗浄は税込 9,680円です。",
  "こちらは分解・内部洗浄・腐食確認・乾燥作業の基本料金となり、復旧可否に関わらず発生します。",
  "洗浄後に部品交換や基板修理が必要な場合は、別途費用が発生します。",
  "水没端末は復旧を保証するものではなく、状態によっては修理不可となる場合があります。",
  "作業時間は端末の状態によって異なるため、確認後にご案内いたします。",
].join("\n");
const ANDROID_DONOR_REPAIR_GUIDANCE = [
  "ドナー修理は、同型または互換性のある端末から必要な部品を移植して修理を行う作業です。",
  "", "■基本作業料金", "税込 15,000円",
  "", "■ドナー端末代", "機種や状態、在庫状況によって異なるため、確認後にご案内いたします。",
  "", "お支払いいただく修理料金は、基本作業料金とドナー端末代の合計となります。",
  "", "ドナー端末の在庫がない場合は、取り寄せが必要となります。",
  "", "■ドナー端末の納期", "ドナー端末の取り寄せには、3日〜1週間程度かかります。",
  "", "■作業時間", "ドナー端末入荷後、3時間程度で作業完了予定です。",
  "", "移植する部品の内容や端末の故障状態によっては、ドナー端末を用意しても修理できない場合があります。",
  "", "正式な修理内容・料金・納期は、必要なドナー端末と修理端末の状態を確認したうえでご案内いたします。",
  "", "データは基本そのままで作業しますが、データの保証はできかねるため、操作可能な場合は事前のバックアップをお願いいたします。",
].join("\n");
const manualPriceStatusOption = "料金を手動設定";
const androidAdditionalRepairStatusOptions = [
  "店舗対応可",
  "要確認",
  "外注必要",
  "非対応",
  manualPriceStatusOption,
];
const androidPriceSupportSettingHelpText =
  "価格・対応設定では、店頭対応可・要確認・外注必要・非対応・料金手動設定を選択できます。";
const manualPriceStoredStatus = "料金手動設定";
const manualPriceStoredPrefix = "料金手動設定:";
const androidStatusPriceSeparator = ":";
const receptionStatusOptions = ["受付可", "要確認", "受付停止"];
const repairItemPriceTypes = ["固定価格", "機種別価格", "要相談", "非対応"];
const repairItemTargetCategories = [
  "Android全般",
  "Switch本体",
  "Joy-Con",
  "Proコントローラー",
  "Joy-Con 2",
  "全体",
];
const preferredAndroidMakers = [
  "Google Pixel",
  "Xperia",
  "Galaxy",
  "AQUOS",
  "OPPO",
  "Xiaomi",
  "HUAWEI",
  "その他",
];

const ANDROID_FIXED_REPAIR_PRICES = {
  battery: 11000,
  chargePort: 16500,
  cameraLens: 11000,
  sleepButton: 15000,
  volumeButton: 15000,
} as const;

const ANDROID_REPAIR_GUIDE = {
  screen: {
    partsLeadTime: "2〜3日程度",
    workTime: "60分〜120分程度",
  },
  battery: {
    partsLeadTime: "2〜3日程度",
    workTime: "60分〜120分程度",
  },
  chargePort: {
    partsLeadTime: "3〜7日程度",
    workTime: "60分〜90分程度",
  },
  cameraLens: {
    partsLeadTime: "3〜7日程度",
    workTime: "30分〜60分程度",
  },
  sleepButton: {
    partsLeadTime: "3〜7日程度",
    workTime: "60分〜120分程度",
  },
  volumeButton: {
    partsLeadTime: "3〜7日程度",
    workTime: "60分〜120分程度",
  },
} as const;

const ANDROID_OUTSOURCE_GUIDE = {
  leadTime: "1〜2週間程度",
} as const;

const ANDROID_OUTSOURCE_REPAIR_PRICE = 33000;
const OTHER_ANDROID_MANUFACTURER = "その他";
const OTHER_ANDROID_MODEL_FALLBACK = "その他メーカー端末";
const ANDROID_MODEL_CANDIDATE_LIMIT = 30;
const OTHER_ANDROID_SCREEN_PRICE = "パーツ原価 + 税込 11,000円";
const OTHER_ANDROID_SCREEN_NOTE = "パーツ原価を確認してください。";
const OTHER_ANDROID_CONFIRM_NOTE = "対応可否と部品状況を確認してください。";
const ANDROID_DATA_GUIDE =
  "データは基本そのままで作業できますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。";
const ANDROID_OUTSOURCE_DATA_GUIDE =
  "データは基本そのままで作業を進めますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。";
const ANDROID_CONDITION_CHANGE_GUIDE =
  "端末の状態によっては、作業内容やお時間が変動する場合がございます。";
const SWITCH_CONDITION_CHANGE_GUIDE =
  "端末の状態や部品状況によっては、作業内容・金額・お預かり期間が変動する場合がございます。";
const SWITCH_WORK_TIME_OPTIONS: SwitchWorkTime[] = [
  "30分",
  "60分",
  "90分",
  "120分",
  "要確認",
];

const AUTH_STORAGE_KEY = "repairQuoteAuth";

const SWITCH_BODY_OPTIONS = [
  {
    key: "glassFilm",
    label: "ガラスフィルム",
    price: 1000,
  },
  {
    key: "batterySet",
    label: "バッテリー交換",
    price: 2900,
  },
  {
    key: "cleaningGrease",
    label: "内部クリーニングと冷却グリスの塗り直し",
    price: 3300,
  },
] as const satisfies readonly NormalizedOption[];

const SWITCH_BODY_MODEL_NAMES = new Set([
  "Nintendo Switch",
  "Nintendo Switch Lite",
  "Nintendo Switch 有機EL",
  "Nintendo Switch 2",
  "Switch",
  "Switch Lite",
  "Switch 有機EL",
  "Switch 2",
]);

const SWITCH_CONTROLLER_ADDITIONAL_REPAIR_PRICE = 1000;

const androidMakerAliases: Record<string, string[]> = {
  Galaxy: ["Galaxy", "銀河"],
  AQUOS: ["AQUOS", "アクオス"],
  Xiaomi: ["Xiaomi", "シャオミ"],
  HUAWEI: ["HUAWEI", "Huawei", "ファーウェイ"],
  銀河: ["銀河", "Galaxy"],
  アクオス: ["アクオス", "AQUOS"],
  シャオミ: ["シャオミ", "Xiaomi"],
  ファーウェイ: ["ファーウェイ", "Huawei", "HUAWEI"],
};

const androidRepairDefinitions: AndroidRepairDefinition[] = [
  {
    key: "screen",
    label: "画面修理",
    priceKey: "screenPrice",
    statusKey: "screenStatus",
  },
  { key: "battery", label: "バッテリー交換", statusKey: "batteryStatus" },
  { key: "chargePort", label: "充電口修理", statusKey: "chargePortStatus" },
  {
    key: "cameraLens",
    label: "リアカメラレンズ修理",
    statusKey: "cameraLensStatus",
  },
  {
    key: "sleepButton",
    label: "スリープボタン修理",
    statusKey: "sleepButtonStatus",
  },
  { key: "volumeButton", label: "音量ボタン修理", statusKey: "volumeButtonStatus" },
];

const androidBasicRepairAliases = {
  "画面修理": ["画面修理"],
  "バッテリー交換": ["バッテリー交換", "バッテリー修理"],
  "充電口修理": ["充電口修理", "充電口交換", "充電不良修理"],
  "リアカメラレンズ修理": [
    "リアカメラレンズ修理",
    "カメラレンズ修理",
    "カメラレンズ交換",
    "リアカメラレンズ交換",
  ],
  "スリープボタン修理": ["スリープボタン修理", "電源ボタン修理"],
  "音量ボタン修理": ["音量ボタン修理", "ボリュームボタン修理"],
  "スピーカー修理": [
    "スピーカー修理",
    "スピーカー交換",
    "スピーカー交換修理",
  ],
} as const;

const normalizedAndroidBasicRepairAliases = new Map(
  Object.entries(androidBasicRepairAliases).flatMap(([label, aliases]) =>
    aliases.map((alias) => [normalizeRepairItemName(alias), label] as const),
  ),
);

function createInitialForm(category: InquiryCategory = "Android"): FormState {
  return {
    category,
    maker: category === "Switch" ? "Nintendo" : "",
    modelName: "",
    modelNumber: "",
    repairType: "",
    symptom: "",
    switchSelectedModels: [],
    switchUnitInputs: [],
    switchOptionSelections: {},
    orderStatus: "検討",
    selectedOptionKeys: [],
    selectedAndroidRepairKeys: [],
  };
}

const initialForm: FormState = createInitialForm();

export default function InquiryApp({ initialData }: { initialData: InitialData }) {
  const [masterData, setMasterData] = useState(initialData);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [authNotice, setAuthNotice] = useState("");
  const [loginEmailInput, setLoginEmailInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [modelSearch, setModelSearch] = useState("");
  const [selectedAndroidModelLabel, setSelectedAndroidModelLabel] = useState("");
  const [confirmedEstimate, setConfirmedEstimate] =
    useState<ConfirmedEstimate | null>(null);
  const [copiedKey, setCopiedKey] = useState("");
  const [saveFeedback, setSaveFeedback] = useState<SaveFeedback | null>(null);
  const [adminReportOpen, setAdminReportOpen] = useState(false);
  const [adminReportForm, setAdminReportForm] = useState<AdminReportForm>(() =>
    createEmptyAdminReportForm(initialForm.category),
  );
  const [adminReportFeedback, setAdminReportFeedback] =
    useState<AdminReportFeedback | null>(null);
  const [adminReportSending, setAdminReportSending] = useState(false);
  const [masterManagementOpen, setMasterManagementOpen] = useState(false);
  const [isUsageGuideOpen, setIsUsageGuideOpen] = useState(false);
  const [usageGuideTab, setUsageGuideTab] =
    useState<UsageGuideTab>("common");
  const [editingSwitchUnitId, setEditingSwitchUnitId] = useState<string | null>(
    null,
  );
  const [isSwitchOptionsOpen, setIsSwitchOptionsOpen] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] =
    useState<OpenDropdownKey>(null);
  const [validationError, setValidationError] = useState("");
  const resultRef = useRef<HTMLElement | null>(null);

  const isSwitch = form.category === "Switch";
  const isOtherAndroidManufacturer =
    !isSwitch && form.maker === OTHER_ANDROID_MANUFACTURER;
  const title = isSwitch ? "Switch修理見積り" : "Android修理見積り";

  const androidRows = useMemo(
    () =>
      masterData.priceMaster
        .filter((item) => !isInactiveReceptionStatus(item.receptionStatus))
        .sort(compareSortOrder),
    [masterData.priceMaster],
  );

  const switchRows = useMemo(
    () =>
      masterData.switchEstimateMaster
        .filter((item) => !isInactiveReceptionStatus(item.receptionStatus))
        .sort(compareSortOrder),
    [masterData.switchEstimateMaster],
  );

  const androidOptions = useMemo(
    () => normalizeOptions(masterData.optionMaster),
    [masterData.optionMaster],
  );
  const switchBodyQuantity = getSwitchBodyQuantity(form.switchSelectedModels);
  const showSwitchOptions = isSwitch && switchBodyQuantity > 0;
  const switchBodyOptions = showSwitchOptions ? [...SWITCH_BODY_OPTIONS] : [];
  const switchEstimateStepNumber = showSwitchOptions ? 4 : 3;

  const selectedOptions = useMemo(
    () => getSelectedOptionsForForm(form, androidOptions),
    [androidOptions, form],
  );

  const optionTotal = selectedOptions.reduce(
    (total, option) => total + option.price,
    0,
  );

  const androidMakers = preferredAndroidMakers;

  const androidCandidates = useMemo(() => {
    const query = normalizeAndroidModelSearchText(modelSearch);
    const queryTokens = getAndroidModelSearchTokens(modelSearch);
    const isSearching = Boolean(modelSearch.trim());
    const rows = androidRows.filter((item) => {
      const matchesMaker =
        isSearching ||
        !form.maker ||
        androidMakerMatches(form.maker, item.manufacturer);
      const target = createAndroidModelSearchTarget(
        [
          item.manufacturer,
          item.modelName,
          item.modelNumber,
          normalizeModelName(item.manufacturer),
          normalizeModelName(item.modelName),
          normalizeModelName(item.modelNumber),
        ].join(" "),
      );

      return (
        matchesMaker &&
        (!query ||
          target.includes(query) ||
          queryTokens.every((token) => target.includes(token)))
      );
    });

    return uniqueModelCandidates(rows);
  }, [androidRows, form.maker, modelSearch]);

  const visibleAndroidCandidates = androidCandidates.slice(
    0,
    ANDROID_MODEL_CANDIDATE_LIMIT,
  );
  const isAndroidCandidateLimited =
    androidCandidates.length > visibleAndroidCandidates.length;

  const selectedAndroidModel = useMemo(
    () =>
      androidRows.find(
        (item) =>
          androidMakerMatches(form.maker, item.manufacturer) &&
          item.modelName === form.modelName &&
          (!form.modelNumber || item.modelNumber === form.modelNumber),
      ),
    [androidRows, form.maker, form.modelName, form.modelNumber],
  );

  const selectedAndroidCandidate = useMemo(() => {
    if (!form.modelName || isOtherAndroidManufacturer) {
      return undefined;
    }

    const item = selectedAndroidModel;

    return item
      ? {
          label: `${item.modelName} / ${item.modelNumber}`.trim(),
          maker: item.manufacturer,
          modelName: item.modelName,
          modelNumber: item.modelNumber,
        }
      : undefined;
  }, [form.modelName, isOtherAndroidManufacturer, selectedAndroidModel]);

  const androidSelectCandidates = useMemo(() => {
    if (
      !selectedAndroidCandidate ||
      androidCandidates.some(
        (candidate) => candidate.label === selectedAndroidCandidate.label,
      )
    ) {
      return androidCandidates;
    }

    return [selectedAndroidCandidate, ...androidCandidates];
  }, [androidCandidates, selectedAndroidCandidate]);

  const androidRepairMenus = useMemo(() => {
    if (!isOtherAndroidManufacturer && !selectedAndroidModel) return [];
    return createAndroidRepairMenus({
      selectedAndroidModel,
      isOtherManufacturer: isOtherAndroidManufacturer,
      repairItemMaster: masterData.repairItemMaster,
      androidModelRepairSettings: masterData.androidModelRepairSettings,
    });
  }, [
    isOtherAndroidManufacturer,
    masterData.androidModelRepairSettings,
    masterData.repairItemMaster,
    selectedAndroidModel,
  ]);

  const switchModels = useMemo(
    () => uniqueValues(switchRows.map((item) => item.modelName)),
    [switchRows],
  );
  const availableSwitchModels = useMemo(() => {
    const selectedModelNames = new Set(
      form.switchSelectedModels.map((item) => item.modelName),
    );

    return switchModels.filter((modelName) => !selectedModelNames.has(modelName));
  }, [form.switchSelectedModels, switchModels]);

  const selectedAndroidRepairMenus = useMemo(
    () => androidRepairMenus.filter((menu) => form.selectedAndroidRepairKeys.includes(menu.key)),
    [androidRepairMenus, form.selectedAndroidRepairKeys],
  );

  const draftEstimate = useMemo(
    () =>
      createEstimateResult({
        form,
        selectedOptions,
        selectedAndroidModel,
        switchRows,
        androidRepairMenus: selectedAndroidRepairMenus,
      }),
    [
      selectedAndroidRepairMenus,
      form,
      optionTotal,
      selectedAndroidModel,
      selectedOptions,
      switchRows,
    ],
  );

  const initialEstimate = useMemo(
    () =>
      createEstimateResult({
        form: createInitialForm(form.category),
        selectedOptions: [],
        selectedAndroidModel: undefined,
        switchRows: [],
        androidRepairMenus: [],
      }),
    [form.category],
  );

  const displayEstimate = confirmedEstimate || initialEstimate;
  const hasUnconfirmedChanges =
    confirmedEstimate !== null &&
    !estimateInputMatches(form, confirmedEstimate.form);

  const switchUnitIdsSignature = form.switchUnitInputs
    .map((unit) => unit.unitId)
    .join("|");
  const completedSwitchUnitCount = form.switchUnitInputs.filter((unit) =>
    isSwitchUnitInputComplete(unit),
  ).length;
  const selectedSwitchOptionSummary = createSwitchOptionSummary(
    form.switchOptionSelections,
  );

  useEffect(() => {
    let isMounted = true;

    async function verifyStoredAuth() {
      const storedAuth = readStoredAuthUser();

      if (!storedAuth) {
        if (isMounted) {
          setAuthChecking(false);
        }
        return;
      }

      try {
        const users = await fetchUserMaster();
        const latestUser = findUserByEmail(users, storedAuth.email);

        if (!isMounted) {
          return;
        }

        if (!latestUser) {
          removeStoredAuthUser();
          setAuthUser(null);
          setAuthNotice(
            "このメールアドレスは現在登録されていません。管理者へ確認してください。",
          );
          setAuthChecking(false);
          return;
        }

        persistAuthUser(latestUser);
        setAuthUser(latestUser);
        setAuthChecking(false);
      } catch (error) {
        console.error(error);

        if (!isMounted) {
          return;
        }

        setAuthUser(null);
        setAuthNotice(
          "ログイン情報を確認できませんでした。時間をおいて再度お試しください。",
        );
        setAuthChecking(false);
      }
    }

    verifyStoredAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const unitIds = new Set(form.switchUnitInputs.map((unit) => unit.unitId));

    setOpenDropdownKey((current) => {
      if (!current) {
        return current;
      }

      const unitId = current.split(":")[0];

      return unitIds.has(unitId) ? current : null;
    });
    setEditingSwitchUnitId((current) => {
      if (form.switchUnitInputs.length === 0) {
        return null;
      }

      if (current && unitIds.has(current)) {
        return current;
      }

      return (
        form.switchUnitInputs.find((unit) => !isSwitchUnitInputComplete(unit))
          ?.unitId ?? null
      );
    });
  }, [switchUnitIdsSignature, form.switchUnitInputs]);

  const storeName = authUser?.storeName || "未設定";
  const loginEmail = authUser?.email || "未設定";
  const role = authUser?.role || "未設定";
  const isAdmin = authUser?.role === "admin";
  const reportSourceEstimate =
    confirmedEstimate && !hasUnconfirmedChanges ? confirmedEstimate : draftEstimate;

  async function submitLogin() {
    const normalizedEmail = normalizeEmail(loginEmailInput);

    if (!normalizedEmail) {
      setLoginError("このメールアドレスは登録されていません。管理者へ確認してください。");
      return;
    }

    setLoginLoading(true);
    setLoginError("");
    setAuthNotice("");

    try {
      const users = await fetchUserMaster();
      const user = findUserByEmail(users, normalizedEmail);

      if (!user) {
        setLoginError(
          "このメールアドレスは登録されていません。管理者へ確認してください。",
        );
        return;
      }

      persistAuthUser(user);
      setAuthUser(user);
      setLoginEmailInput("");
      setLoginError("");
    } catch (error) {
      console.error(error);
      setLoginError(
        "ログイン情報を確認できませんでした。時間をおいて再度お試しください。",
      );
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    removeStoredAuthUser();
    setAuthUser(null);
    setAuthNotice("");
    setLoginError("");
    setLoginEmailInput("");
    setAdminReportOpen(false);
    setMasterManagementOpen(false);
  }

  function openAdminReport() {
    setAdminReportForm(createAdminReportInitialForm(form, reportSourceEstimate));
    setAdminReportFeedback(null);
    setAdminReportSending(false);
    setAdminReportOpen(true);
  }

  async function refreshMasterData() {
    const nextData = await fetchInitialData();
    setMasterData(nextData);
  }

  function closeAdminReport() {
    if (adminReportSending) {
      return;
    }

    setAdminReportOpen(false);
  }

  async function submitAdminReport() {
    if (!adminReportForm.message.trim()) {
      setAdminReportFeedback({
        tone: "error",
        message: "報告内容を入力してください。",
      });
      return;
    }

    setAdminReportSending(true);
    setAdminReportFeedback({
      tone: "muted",
      message: "送信中...",
    });

    try {
      await sendAdminReport({
        storeName,
        loginEmail,
        role,
        reportType: adminReportForm.reportType,
        category: adminReportForm.category,
        targetModel: adminReportForm.targetModel,
        targetRepairOrSymptom: adminReportForm.targetRepairOrSymptom,
        message: adminReportForm.message.trim(),
        currentEstimateSummary:
          createAdminReportEstimateSummary(reportSourceEstimate),
        createdAt: new Date().toISOString(),
      });
      setAdminReportForm((current) => ({ ...current, message: "" }));
      setAdminReportFeedback({
        tone: "success",
        message: "管理者へ報告しました。",
      });
      window.setTimeout(() => {
        setAdminReportOpen(false);
        setAdminReportFeedback(null);
      }, 1000);
    } catch (error) {
      console.error(error);
      setAdminReportFeedback({
        tone: "error",
        message:
          "報告の送信に失敗しました。通信状況を確認して再度お試しください。",
      });
    } finally {
      setAdminReportSending(false);
    }
  }

  function updateCategory(category: InquiryCategory) {
    setModelSearch("");
    setSelectedAndroidModelLabel("");
    setEditingSwitchUnitId(null);
    setIsSwitchOptionsOpen(false);
    setOpenDropdownKey(null);
    setValidationError("");
    setForm(createInitialForm(category));
  }

  function updateAndroidMaker(maker: string) {
    setSelectedAndroidModelLabel("");
    setValidationError("");
    setForm((current) => ({
      ...current,
      maker,
      modelName: "",
      modelNumber: "",
      repairType: "",
      symptom: "",
      selectedOptionKeys: [],
      selectedAndroidRepairKeys: [],
    }));
  }

  function selectAndroidModel(candidate: ModelCandidate | undefined) {
    if (!candidate) {
      return;
    }

    setModelSearch("");
    setSelectedAndroidModelLabel(candidate.label);
    setValidationError("");
    setForm((current) => ({
      ...current,
      maker: candidate.maker,
      modelName: candidate.modelName,
      modelNumber: candidate.modelNumber,
      repairType: "",
      symptom: "",
      selectedOptionKeys: [],
      selectedAndroidRepairKeys: [],
    }));
  }

  function updateAndroidModel(value: string) {
    selectAndroidModel(androidSelectCandidates.find((item) => item.label === value));
  }

  function clearAndroidModelSelection() {
    setSelectedAndroidModelLabel("");
    setValidationError("");
    setForm((current) => ({
      ...current,
      modelName: "",
      modelNumber: "",
      repairType: "",
      symptom: "",
      selectedOptionKeys: [],
      selectedAndroidRepairKeys: [],
    }));
  }

  function updateOtherAndroidModel(modelName: string) {
    setValidationError("");
    setForm((current) => ({
      ...current,
      modelName,
      modelNumber: "",
      repairType: "",
      selectedAndroidRepairKeys: [],
    }));
  }

  function toggleAndroidRepairMenu(menuKey: string) {
    setValidationError("");
    setForm((current) => {
      const isPowerFailureMenu = menuKey === ANDROID_POWER_FAILURE_MENU_KEY;
      const isSelected = current.selectedAndroidRepairKeys.includes(menuKey);
      const selectedAndroidRepairKeys = isPowerFailureMenu
        ? isSelected
          ? []
          : [ANDROID_POWER_FAILURE_MENU_KEY]
        : toggleStringValue(
            current.selectedAndroidRepairKeys.filter(
              (key) => key !== ANDROID_POWER_FAILURE_MENU_KEY,
            ),
            menuKey,
          );
      const repairType = androidRepairMenus
        .filter((menu) => selectedAndroidRepairKeys.includes(menu.key))
        .map((menu) => menu.label)
        .join("、");
      return { ...current, selectedAndroidRepairKeys, repairType };
    });
  }

  function addSwitchModel(modelName: string) {
    if (!modelName) {
      return;
    }

    setValidationError("");
    setOpenDropdownKey(null);
    setForm((current) => ({
      ...cleanupSwitchSelections(
        {
          ...current,
          maker: "Nintendo",
          modelName: "",
          modelNumber: "",
          repairType: "",
          symptom: "",
          switchSelectedModels: addSwitchSelectedModel(
            current.switchSelectedModels,
            modelName,
            switchRows,
          ),
        },
        switchRows,
      ),
    }));
  }

  function removeSwitchModel(modelName: string) {
    setValidationError("");
    setOpenDropdownKey(null);
    setEditingSwitchUnitId((current) =>
      current?.startsWith(`${modelName}__`) ? null : current,
    );
    setForm((current) => ({
      ...cleanupSwitchSelections(
        {
          ...current,
          switchSelectedModels: current.switchSelectedModels.filter(
            (item) => item.modelName !== modelName,
          ),
          switchUnitInputs: current.switchUnitInputs.filter(
            (unit) => unit.modelName !== modelName,
          ),
        },
        switchRows,
      ),
    }));
  }

  function updateSwitchQuantity(modelName: string, quantity: number) {
    setValidationError("");
    setForm((current) => ({
      ...cleanupSwitchSelections(
        {
          ...current,
          switchSelectedModels: current.switchSelectedModels.map((item) =>
            item.modelName === modelName
              ? { ...item, quantity: clampSwitchQuantity(quantity) }
              : item,
          ),
        },
        switchRows,
      ),
    }));
  }

  function toggleSwitchUnitSymptom(unitId: string, symptom: string) {
    setValidationError("");
    setForm((current) => ({
      ...current,
      switchUnitInputs: current.switchUnitInputs.map((unit) =>
        unit.unitId === unitId
          ? cleanupSwitchUnitDuplicateRepairTypes(
              {
                ...unit,
                selectedSymptoms: toggleStringValue(unit.selectedSymptoms, symptom),
              },
              switchRows,
            )
          : unit,
      ),
      symptom: "",
      repairType: "",
    }));
  }

  function toggleSwitchUnitRepairType(unitId: string, repairType: string) {
    setValidationError("");
    setForm((current) => ({
      ...current,
      switchUnitInputs: current.switchUnitInputs.map((unit) =>
        unit.unitId === unitId &&
        !isSwitchRepairTypeSelectedFromSymptoms(unit, repairType, switchRows)
          ? {
              ...unit,
              selectedRepairTypes: toggleStringValue(
                unit.selectedRepairTypes,
                repairType,
              ),
            }
          : unit,
      ),
      symptom: "",
      repairType: "",
    }));
  }

  function toggleOption(optionKey: string) {
    setValidationError("");
    setForm((current) => ({
      ...current,
      ...(current.category === "Switch"
        ? {
            switchOptionSelections: toggleSwitchOptionSelection(
              current.switchOptionSelections,
              optionKey,
            ),
          }
        : {
            selectedOptionKeys: current.selectedOptionKeys.includes(optionKey)
              ? current.selectedOptionKeys.filter((key) => key !== optionKey)
              : [...current.selectedOptionKeys, optionKey],
          }),
    }));
  }

  function updateSwitchOptionQuantity(optionKey: string, quantity: number) {
    setValidationError("");
    setForm((current) => {
      const maxQuantity = Math.max(1, getSwitchBodyQuantity(current.switchSelectedModels));

      return {
        ...current,
        switchOptionSelections: {
          ...current.switchOptionSelections,
          [optionKey]: {
            selected: current.switchOptionSelections[optionKey]?.selected ?? false,
            quantity: clampSwitchOptionQuantity(quantity, maxQuantity),
          },
        },
      };
    });
  }

  async function copyText(key: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(""), 1600);
  }

  function createEstimate() {
    const error = validateEstimateForm(form);
    if (error) {
      setValidationError(error);
      return;
    }

    const estimateForm =
      form.category === "Switch"
        ? cleanupSwitchDuplicateRepairTypeSelections(form, switchRows)
        : form;
    const estimateResult = createEstimateResult({
      form: estimateForm,
      selectedOptions,
      selectedAndroidModel,
      switchRows,
      androidRepairMenus: selectedAndroidRepairMenus,
    });

    setValidationError("");
    if (estimateForm !== form) {
      setForm(estimateForm);
    }
    setConfirmedEstimate(estimateResult);
    setSaveFeedback(null);
    window.setTimeout(() => {
      resultRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
  }

  function applySwitchStockCheck(stockCheck: SwitchStockCheckByLine) {
    setConfirmedEstimate((current) => {
      if (!current || current.form.category !== "Switch") {
        return current;
      }

      const nextStockCheck = normalizeSwitchStockCheckByLine(
        stockCheck,
        current.switchRepairLines,
      );
      const switchTotal = sumSwitchLineTotals(
        current.switchRepairLines,
        current.switchOptionLines,
      );
      const switchHasVariable = current.switchRepairLines.some(
        (line) => line.isVariablePrice,
      );
      const baseCustomerMessage = createSwitchCustomerMessage({
        form: current.form,
        repairLines: current.switchRepairLines,
        optionLines: current.switchOptionLines,
        total: switchTotal,
        hasVariablePrice: switchHasVariable,
      });

      return {
        ...current,
        switchStockCheck: nextStockCheck,
        customerMessage: appendSwitchStockCheckMessage(
          baseCustomerMessage,
          nextStockCheck,
          current.switchRepairLines,
          current.form.switchSelectedModels,
        ),
        reservationCopy: createReservationCopy({
          form: current.form,
          quote: current.quote,
          estimateText: current.estimateText,
          selectedOptions: current.selectedOptions,
          switchRepairLines: current.switchRepairLines,
          switchOptionLines: current.switchOptionLines,
          switchStockCheck: nextStockCheck,
        }),
      };
    });
  }

  async function updateOrderStatus(orderStatus: OrderStatus) {
    if (!confirmedEstimate || hasUnconfirmedChanges) {
      return;
    }

    setForm((current) => ({ ...current, orderStatus }));
    setConfirmedEstimate((current) => {
      if (!current) {
        return current;
      }

      const nextForm = { ...current.form, orderStatus };

      return {
        ...current,
        form: nextForm,
        reservationCopy: createReservationCopy({
          form: nextForm,
          quote: current.quote,
          estimateText: current.estimateText,
          selectedOptions: getSelectedOptionsForForm(nextForm, androidOptions),
          switchRepairLines: current.switchRepairLines,
          switchOptionLines: current.switchOptionLines,
          switchStockCheck: current.switchStockCheck,
        }),
      };
    });
    setSaveFeedback({
      tone: "muted",
      message: "保存中...",
      savingStatus: orderStatus,
    });

    try {
      await saveInquiry({
        storeName,
        loginEmail,
        role,
        modelName: confirmedEstimate.quote.modelName,
        repairType: confirmedEstimate.quote.repairType,
        status: orderStatus,
      });
      setSaveFeedback({
        tone: "success",
        message: `${orderStatus}として保存しました。`,
      });
    } catch (error) {
      console.error(error);
      setSaveFeedback({
        tone: "error",
        message:
          "保存に失敗しました。通信状況を確認して再度お試しください。",
      });
    }
  }

  function resetForm() {
    const currentCategory = form.category;
    setModelSearch("");
    setSelectedAndroidModelLabel("");
    setEditingSwitchUnitId(null);
    setIsSwitchOptionsOpen(false);
    setOpenDropdownKey(null);
    setForm(createInitialForm(currentCategory));
    setConfirmedEstimate(null);
    setSaveFeedback(null);
    setValidationError("");
    setAdminReportOpen(false);
    setAdminReportFeedback(null);
    setAdminReportSending(false);
    setAdminReportForm(createEmptyAdminReportForm(currentCategory));
  }

  if (authChecking) {
    return <AuthLoadingScreen message="ログイン情報を確認しています..." />;
  }

  if (!authUser) {
    return (
      <LoginScreen
        email={loginEmailInput}
        notice={authNotice}
        error={loginError}
        loading={loginLoading}
        onEmailChange={setLoginEmailInput}
        onSubmit={submitLogin}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="border-b border-slate-200 pb-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-600">修理見積もり</p>
              <h1 className="mt-1 text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                {title}
              </h1>
            </div>
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-600">
              <span className="min-w-0 break-words font-semibold text-slate-800">
                {storeName}
              </span>
              <span className="min-w-0 break-words">{role}</span>
              <span className="min-w-0 break-all">{loginEmail}</span>
              <HeaderButton
                label="使い方"
                onClick={() => {
                  setUsageGuideTab("common");
                  setIsUsageGuideOpen(true);
                }}
              />
              {isAdmin ? (
                <HeaderButton
                  label="マスター管理"
                  onClick={() => setMasterManagementOpen(true)}
                />
              ) : null}
              <HeaderButton label="管理者へ報告" onClick={openAdminReport} />
              <HeaderButton label="ログアウト" onClick={logout} />
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex min-w-0 flex-col gap-3">
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-950">見積条件</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isSwitch
                      ? "機種と台数、端末ごとの症状または修理内容を順番に入力してください。"
                      : "メーカー、機種、修理内容を順番に選択してください。"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="min-h-11 shrink-0 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  リセットする
                </button>
              </div>
              <SegmentedControl
                options={categories}
                value={form.category}
                onChange={updateCategory}
              />
            </div>

            <div className="grid min-w-0 gap-6">
              {isSwitch ? (
                <>
                  <Field
                    label="機種と台数を選択"
                    step="STEP 1"
                    requirement="必須"
                    completed={form.switchSelectedModels.length > 0}
                  >
                    <SwitchModelSelector
                      availableModels={availableSwitchModels}
                      selectedModels={form.switchSelectedModels}
                      onAdd={addSwitchModel}
                      onRemove={removeSwitchModel}
                      onQuantityChange={updateSwitchQuantity}
                    />
                  </Field>

                  <Field
                    label="端末ごとに症状または修理内容を選択"
                    step="STEP 2"
                    requirement="必須"
                    completed={
                      form.switchUnitInputs.length > 0 &&
                      completedSwitchUnitCount === form.switchUnitInputs.length
                    }
                    guide={
                      form.switchSelectedModels.length === 0
                        ? "機種を選択すると端末ごとの入力欄が表示されます。"
                        : undefined
                    }
                  >
                    <div className="grid min-w-0 gap-4">
                      {form.switchUnitInputs.length > 0 ? (
                        <>
                          <div className="min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                            <p>
                              選択端末：{form.switchUnitInputs.length}台 / 入力済み：
                              {completedSwitchUnitCount}台 /{" "}
                              {form.switchUnitInputs.length}台
                            </p>
                            {completedSwitchUnitCount <
                            form.switchUnitInputs.length ? (
                              <p className="text-amber-700">
                                未入力の端末があります：
                                {form.switchUnitInputs.length -
                                  completedSwitchUnitCount}
                                台
                              </p>
                            ) : (
                              <p className="text-emerald-700">
                                すべての端末が入力済みです。
                              </p>
                            )}
                          </div>
                          {form.switchUnitInputs.map((unit, unitIndex) => {
                            const unitRows = switchRows.filter(
                              (item) => item.modelName === unit.modelName,
                            );
                            const symptoms = uniqueValues(
                              unitRows.map((item) => item.symptom),
                            );
                            const repairTypes = uniqueValues(
                              unitRows.map((item) => item.estimatedRepairType),
                            );
                            const disabledRepairTypes = repairTypes.filter(
                              (repairType) =>
                                isSwitchRepairTypeSelectedFromSymptoms(
                                  unit,
                                  repairType,
                                  switchRows,
                                ),
                            );
                            const isEditing =
                              editingSwitchUnitId === unit.unitId;

                            return (
                              <SwitchUnitInputCard
                                key={unit.unitId}
                                unit={unit}
                                unitNumber={unitIndex + 1}
                                symptomOptions={symptoms}
                                repairTypeOptions={repairTypes}
                                disabledRepairTypeOptions={disabledRepairTypes}
                                isEditing={isEditing}
                                symptomDropdownOpen={
                                  openDropdownKey === `${unit.unitId}:symptoms`
                                }
                                repairTypeDropdownOpen={
                                  openDropdownKey === `${unit.unitId}:repairTypes`
                                }
                                onEdit={() => {
                                  setOpenDropdownKey(null);
                                  setEditingSwitchUnitId(unit.unitId);
                                }}
                                onClose={() => {
                                  setOpenDropdownKey(null);
                                  setEditingSwitchUnitId(null);
                                }}
                                onSymptomDropdownOpenChange={(open) =>
                                  setOpenDropdownKey(
                                    open ? `${unit.unitId}:symptoms` : null,
                                  )
                                }
                                onRepairTypeDropdownOpenChange={(open) =>
                                  setOpenDropdownKey(
                                    open ? `${unit.unitId}:repairTypes` : null,
                                  )
                                }
                                onToggleSymptom={(symptom) =>
                                  toggleSwitchUnitSymptom(unit.unitId, symptom)
                                }
                                onToggleRepairType={(repairType) =>
                                  toggleSwitchUnitRepairType(
                                    unit.unitId,
                                    repairType,
                                  )
                                }
                              />
                            );
                          })}
                        </>
                      ) : null}
                    </div>
                  </Field>
                </>
              ) : (
                <>
                  <Field label="機種名・型番で検索">
                    <input
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder="機種名または型番で検索"
                      className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    />
                    {modelSearch.trim() ? (
                      <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-700">
                            {androidCandidates.length === 0
                              ? "該当する機種がありません"
                              : isAndroidCandidateLimited
                                ? `検索結果：${androidCandidates.length}件中 ${visibleAndroidCandidates.length}件を表示`
                                : `検索結果：${androidCandidates.length}件`}
                          </p>
                          {isAndroidCandidateLimited ? (
                            <p className="text-xs text-slate-500">
                              候補が多いため、機種名や型番で絞り込んでください。
                            </p>
                          ) : null}
                        </div>
                        {visibleAndroidCandidates.length > 0 ? (
                          <div className="mt-3 grid max-h-96 gap-2 overflow-y-auto pr-1">
                            {visibleAndroidCandidates.map((candidate) => {
                              const selected =
                                selectedAndroidModelLabel === candidate.label;

                              return (
                                <button
                                  type="button"
                                  key={candidate.label}
                                  onClick={() => selectAndroidModel(candidate)}
                                  className={`min-h-14 rounded-lg border bg-white p-3 text-left text-sm transition hover:border-blue-300 hover:bg-blue-50 ${
                                    selected
                                      ? "border-blue-500 ring-2 ring-blue-100"
                                      : "border-slate-200"
                                  }`}
                                >
                                  <span className="block break-words font-semibold text-slate-900">
                                    {candidate.modelName} / {candidate.maker} /{" "}
                                    {candidate.modelNumber || "型番なし"}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {selectedAndroidModel ? (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                        <p className="text-xs font-semibold text-blue-700">
                          選択中の機種
                        </p>
                        <div className="mt-2 flex min-w-0 flex-wrap items-center justify-between gap-3">
                          <p className="min-w-0 break-words text-base font-semibold text-slate-900">
                            {selectedAndroidModel.modelName} /{" "}
                            {selectedAndroidModel.modelNumber || "型番なし"}
                          </p>
                          <button
                            type="button"
                            onClick={clearAndroidModelSelection}
                            className="min-h-10 rounded-lg border border-blue-200 bg-white px-4 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100"
                          >
                            選択を解除
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </Field>

                  <Field
                    label="メーカーを選択"
                    step="STEP 1"
                    requirement="必須"
                    completed={Boolean(form.maker)}
                    guide={
                      !form.maker ? "メーカーを選択してください。" : undefined
                    }
                  >
                    <ButtonGrid
                      options={androidMakers}
                      value={form.maker}
                      onChange={updateAndroidMaker}
                      columns={3}
                    />
                  </Field>

                  <Field
                    label="機種を選択"
                    step="STEP 2"
                    requirement="必須"
                    completed={Boolean(form.modelName)}
                    guide={
                      !form.modelName
                        ? isOtherAndroidManufacturer
                          ? "機種名を入力してください。"
                          : "候補から機種を選択してください。"
                        : undefined
                    }
                  >
                    {isOtherAndroidManufacturer ? (
                      <input
                        value={form.modelName}
                        onChange={(event) =>
                          updateOtherAndroidModel(event.target.value)
                        }
                        placeholder="機種名を入力"
                        className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                      />
                    ) : (
                      <>
                        <select
                          value={selectedAndroidModelLabel}
                          onChange={(event) =>
                            updateAndroidModel(event.target.value)
                          }
                          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                        >
                          <option value="">機種候補を選択</option>
                          {androidSelectCandidates.map((candidate) => (
                            <option key={candidate.label} value={candidate.label}>
                              {candidate.label}
                            </option>
                          ))}
                        </select>
                      </>
                    )}
                  </Field>

                  <Field
                    label="修理メニューを選択してください"
                    step="STEP 3"
                    requirement="必須"
                    completed={form.selectedAndroidRepairKeys.length > 0}
                    guide={
                      form.selectedAndroidRepairKeys.length === 0
                        ? "修理メニューを1つ以上選択してください。"
                        : undefined
                    }
                  >
                    <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
                      {androidRepairMenus.map((menu) => {
                        const isSelected =
                          form.selectedAndroidRepairKeys.includes(menu.key);
                        return (
                          <button
                            key={menu.key}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleAndroidRepairMenu(menu.key)}
                            className={`min-h-16 min-w-0 rounded-lg border px-4 py-2.5 text-left text-sm transition focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                              isSelected
                                ? "border-blue-700 bg-blue-700 text-white shadow-sm hover:bg-blue-800"
                                : "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50"
                            }`}
                          >
                            <span className="block font-bold">{menu.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </Field>
                </>
              )}

              {showSwitchOptions ? (
                <Field
                  label="オプションを選択"
                  step="STEP 3"
                  requirement="任意"
                >
                  <div className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                      <p className="min-w-0 break-words text-sm font-semibold leading-6 text-slate-700">
                        {selectedSwitchOptionSummary ||
                          "選択済み：なし"}
                      </p>
                      <button
                        type="button"
                        onClick={() =>
                          setIsSwitchOptionsOpen((current) => !current)
                        }
                        className="min-h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
                      >
                        {isSwitchOptionsOpen ? "閉じる" : "オプションを開く"}
                      </button>
                    </div>
                    {isSwitchOptionsOpen ? (
                      <div className="grid min-w-0 gap-3 border-t border-slate-200 pt-3">
                        {switchBodyOptions.map((option) => {
                          const selection = getSwitchOptionSelection(
                            form.switchOptionSelections,
                            option.key,
                          );

                          return (
                            <SwitchOptionCheckbox
                              key={option.key}
                              checked={selection.selected}
                              label={option.label}
                              price={`+ ${formatTaxIncludedYen(option.price)}`}
                              quantity={selection.quantity}
                              maxQuantity={switchBodyQuantity}
                              onChange={() => toggleOption(option.key)}
                              onQuantityChange={(quantity) =>
                                updateSwitchOptionQuantity(option.key, quantity)
                              }
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </Field>
              ) : null}

              {!isSwitch && androidOptions.length > 0 ? (
                <Field
                  label="オプションを選択"
                  step="STEP 4"
                  requirement="任意"
                  guide="必要に応じてオプションを選択してください。"
                >
                  <div className="grid min-w-0 gap-3">
                    {androidOptions.map((option) => (
                      <OptionCheckbox
                        key={option.key}
                        checked={form.selectedOptionKeys.includes(option.key)}
                        label={option.label}
                        price={`+ ${formatTaxIncludedYen(option.price)}`}
                        onChange={() => toggleOption(option.key)}
                      />
                    ))}
                  </div>
                </Field>
              ) : null}

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2">
                  <StepBadge>
                    {isSwitch ? `STEP ${switchEstimateStepNumber}` : "STEP 5"}
                  </StepBadge>
                  <span className="text-sm font-bold text-slate-950">見積作成</span>
                </div>
                <p className="mb-3 text-sm font-semibold leading-6 text-blue-950">
                  入力内容を確認して、見積もりを作成してください。
                </p>
                {validationError ? (
                  <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                    {validationError}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={createEstimate}
                  className="min-h-12 w-full max-w-full rounded-md bg-blue-700 px-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  見積作成
                </button>
              </div>
            </div>
          </section>

          <EstimatePanel
            resultRef={resultRef}
            currentCategory={form.category}
            form={displayEstimate.form}
            quote={displayEstimate.quote}
            estimateText={displayEstimate.estimateText}
            customerMessage={displayEstimate.customerMessage}
            reservationCopy={displayEstimate.reservationCopy}
            switchStockCheck={displayEstimate.switchStockCheck}
            selectedOptions={displayEstimate.selectedOptions}
            switchRepairLines={displayEstimate.switchRepairLines}
            switchOptionLines={displayEstimate.switchOptionLines}
            unsupportedAndroidRepairLabels={
              displayEstimate.unsupportedAndroidRepairLabels
            }
            canSave={confirmedEstimate !== null && !hasUnconfirmedChanges}
            saveFeedback={saveFeedback}
            hasUnconfirmedChanges={hasUnconfirmedChanges}
            copiedKey={copiedKey}
            onCopy={copyText}
            onReset={resetForm}
            onStatusChange={updateOrderStatus}
            onStockCheckApply={applySwitchStockCheck}
            hasConfirmedEstimate={confirmedEstimate !== null}
            showSwitchOptions={showSwitchOptions}
          />
        </section>
      </div>
      {adminReportOpen ? (
        <AdminReportModal
          form={adminReportForm}
          feedback={adminReportFeedback}
          sending={adminReportSending}
          onChange={setAdminReportForm}
          onCancel={closeAdminReport}
          onSubmit={submitAdminReport}
        />
      ) : null}
      {masterManagementOpen && isAdmin ? (
        <MasterManagementModal
          data={masterData}
          storeName={storeName}
          loginEmail={loginEmail}
          role={role}
          onSaved={refreshMasterData}
          onClose={() => setMasterManagementOpen(false)}
        />
      ) : null}
      {isUsageGuideOpen ? (
        <UsageGuideModal
          activeTab={usageGuideTab}
          onTabChange={setUsageGuideTab}
          onClose={() => setIsUsageGuideOpen(false)}
        />
      ) : null}
    </main>
  );
}

function EstimatePanel({
  resultRef,
  currentCategory,
  form,
  quote,
  estimateText,
  customerMessage,
  reservationCopy,
  switchStockCheck,
  selectedOptions,
  switchRepairLines,
  switchOptionLines,
  unsupportedAndroidRepairLabels,
  canSave,
  saveFeedback,
  hasUnconfirmedChanges,
  hasConfirmedEstimate,
  showSwitchOptions,
  copiedKey,
  onCopy,
  onReset,
  onStatusChange,
  onStockCheckApply,
}: {
  resultRef: React.RefObject<HTMLElement | null>;
  currentCategory: InquiryCategory;
  form: FormState;
  quote: {
    modelName: string;
    modelNumber: string;
    symptom: string;
    repairType: string;
    price: number | string | undefined;
    status: string;
    note: string;
    receptionStatus: string;
  };
  estimateText: string;
  customerMessage: string;
  reservationCopy: string;
  switchStockCheck?: SwitchStockCheckByLine;
  selectedOptions: NormalizedOption[];
  switchRepairLines: SwitchEstimateLine[];
  switchOptionLines: SwitchOptionLine[];
  unsupportedAndroidRepairLabels: string[];
  canSave: boolean;
  saveFeedback: SaveFeedback | null;
  hasUnconfirmedChanges: boolean;
  hasConfirmedEstimate: boolean;
  showSwitchOptions: boolean;
  copiedKey: string;
  onCopy: (key: string, value: string) => void;
  onReset: () => void;
  onStatusChange: (status: OrderStatus) => void | Promise<void>;
  onStockCheckApply: (stockCheck: SwitchStockCheckByLine) => void;
}) {
  const isSwitch = form.category === "Switch";
  const isAndroidPowerFailureOnly =
    !isSwitch &&
    form.selectedAndroidRepairKeys.length === 1 &&
    form.selectedAndroidRepairKeys[0] === ANDROID_POWER_FAILURE_MENU_KEY;
  const includesAndroidDonorRepair =
    !isSwitch &&
    form.selectedAndroidRepairKeys.includes(ANDROID_DONOR_REPAIR_MENU_KEY);
  const [stockCheckOpen, setStockCheckOpen] = useState(false);
  const showSwitchStockCheck =
    currentCategory === "Switch" && isSwitch && hasConfirmedEstimate;
  const statusFeedback =
    !canSave && hasUnconfirmedChanges
      ? {
          tone: "muted" as const,
          message: "選択内容が変更されています。再度見積もり作成を押してください。",
        }
      : !canSave
        ? {
            tone: "muted" as const,
            message: "見積作成後に保存できます。",
          }
        : saveFeedback;
  const staffNotes = [
    quote.note,
    !isSwitch && quote.status && quote.status !== "店舗対応可"
      ? quote.status
      : "",
    quote.receptionStatus && quote.receptionStatus !== "店舗対応可"
      ? quote.receptionStatus
      : "",
  ].filter(Boolean);

  return (
    <aside
      ref={resultRef}
      className="min-w-0 overflow-hidden scroll-mt-24 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-lg font-bold text-slate-950">見積もり結果</h2>
      {hasUnconfirmedChanges ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-800">
          選択内容が変更されています。再度見積もり作成を押してください。
        </p>
      ) : null}

      {!hasConfirmedEstimate ? (
        <EstimateEmptyState
          category={currentCategory}
          showSwitchOptions={showSwitchOptions}
        />
      ) : isSwitch ? (
        <>
          <dl className="mt-4 grid min-w-0 gap-3">
            <InfoRow label="お見積り合計" value={estimateText} strong />
            <InfoRow label="選択機種" value={quote.modelName} />
          </dl>

          <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
            <h3 className="font-bold text-slate-950">修理内訳</h3>
            <div className="mt-2 grid gap-1">
              {switchRepairLines.length > 0 ? (
                switchRepairLines.map((line) => (
                  <div
                    key={`${line.unitId}-${line.repairType}`}
                    className="min-w-0 break-words"
                  >
                    {formatSwitchRepairLine(line)}
                  </div>
                ))
              ) : (
                <div className="text-slate-500">未選択</div>
              )}
            </div>
          </section>

          {switchOptionLines.length > 0 ? (
            <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800">
              <h3 className="font-bold text-slate-950">追加オプション</h3>
              <div className="mt-2 grid gap-1">
                {switchOptionLines.map((line) => (
                  <div key={line.label} className="min-w-0 break-words">
                    {formatSwitchOptionLine(line)}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

        </>
      ) : (
        <dl className="mt-4 grid min-w-0 gap-3 sm:grid-cols-2">
          <InfoRow label="機種名" value={quote.modelName} />
          <InfoRow label="型番" value={quote.modelNumber} />
          <InfoRow label="修理内容" value={quote.repairType} />
          <InfoRow
            label={isAndroidPowerFailureOnly || includesAndroidDonorRepair ? "概算お見積り金額" : "お見積り金額"}
            value={estimateText}
            strong
          />
        </dl>
      )}

      {hasConfirmedEstimate && !isAndroidPowerFailureOnly && staffNotes.length > 0 ? (
        <section className="mt-4 min-w-0 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <h3 className="font-bold">▼ スタッフ向け注意</h3>
          <div className="mt-2 min-w-0 whitespace-pre-wrap break-words">
            {Array.from(new Set(staffNotes)).join("\n")}
          </div>
        </section>
      ) : null}

      {hasConfirmedEstimate ? (
        <>
          <section className="mt-5 min-w-0 overflow-hidden">
            <h3 className="text-base font-bold text-slate-950">
              お客様へのご案内文
            </h3>
            {showSwitchStockCheck ? (
              <div className="mt-3 grid min-w-0 gap-3">
                <button
                  type="button"
                  onClick={() => setStockCheckOpen(true)}
                  className="min-h-11 w-full rounded-md bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-700 sm:w-auto"
                >
                  パーツ在庫確認、対応可否確認
                </button>
                <section className="rounded-md border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-900">
                  <h4 className="font-bold">パーツ在庫・対応可否：</h4>
                  {switchStockCheck ? (
                    <div className="mt-1 grid gap-1">
                      {formatSwitchStockCheckSummaryLines(
                        switchStockCheck,
                        switchRepairLines,
                      ).map((line) => (
                        <div key={line} className="min-w-0 break-words">
                          ・{line}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1">未確認</p>
                  )}
                </section>
              </div>
            ) : null}
            <pre className="mt-3 min-h-48 max-w-full overflow-hidden whitespace-pre-wrap break-words rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-base leading-7 text-slate-800">
              {customerMessage}
            </pre>
            {!isSwitch && unsupportedAndroidRepairLabels.length > 0 ? (
              <section className="mt-3 min-w-0 overflow-hidden rounded-lg border border-yellow-300 bg-yellow-50 p-4 text-sm leading-6 text-yellow-950 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-100">
                <h4 className="font-bold">スタッフ向けメモ</h4>
                <div className="mt-2 min-w-0 break-words">
                  <p>以下の修理は受付対象外です。</p>
                  <ul className="mt-1">
                    {unsupportedAndroidRepairLabels.map((label) => (
                      <li key={label}>・{label}</li>
                    ))}
                  </ul>
                  <p className="mt-2">
                    お客様へドナー修理をご提案してください。
                  </p>
                </div>
              </section>
            ) : null}
          </section>

          <div className="mt-5 grid min-w-0 gap-3">
            <div className="grid min-w-0 gap-3 sm:grid-cols-3">
              <CopyButton
                copyKey="customer"
                copiedKey={copiedKey}
                label="案内文コピー"
                onCopy={() => onCopy("customer", customerMessage)}
              />
              <CopyButton
                copyKey="reservation"
                copiedKey={copiedKey}
                label="予約管理用コピー"
                onCopy={() => onCopy("reservation", reservationCopy)}
              />
              <button
                type="button"
                onClick={onReset}
                className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                内容入力リセット
              </button>
            </div>
            <StatusButtons
              value={form.orderStatus}
              disabled={!canSave || saveFeedback?.tone === "muted"}
              savingStatus={saveFeedback?.savingStatus}
              onChange={onStatusChange}
            />
            {statusFeedback ? (
              <p
                className={`rounded-md px-3 py-2 text-sm font-semibold ${
                  statusFeedback.tone === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : statusFeedback.tone === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-slate-50 text-slate-500"
                }`}
              >
                {statusFeedback.message}
              </p>
            ) : null}
          </div>
        </>
      ) : null}
      {stockCheckOpen && showSwitchStockCheck ? (
        <SwitchStockCheckModal
          stockCheck={switchStockCheck}
          repairLines={switchRepairLines}
          onApply={(nextStockCheck) => {
            onStockCheckApply(nextStockCheck);
            setStockCheckOpen(false);
          }}
          onCancel={() => setStockCheckOpen(false)}
        />
      ) : null}
    </aside>
  );
}

function EstimateEmptyState({
  category,
  showSwitchOptions,
}: {
  category: InquiryCategory;
  showSwitchOptions: boolean;
}) {
  const steps =
    category === "Switch"
      ? [
          "機種と台数を選択",
          "各端末の症状または修理内容を選択",
          ...(showSwitchOptions ? ["必要に応じてオプションを選択"] : []),
          "見積作成を押す",
        ]
      : [
          "メーカーを選択",
          "機種を選択",
          "修理内容を選択",
          "見積作成を押す",
        ];

  return (
    <section className="mt-4 min-w-0 rounded-lg border border-blue-100 bg-blue-50 p-5">
      <h3 className="text-base font-bold text-blue-950">
        まだ見積もりは作成されていません
      </h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-blue-900">
        左側の必須項目を入力し、「見積作成」を押すと、ここに見積もり結果が表示されます。
      </p>
      <ol className="mt-4 grid min-w-0 gap-2 text-sm font-semibold leading-6 text-slate-700">
        {steps.map((step, index) => (
          <li key={step} className="flex min-w-0 gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-blue-800 ring-1 ring-blue-100">
              {index + 1}
            </span>
            <span className="min-w-0 break-words">{step}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HeaderButton({
  label,
  onClick,
}: {
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-11 shrink-0 rounded-md px-3 text-sm font-semibold text-slate-700 underline-offset-4 transition hover:text-slate-950 hover:underline"
    >
      {label}
    </button>
  );
}

function AuthLoadingScreen({ message }: { message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-900">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-base font-bold text-slate-950">{message}</p>
      </div>
    </main>
  );
}

function LoginScreen({
  email,
  notice,
  error,
  loading,
  onEmailChange,
  onSubmit,
}: {
  email: string;
  notice: string;
  error: string;
  loading: boolean;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
}) {
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!loading) {
      onSubmit();
    }
  }

  const message = error || notice;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-8 text-slate-900">
      <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-normal text-slate-950">
          Repair Quote ログイン
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          登録済みのメールアドレスを入力してください。
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
          <Field label="メールアドレス" requirement="必須">
            <input
              type="email"
              value={email}
              disabled={loading}
              onChange={(event) => onEmailChange(event.target.value)}
              autoComplete="email"
              placeholder="example@example.com"
              className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
            />
          </Field>
          {message ? (
            <p
              className={`rounded-lg border px-4 py-3 text-sm font-semibold leading-6 ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              {message}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="min-h-12 w-full max-w-full rounded-md bg-blue-700 px-4 text-base font-bold text-white shadow-sm transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? "確認中..." : "ログイン"}
          </button>
        </form>
      </section>
    </main>
  );
}

function UsageGuideModal({
  activeTab,
  onTabChange,
  onClose,
}: {
  activeTab: UsageGuideTab;
  onTabChange: (tab: UsageGuideTab) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      onClick={onClose}
    >
      <section
        className="flex max-h-[90vh] w-[calc(100vw-2rem)] max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950">使い方</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Android / Switch の概算見積もりと、お客様案内文を作成できます。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            閉じる
          </button>
        </div>

        <div className="min-w-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="sticky top-0 z-10 -mx-5 bg-white px-5 py-4 sm:-mx-6 sm:px-6">
            <div className="grid min-w-0 gap-2 rounded-lg bg-slate-100 p-1 sm:grid-cols-3">
              {usageGuideTabs.map((tab) => {
                const selected = activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`min-h-11 min-w-0 rounded-md px-3 text-sm font-bold transition ${
                      selected
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-700 hover:bg-white hover:text-slate-950"
                    }`}
                    aria-pressed={selected}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === "common" ? <CommonUsageGuide /> : null}
          {activeTab === "android" ? <AndroidUsageGuide /> : null}
          {activeTab === "switch" ? <SwitchUsageGuide /> : null}
        </div>
      </section>
    </div>
  );
}

const usageGuideTabs: { key: UsageGuideTab; label: string }[] = [
  { key: "common", label: "共通操作" },
  { key: "android", label: "Android" },
  { key: "switch", label: "Switch" },
];

function CommonUsageGuide() {
  return (
    <UsageGuideContent title="共通操作">
      <UsageGuideSection>
        <p>
          このアプリでは、修理カテゴリ・機種・修理内容を選択することで、概算見積もりとお客様向け案内文を作成できます。
        </p>
        <p>
          作成した案内文はコピーして、お客様への返信や予約管理に利用できます。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="見積作成について">
        <p>見積結果は、入力しただけでは自動更新されません。</p>
        <p>入力内容を確認したら「見積作成」を押してください。</p>
        <p>
          見積作成後に入力内容を変更した場合は、もう一度「見積作成」を押してください。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="コピーの使い分け">
        <DescriptionList
          items={[
            {
              term: "案内文コピー",
              description: "お客様への返信に使う文章をコピーします。",
            },
            {
              term: "予約管理用コピー",
              description: "受付内容や予約管理に残すための詳細情報をコピーします。",
            },
          ]}
        />
        <p>お客様に送る場合は、基本的に「案内文コピー」を使用してください。</p>
      </UsageGuideSection>

      <UsageGuideSection title="受注 / 検討">
        <p>
          見積作成後、対応結果に応じて「受注」または「検討」を押してください。
        </p>
        <p>保存すると、見積履歴として記録されます。</p>
      </UsageGuideSection>

      <UsageGuideSection title="管理者へ報告">
        <p>
          価格が違う、修理内容が足りない、案内文がおかしいなど、修正が必要な内容があれば「管理者へ報告」から送信してください。
        </p>
        <p>
          報告内容には、対象機種・修理内容・気づいた内容をできるだけ具体的に入力してください。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="注意点">
        <p>表示される金額は概算です。</p>
        <p>
          端末状態や部品状況によって、作業内容・金額・納期が変わる場合があります。
        </p>
        <p>お客様へ案内する前に、修理内訳と案内文を確認してください。</p>
      </UsageGuideSection>
    </UsageGuideContent>
  );
}

function AndroidUsageGuide() {
  return (
    <UsageGuideContent title="Android見積もりの使い方">
      <UsageGuideSection>
        <p>
          Android見積もりは、メーカー・機種・修理内容を選択して概算見積もりを作成します。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="手順">
        <ol className="list-decimal space-y-1 pl-5">
          <li>メーカーを選択します。</li>
          <li>機種を選択します。</li>
          <li>修理内容を選択します。</li>
          <li>必要に応じてオプションを選択します。</li>
          <li>「見積作成」を押すと、右側に見積結果が表示されます。</li>
        </ol>
      </UsageGuideSection>

      <UsageGuideSection title="「その他」を選択した場合">
        <p>「その他」を選択した場合は、機種名を自由入力できます。</p>
        <p>
          画面修理で価格マスターに登録がない場合は、パーツ原価 + 税込 11,000円 の案内になります。
        </p>
        <p>画面修理以外は、登録済みの共通料金で案内されます。</p>
      </UsageGuideSection>

      <UsageGuideSection title="Androidの注意点">
        <p>
          Androidは機種やパーツ状況により、価格や納期が変わる場合があります。
        </p>
        <p>お客様へ案内する前に、機種名・修理内容・案内文を確認してください。</p>
      </UsageGuideSection>
    </UsageGuideContent>
  );
}

function SwitchUsageGuide() {
  return (
    <UsageGuideContent title="Switch見積もりの使い方">
      <UsageGuideSection>
        <p>
          Switch見積もりは、機種・台数を追加し、端末ごとに症状または修理内容を選択して概算見積もりを作成します。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="手順">
        <ol className="list-decimal space-y-1 pl-5">
          <li>「機種を追加」から修理する機種を選択します。</li>
          <li>機種ごとに台数を選択します。</li>
          <li>端末ごとに、症状または修理内容のどちらかを選択します。</li>
          <li>Switch本体の場合は、必要に応じてオプションを選択します。</li>
          <li>「見積作成」を押すと、右側に見積結果が表示されます。</li>
        </ol>
      </UsageGuideSection>

      <UsageGuideSection title="複数台の入力">
        <p>
          同じ機種を複数台選択した場合は、1台目 / 2台目 のように端末ごとに入力できます。
        </p>
        <p>端末ごとに症状や修理内容を分けて入力してください。</p>
      </UsageGuideSection>

      <UsageGuideSection title="症状から選ぶ / 修理内容から選ぶ">
        <p>
          症状が分かっている場合は「症状から見積もりを作成する」を選択してください。
        </p>
        <p>
          修理内容が分かっている場合は「修理内容から見積もりを作成する」を選択してください。
        </p>
        <p>基本的にはどちらか一方の入力で見積もりできます。</p>
        <p>
          症状から選んだ内容と同じ修理内容は、重複しないように自動で調整されます。追加修理がある場合のみ、もう一方も選択してください。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="Switch本体用オプション">
        <p>
          Nintendo Switch / Switch Lite / Switch 有機EL / Switch 2 などの本体機種を選択した場合は、必要に応じてオプションを選択できます。
        </p>
        <p>
          Joy-Con / Proコントローラー / Joy-Con 2 のみの場合、Switch本体用オプションは表示されません。
        </p>
      </UsageGuideSection>

      <UsageGuideSection title="パーツ在庫確認、対応可否確認">
        <p>
          Switchカテゴリでは、見積作成後に「パーツ在庫確認、対応可否確認」を設定できます。
        </p>
        <DescriptionList
          items={[
            {
              term: "在庫あり",
              description: "即日対応可能な場合に選択します。作業時間も選択してください。",
            },
            {
              term: "在庫なし",
              description: "パーツ取り寄せが必要な場合に選択します。",
            },
            {
              term: "委託・預かり対応",
              description: "基板作業や預かり対応が必要な場合に選択します。",
            },
            {
              term: "要確認",
              description: "在庫状況や対応可否を確認する必要がある場合に選択します。",
            },
          ]}
        />
      </UsageGuideSection>

      <UsageGuideSection title="Switchの注意点">
        <p>基板作業が必要な修理は、お預かり期間が発生する場合があります。</p>
        <p>
          端末状態や部品状況によって、作業内容・金額・納期が変わる場合があります。
        </p>
        <p>お客様へ案内する前に、修理内訳と案内文を確認してください。</p>
      </UsageGuideSection>
    </UsageGuideContent>
  );
}

function UsageGuideContent({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-4 text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
      <h3 className="text-lg font-bold text-slate-950 sm:text-xl">{title}</h3>
      {children}
    </div>
  );
}

function UsageGuideSection({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid min-w-0 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {title ? (
        <h4 className="text-base font-bold leading-6 text-slate-950">{title}</h4>
      ) : null}
      <div className="grid min-w-0 gap-2 break-words">{children}</div>
    </section>
  );
}

function DescriptionList({
  items,
}: {
  items: { term: string; description: string }[];
}) {
  return (
    <dl className="grid min-w-0 gap-2">
      {items.map((item) => (
        <div key={item.term} className="min-w-0">
          <dt className="font-bold text-slate-900">{item.term}：</dt>
          <dd className="break-words text-slate-700">{item.description}</dd>
        </div>
      ))}
    </dl>
  );
}

function MasterManagementModal({
  data,
  storeName,
  loginEmail,
  role,
  onSaved,
  onClose,
}: {
  data: InitialData;
  storeName: string;
  loginEmail: string;
  role: string;
  onSaved: () => Promise<void>;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<MasterManagementTab>("Android");
  const [androidMode, setAndroidMode] =
    useState<AndroidMasterMode>("新規機種追加");
  const [switchMode, setSwitchMode] =
    useState<SwitchMasterMode>("新規項目追加");
  const [repairItemMode, setRepairItemMode] =
    useState<RepairItemMode>("修理メニュー追加");
  const [androidForm, setAndroidForm] = useState(createEmptyAndroidMasterForm);
  const [switchForm, setSwitchForm] = useState(createEmptySwitchMasterForm);
  const [repairItemForm, setRepairItemForm] = useState(createEmptyRepairItemForm);
  const [androidSearch, setAndroidSearch] = useState("");
  const [switchSearch, setSwitchSearch] = useState("");
  const [repairItemSearch, setRepairItemSearch] = useState("");
  const [feedback, setFeedback] = useState<MasterFeedback | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmationTarget, setDeleteConfirmationTarget] = useState<
    "android" | "switch" | null
  >(null);

  const androidRows = useMemo(
    () =>
      data.priceMaster
        .filter((item) => !isInactiveReceptionStatus(item.receptionStatus))
        .sort(compareSortOrder),
    [data.priceMaster],
  );
  const androidManufacturers = useMemo(
    () => uniqueValues(androidRows.map((item) => item.manufacturer)),
    [androidRows],
  );
  const switchRows = useMemo(
    () => [...data.switchEstimateMaster].sort(compareSortOrder),
    [data.switchEstimateMaster],
  );
  const repairItemRows = useMemo(
    () => [...data.repairItemMaster].sort(compareSortOrder),
    [data.repairItemMaster],
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving && !deleting) {
        if (deleteConfirmationTarget) {
          setDeleteConfirmationTarget(null);
          return;
        }
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteConfirmationTarget, deleting, onClose, saving]);

  async function deleteAndroidItem() {
    if (role !== "admin" || !androidForm.rowNumber) {
      setFeedback({ tone: "error", message: "管理者権限が必要です。" });
      return;
    }

    setDeleting(true);
    setFeedback({ tone: "muted", message: "削除中..." });

    try {
      await postMasterAction("deleteAndroidMasterItem", {
        role,
        storeName,
        loginEmail,
        rowNumber: androidForm.rowNumber,
        manufacturer: androidForm.manufacturer,
        modelName: androidForm.modelName,
        modelNumber: androidForm.modelNumber,
      });
      await onSaved();
      setAndroidForm(createEmptyAndroidMasterForm());
      setDeleteConfirmationTarget(null);
      setFeedback({
        tone: "success",
        message: "登録機種を削除しました。見積もり候補には表示されません。",
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "削除に失敗しました。通信状況を確認して再度お試しください。",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function deleteSwitchItem() {
    if (role !== "admin" || !switchForm.rowNumber) {
      setFeedback({ tone: "error", message: "管理者権限が必要です。" });
      return;
    }

    setDeleting(true);
    setFeedback({ tone: "muted", message: "削除中..." });

    try {
      await postMasterAction("deleteSwitchMasterItem", {
        role,
        storeName,
        loginEmail,
        rowNumber: switchForm.rowNumber,
        modelName: switchForm.modelName,
        modelNumber: switchForm.modelNumber,
        symptom: switchForm.symptom,
        estimatedRepairType: switchForm.estimatedRepairType,
      });
      await onSaved();
      setSwitchForm(createEmptySwitchMasterForm());
      setSwitchSearch("");
      setDeleteConfirmationTarget(null);
      setFeedback({
        tone: "success",
        message:
          "Switchメニューを削除しました。受付状態を受付停止中に変更し、見積もり候補には表示されません。",
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "削除に失敗しました。通信状況を確認して再度お試しください。",
      });
    } finally {
      setDeleting(false);
    }
  }

  async function submitMasterChange() {
    const validation = validateMasterForm({
      activeTab,
      androidMode,
      switchMode,
      repairItemMode,
      androidForm,
      switchForm,
      repairItemForm,
    });

    if (validation) {
      setFeedback({ tone: "error", message: validation });
      return;
    }

    if (activeTab === "Android") {
      const duplicateCandidates = findAndroidDuplicateCandidates(
        androidRows,
        androidForm,
      );

      if (
        duplicateCandidates.length > 0 &&
        typeof window !== "undefined" &&
        !window.confirm(
          `表記が近い登録済み機種が${duplicateCandidates.length}件あります。このまま保存しますか？`,
        )
      ) {
        setFeedback({
          tone: "error",
          message: "重複候補を確認してから保存してください。",
        });
        return;
      }
    }

    setSaving(true);
    setFeedback({ tone: "muted", message: "保存中..." });

    try {
      const { action, payload } = createMasterActionPayload({
        activeTab,
        androidMode,
        androidRows,
        switchMode,
        repairItemMode,
        androidForm,
        switchForm,
        repairItemForm,
        storeName,
        loginEmail,
        role,
      });

      await postMasterAction(action, payload);
      if (activeTab === "Android" && androidForm.additionalRepairSettings.length > 0) {
        await postMasterAction(
          "upsertAndroidModelRepairSettings",
          createAndroidModelRepairSettingsPayload({
            androidForm,
            storeName,
            loginEmail,
            role,
          }),
        );
      }
      await onSaved();
      setFeedback({
        tone: "success",
        message: "保存しました。データを再読み込みしました。",
      });

      if (activeTab === "Android" && androidMode === "新規機種追加") {
        setAndroidForm(createEmptyAndroidMasterForm());
      }
      if (activeTab === "Switch" && switchMode === "新規項目追加") {
        setSwitchForm(createEmptySwitchMasterForm());
      }
      if (activeTab === "修理メニュー" && repairItemMode === "修理メニュー追加") {
        setRepairItemForm(createEmptyRepairItemForm());
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "保存に失敗しました。通信状況を確認して再度お試しください。",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6"
      onClick={() => {
        if (!saving && !deleting && !deleteConfirmationTarget) {
          onClose();
        }
      }}
    >
      <section
        className="flex max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl flex-col overflow-hidden rounded-lg bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex min-w-0 items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-950">マスター管理</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              Android / Switch / 修理メニューのマスターを追加・変更します。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving || deleting}
            className="min-h-11 shrink-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            閉じる
          </button>
        </div>

        <div className="min-w-0 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
          <div className="sticky top-0 z-10 -mx-5 bg-white px-5 py-4 sm:-mx-6 sm:px-6">
            <div className="grid min-w-0 gap-2 rounded-lg bg-slate-100 p-1 sm:grid-cols-3">
              {masterManagementTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    setFeedback(null);
                  }}
                  className={`min-h-11 min-w-0 rounded-md px-3 text-sm font-bold transition ${
                    activeTab === tab
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-700 hover:bg-white hover:text-slate-950"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "Android" ? (
            <AndroidMasterPanel
              mode={androidMode}
              form={androidForm}
              rows={androidRows}
              manufacturers={androidManufacturers}
              repairItemMaster={data.repairItemMaster}
              androidModelRepairSettings={data.androidModelRepairSettings}
              search={androidSearch}
              onModeChange={(mode) => {
                setAndroidMode(mode);
                setAndroidForm(createEmptyAndroidMasterForm());
                setFeedback(null);
              }}
              onSearchChange={setAndroidSearch}
              onSelect={(item) => {
                setAndroidForm(
                  createAndroidMasterFormFromItem(
                    item,
                    data.repairItemMaster,
                    data.androidModelRepairSettings,
                  ),
                );
                setFeedback(null);
              }}
              onFormChange={setAndroidForm}
            />
          ) : null}

          {activeTab === "Switch" ? (
            <SwitchMasterPanel
              mode={switchMode}
              form={switchForm}
              rows={switchRows}
              search={switchSearch}
              onModeChange={(mode) => {
                setSwitchMode(mode);
                setSwitchForm(createEmptySwitchMasterForm());
                setFeedback(null);
              }}
              onSearchChange={setSwitchSearch}
              onSelect={(item) => {
                setSwitchForm(createSwitchMasterFormFromItem(item));
                setFeedback(null);
              }}
              onFormChange={setSwitchForm}
            />
          ) : null}

          {activeTab === "修理メニュー" ? (
            <RepairItemMasterPanel
              mode={repairItemMode}
              form={repairItemForm}
              rows={repairItemRows}
              search={repairItemSearch}
              onModeChange={(mode) => {
                setRepairItemMode(mode);
                setRepairItemForm(createEmptyRepairItemForm());
                setFeedback(null);
              }}
              onSearchChange={setRepairItemSearch}
              onSelect={(item) => {
                setRepairItemForm(createRepairItemFormFromItem(item));
                setFeedback(null);
              }}
              onFormChange={setRepairItemForm}
            />
          ) : null}

          <div className="mt-5">
            <MasterSection title="保存">
              {feedback ? (
                <p
                  className={`rounded-md px-4 py-3 text-sm font-semibold leading-6 ${
                    feedback.tone === "success"
                      ? "bg-emerald-50 text-emerald-700"
                      : feedback.tone === "error"
                        ? "bg-red-50 text-red-700"
                        : "bg-white text-slate-500"
                  }`}
                >
                  {feedback.message}
                </p>
              ) : null}

              <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={submitMasterChange}
                  disabled={saving}
                  className="min-h-12 w-full min-w-0 rounded-md bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? "保存中..." : "保存"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  キャンセル
                </button>
              </div>
            </MasterSection>
          </div>
          {activeTab === "Android" &&
          androidMode === "既存データ変更" &&
          role === "admin" &&
          Boolean(androidForm.rowNumber) ? (
            <section className="mt-5 grid min-w-0 gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <h3 className="text-sm font-bold text-red-900">危険な操作</h3>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  行は残したまま受付状態を「受付停止中」に変更します。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmationTarget("android")}
                disabled={saving || deleting}
                className="min-h-12 w-full rounded-md bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto sm:justify-self-start"
              >
                {deleting ? "削除中..." : "この機種を削除"}
              </button>
            </section>
          ) : null}
          {activeTab === "Switch" &&
          switchMode === "既存データ変更" &&
          role === "admin" &&
          Boolean(switchForm.rowNumber) ? (
            <section className="mt-5 grid min-w-0 gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <div>
                <h3 className="text-sm font-bold text-red-900">危険な操作</h3>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  行は残したまま受付状態を「受付停止中」に変更します。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirmationTarget("switch")}
                disabled={saving || deleting}
                className="min-h-12 w-full rounded-md bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto sm:justify-self-start"
              >
                {deleting ? "削除中..." : "このSwitchメニューを削除"}
              </button>
            </section>
          ) : null}
        </div>
      </section>
      {deleteConfirmationTarget === "android" ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={() => {
            if (!deleting) setDeleteConfirmationTarget(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-android-title"
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-android-title" className="text-lg font-bold text-slate-950">
              この登録機種を削除しますか？
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              削除後は見積もり候補に表示されなくなります。スプレッドシート上の行は残り、受付状態が「受付停止中」に変更されます。
            </p>
            <dl className="mt-4 grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
              <div><dt className="inline font-bold">メーカー：</dt><dd className="inline">{androidForm.manufacturer || "-"}</dd></div>
              <div><dt className="inline font-bold">機種名：</dt><dd className="inline">{androidForm.modelName || "-"}</dd></div>
              <div><dt className="inline font-bold">型番：</dt><dd className="inline">{androidForm.modelNumber || "-"}</dd></div>
              <div><dt className="inline font-bold">行番号：</dt><dd className="inline">{androidForm.rowNumber}</dd></div>
            </dl>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={deleteAndroidItem}
                disabled={deleting}
                className="min-h-12 rounded-md bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmationTarget(null)}
                disabled={deleting}
                className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                キャンセル
              </button>
            </div>
          </section>
        </div>
      ) : null}
      {deleteConfirmationTarget === "switch" ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 px-4 py-6"
          onClick={() => {
            if (!deleting) setDeleteConfirmationTarget(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-switch-title"
            className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="delete-switch-title" className="text-lg font-bold text-slate-950">
              このSwitchメニューを削除しますか？
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              削除後は見積もり候補に表示されなくなります。スプレッドシート上の行は残り、受付状態が「受付停止中」に変更されます。
            </p>
            <dl className="mt-4 grid gap-2 rounded-md bg-slate-50 p-4 text-sm">
              <div><dt className="inline font-bold">機種名：</dt><dd className="inline">{switchForm.modelName || "-"}</dd></div>
              <div><dt className="inline font-bold">型番：</dt><dd className="inline">{switchForm.modelNumber || "-"}</dd></div>
              <div><dt className="inline font-bold">症状：</dt><dd className="inline">{switchForm.symptom || "-"}</dd></div>
              <div><dt className="inline font-bold">想定修理内容：</dt><dd className="inline">{switchForm.estimatedRepairType || "-"}</dd></div>
              <div><dt className="inline font-bold">行番号：</dt><dd className="inline">{switchForm.rowNumber}</dd></div>
            </dl>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={deleteSwitchItem}
                disabled={deleting}
                className="min-h-12 rounded-md bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-red-300"
              >
                {deleting ? "削除中..." : "削除する"}
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmationTarget(null)}
                disabled={deleting}
                className="min-h-12 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                キャンセル
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function AndroidMasterPanel({
  mode,
  form,
  rows,
  manufacturers,
  repairItemMaster,
  androidModelRepairSettings,
  search,
  onModeChange,
  onSearchChange,
  onSelect,
  onFormChange,
}: {
  mode: AndroidMasterMode;
  form: AndroidMasterForm;
  rows: AndroidPriceMasterItem[];
  manufacturers: string[];
  repairItemMaster: RepairItemMasterItem[];
  androidModelRepairSettings: AndroidModelRepairSettingItem[];
  search: string;
  onModeChange: (mode: AndroidMasterMode) => void;
  onSearchChange: (search: string) => void;
  onSelect: (item: AndroidPriceMasterItem) => void;
  onFormChange: React.Dispatch<React.SetStateAction<AndroidMasterForm>>;
}) {
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [selectedModelKey, setSelectedModelKey] = useState("");

  const manufacturerOptions = useMemo(
    () => uniqueValues(rows.map((item) => item.manufacturer)),
    [rows],
  );
  const modelOptions = useMemo(
    () => createAndroidModelOptions(rows, selectedManufacturer),
    [rows, selectedManufacturer],
  );
  const searchResults = useMemo(
    () => searchAndroidMasterRows(rows, search),
    [rows, search],
  );
  const candidateRows = useMemo(
    () => getAndroidMasterCandidateRows(rows, selectedManufacturer, selectedModelKey),
    [rows, selectedManufacturer, selectedModelKey],
  );
  const duplicateCandidates = findAndroidDuplicateCandidates(rows, form);
  const showAndroidForm = mode === "新規機種追加" || Boolean(form.rowNumber);
  const dynamicRepairDefinitions = useMemo(
    () => createDynamicAndroidRepairDefinitions(repairItemMaster),
    [repairItemMaster],
  );

  useEffect(() => {
    if (mode !== "既存データ変更") {
      setSelectedManufacturer("");
      setSelectedModelKey("");
      onSearchChange("");
    }
  }, [mode, onSearchChange]);

  useEffect(() => {
    if (
      mode === "既存データ変更" &&
      candidateRows.length === 1 &&
      form.rowNumber !== candidateRows[0].rowNumber
    ) {
      onSelect(candidateRows[0]);
    }
  }, [candidateRows, form.rowNumber, mode, onSelect]);

  useEffect(() => {
    onFormChange((current) =>
      syncAndroidAdditionalRepairSettings(
        current,
        repairItemMaster,
        androidModelRepairSettings,
      ),
    );
  }, [androidModelRepairSettings, onFormChange, repairItemMaster]);

  return (
    <div className="grid min-w-0 gap-5">
      <SegmentedControl
        options={androidMasterModes}
        value={mode}
        getLabel={(option) => androidMasterModeLabels[option]}
        onChange={onModeChange}
      />
      {mode === "既存データ変更" ? (
        <AndroidExistingDataSelector
          manufacturers={manufacturerOptions}
          selectedManufacturer={selectedManufacturer}
          modelOptions={modelOptions}
          selectedModelKey={selectedModelKey}
          search={search}
          searchResults={searchResults}
          candidateRows={candidateRows}
          selectedRowNumber={form.rowNumber}
          onManufacturerChange={(manufacturer) => {
            setSelectedManufacturer(manufacturer);
            setSelectedModelKey("");
            onSearchChange("");
            onFormChange(createEmptyAndroidMasterForm());
          }}
          onModelChange={(modelKey) => {
            setSelectedModelKey(modelKey);
            onFormChange(createEmptyAndroidMasterForm());
          }}
          onSearchChange={(value) => {
            onSearchChange(value);
          }}
          onSearchResultSelect={(item) => {
            setSelectedManufacturer(item.manufacturer);
            setSelectedModelKey(normalizeModelName(item.modelName));
            onSelect(item);
          }}
          onSelect={onSelect}
        />
      ) : null}
      {showAndroidForm ? (
        <>
          <MasterSection
            title={mode === "既存データ変更" ? "STEP 4 内容を編集" : "基本情報"}
            description="機種として登録する基本情報を入力します。"
          >
            <MasterFormGrid>
              <AndroidManufacturerInput
                value={form.manufacturer}
                manufacturers={manufacturers}
                onChange={(value) =>
                  onFormChange((current) => ({ ...current, manufacturer: value }))
                }
              />
              <MasterTextInput label="機種名" required value={form.modelName} onChange={(value) => onFormChange((current) => ({ ...current, modelName: value }))} />
              <MasterTextInput label="型番" value={form.modelNumber} onChange={(value) => onFormChange((current) => ({ ...current, modelNumber: value }))} />
              <MasterSelectInput label="受付状態" required value={form.receptionStatus} options={receptionStatusOptions} onChange={(value) => onFormChange((current) => ({ ...current, receptionStatus: value }))} />
              <MasterTextInput
                label={
                  mode === "新規機種追加"
                    ? "表示順（任意・自動設定）"
                    : "表示順"
                }
                value={form.sortOrder}
                placeholder={
                  mode === "新規機種追加" ? "未入力で自動設定" : undefined
                }
                guide={
                  mode === "新規機種追加"
                    ? "未入力の場合は、新しく追加した機種が候補の上に表示されるよう自動設定されます。"
                    : "数字が小さいほど上に表示されます。"
                }
                onChange={(value) =>
                  onFormChange((current) => ({ ...current, sortOrder: value }))
                }
              />
              <MasterTextArea label="備考" value={form.note} onChange={(value) => onFormChange((current) => ({ ...current, note: value }))} />
            </MasterFormGrid>
          </MasterSection>
          <MasterSection
            title="固定修理メニュー"
            description={`見積もり画面に標準で表示するAndroid修理メニューを設定します。${androidPriceSupportSettingHelpText}`}
          >
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              <AndroidFixedRepairCard
                title="画面修理"
                status={form.screenStatus}
                manualPrice={form.screenPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, screenStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, screenPrice: value }))}
              />
              <AndroidFixedRepairCard
                title="バッテリー"
                status={form.batteryStatus}
                manualPrice={form.batteryManualPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, batteryStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, batteryManualPrice: value }))}
              />
              <AndroidFixedRepairCard
                title="充電口"
                status={form.chargePortStatus}
                manualPrice={form.chargePortManualPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, chargePortStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, chargePortManualPrice: value }))}
              />
              <AndroidFixedRepairCard
                title="カメラレンズ"
                status={form.cameraLensStatus}
                manualPrice={form.cameraLensManualPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, cameraLensStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, cameraLensManualPrice: value }))}
              />
              <AndroidFixedRepairCard
                title="スリープボタン"
                status={form.sleepButtonStatus}
                manualPrice={form.sleepButtonManualPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, sleepButtonStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, sleepButtonManualPrice: value }))}
              />
              <AndroidFixedRepairCard
                title="音量ボタン"
                status={form.volumeButtonStatus}
                manualPrice={form.volumeButtonManualPrice}
                onStatusChange={(value) => onFormChange((current) => ({ ...current, volumeButtonStatus: value }))}
                onManualPriceChange={(value) => onFormChange((current) => ({ ...current, volumeButtonManualPrice: value }))}
              />
            </div>
          </MasterSection>
          <AndroidAdditionalRepairSettingsPanel
            definitions={dynamicRepairDefinitions}
            settings={form.additionalRepairSettings}
            onSettingsChange={(settings) =>
              onFormChange((current) => ({
                ...current,
                additionalRepairSettings: settings,
              }))
            }
          />
          {duplicateCandidates.length > 0 ? (
            <section className="grid min-w-0 gap-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <p className="font-bold">表記が近い登録済み機種があります。</p>
              <ul className="grid min-w-0 gap-1">
                {duplicateCandidates.slice(0, 5).map((item) => (
                  <li key={item.rowNumber} className="min-w-0 break-words">
                    {item.manufacturer} / {item.modelName} / {item.modelNumber || "-"}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-500">
          メーカー、機種、登録データを選択すると編集フォームが表示されます。
        </p>
      )}
    </div>
  );
}

function AndroidExistingDataSelector({
  manufacturers,
  selectedManufacturer,
  modelOptions,
  selectedModelKey,
  search,
  searchResults,
  candidateRows,
  selectedRowNumber,
  onManufacturerChange,
  onModelChange,
  onSearchChange,
  onSearchResultSelect,
  onSelect,
}: {
  manufacturers: string[];
  selectedManufacturer: string;
  modelOptions: AndroidMasterModelOption[];
  selectedModelKey: string;
  search: string;
  searchResults: AndroidPriceMasterItem[];
  candidateRows: AndroidPriceMasterItem[];
  selectedRowNumber?: number;
  onManufacturerChange: (manufacturer: string) => void;
  onModelChange: (modelKey: string) => void;
  onSearchChange: (search: string) => void;
  onSearchResultSelect: (item: AndroidPriceMasterItem) => void;
  onSelect: (item: AndroidPriceMasterItem) => void;
}) {
  return (
    <section className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold leading-6 text-slate-600">
        メーカー、機種、登録データを順に選択すると編集フォームが表示されます。
      </p>
      <Field label="機種名・型番で検索" requirement="任意">
        <div className="grid min-w-0 gap-2">
          <input
            value={search}
            placeholder="機種名または型番で検索"
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            メーカー未選択でも検索できます。
          </p>
          {normalizeAndroidModelSearchText(search) ? (
            searchResults.length > 0 ? (
              <div className="grid max-h-72 min-w-0 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">
                {searchResults.map((item) => (
                  <button
                    key={item.rowNumber}
                    type="button"
                    onClick={() => onSearchResultSelect(item)}
                    className="min-h-11 min-w-0 rounded-md px-3 py-2 text-left text-sm font-semibold leading-6 text-slate-700 transition hover:bg-blue-50 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {formatAndroidMasterSearchResultLabel(item)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                該当する機種がありません。
              </p>
            )
          ) : null}
        </div>
      </Field>
      <Field label="メーカーを選択" step="STEP 1" requirement="必須">
        <select
          value={selectedManufacturer}
          onChange={(event) => onManufacturerChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">メーカーを選択してください</option>
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer} value={manufacturer}>
              {manufacturer}
            </option>
          ))}
        </select>
      </Field>
      <Field label="機種を選択" step="STEP 2" requirement="必須">
        <select
          value={selectedModelKey}
          disabled={!selectedManufacturer || modelOptions.length === 0}
          onChange={(event) => onModelChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {!selectedManufacturer
              ? "メーカーを選択してください"
              : modelOptions.length === 0
                ? "該当する機種がありません"
                : "機種を選択してください"}
          </option>
          {modelOptions.map((model) => (
            <option key={model.key} value={model.key}>
              {model.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="変更する登録データを選択" step="STEP 3" requirement="必須">
        <select
          value={selectedRowNumber ?? ""}
          disabled={!selectedModelKey || candidateRows.length === 0}
          onChange={(event) => {
            const rowNumber = Number(event.target.value);
            const item = candidateRows.find((row) => row.rowNumber === rowNumber);
            if (item) {
              onSelect(item);
            }
          }}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {!selectedModelKey
              ? "変更するデータを選択してください"
              : candidateRows.length === 0
                ? "該当する登録データがありません"
                : "変更するデータを選択してください"}
          </option>
          {candidateRows.map((item) => (
            <option key={item.rowNumber} value={item.rowNumber}>
              {formatAndroidMasterCandidateLabel(item)}
            </option>
          ))}
        </select>
      </Field>
      {selectedModelKey && candidateRows.length === 1 ? (
        <p className="text-xs font-semibold leading-5 text-slate-500">
          候補が1件のため自動選択します。
        </p>
      ) : null}
    </section>
  );
}

function SwitchMasterPanel({
  mode,
  form,
  rows,
  search,
  onModeChange,
  onSearchChange,
  onSelect,
  onFormChange,
}: {
  mode: SwitchMasterMode;
  form: SwitchMasterForm;
  rows: SwitchEstimateMasterItem[];
  search: string;
  onModeChange: (mode: SwitchMasterMode) => void;
  onSearchChange: (search: string) => void;
  onSelect: (item: SwitchEstimateMasterItem) => void;
  onFormChange: React.Dispatch<React.SetStateAction<SwitchMasterForm>>;
}) {
  const [selectedModelName, setSelectedModelName] = useState("");
  const [selectedSymptom, setSelectedSymptom] = useState("");
  const activeRows = useMemo(
    () =>
      rows.filter(
        (item) => !isInactiveReceptionStatus(item.receptionStatus),
      ),
    [rows],
  );
  const modelOptions = useMemo(
    () => uniqueValues(activeRows.map((item) => item.modelName)),
    [activeRows],
  );
  const addSymptomOptions = useMemo(
    () =>
      uniqueValues(
        [...activeRows]
          .sort(compareSortOrder)
          .map((item) => item.symptom),
      ),
    [activeRows],
  );
  const addEstimatedRepairTypeOptions = useMemo(
    () => createSwitchEstimatedRepairTypeOptions(activeRows, form.symptom),
    [activeRows, form.symptom],
  );
  const symptomOptions = useMemo(
    () =>
      uniqueValues(
        activeRows
          .filter((item) => item.modelName === selectedModelName)
          .map((item) => item.symptom),
      ),
    [activeRows, selectedModelName],
  );
  const candidateRows = useMemo(
    () =>
      activeRows.filter(
        (item) =>
          item.modelName === selectedModelName &&
          item.symptom === selectedSymptom,
      ),
    [activeRows, selectedModelName, selectedSymptom],
  );
  const searchResults = useMemo(
    () => searchSwitchMasterRows(activeRows, search),
    [activeRows, search],
  );
  const showSwitchForm = mode === "新規項目追加" || Boolean(form.rowNumber);

  useEffect(() => {
    if (mode !== "既存データ変更") {
      setSelectedModelName("");
      setSelectedSymptom("");
      onSearchChange("");
    }
  }, [mode, onSearchChange]);

  return (
    <div className="grid min-w-0 gap-5">
      <SegmentedControl
        options={switchMasterModes}
        value={mode}
        getLabel={(option) => switchMasterModeLabels[option]}
        onChange={onModeChange}
      />
      <p className="text-sm font-semibold leading-6 text-slate-500">
        Switchの修理メニューを追加・変更します。
      </p>
      {mode === "既存データ変更" ? (
        <SwitchExistingDataSelector
          modelOptions={modelOptions}
          selectedModelName={selectedModelName}
          symptomOptions={symptomOptions}
          selectedSymptom={selectedSymptom}
          search={search}
          searchResults={searchResults}
          candidateRows={candidateRows}
          selectedRowNumber={form.rowNumber}
          onSearchChange={onSearchChange}
          onModelChange={(modelName) => {
            setSelectedModelName(modelName);
            setSelectedSymptom("");
            onFormChange(createEmptySwitchMasterForm());
          }}
          onSymptomChange={(symptom) => {
            setSelectedSymptom(symptom);
            const firstCandidate = activeRows.find(
              (item) =>
                item.modelName === selectedModelName &&
                item.symptom === symptom,
            );
            if (firstCandidate) {
              onSelect(firstCandidate);
            } else {
              onFormChange(createEmptySwitchMasterForm());
            }
          }}
          onSearchResultSelect={(item) => {
            setSelectedModelName(item.modelName);
            setSelectedSymptom(item.symptom);
            onSelect(item);
          }}
          onSelect={onSelect}
        />
      ) : null}
      {showSwitchForm ? (
        <MasterSection
          title={
            mode === "新規項目追加"
              ? "修理メニューを追加"
              : "STEP 4 内容を編集"
          }
        >
          <MasterFormGrid>
            <MasterTextInput label="並び順" value={form.sortOrder} onChange={(value) => onFormChange((current) => ({ ...current, sortOrder: value }))} />
            <MasterTextInput label="機種名" required value={form.modelName} onChange={(value) => onFormChange((current) => ({ ...current, modelName: value }))} />
            <MasterTextInput label="型番" value={form.modelNumber} onChange={(value) => onFormChange((current) => ({ ...current, modelNumber: value }))} />
            {mode === "新規項目追加" ? (
              <Field label="症状" requirement="必須">
                <div className="grid min-w-0 gap-2">
                  <select
                    value={form.symptom}
                    onChange={(event) => {
                      const symptom = event.target.value;
                      const estimatedRepairTypeOptions =
                        createSwitchEstimatedRepairTypeOptions(
                          activeRows,
                          symptom,
                        );

                      onFormChange((current) => ({
                        ...current,
                        symptom,
                        estimatedRepairType:
                          estimatedRepairTypeOptions.length === 1
                            ? estimatedRepairTypeOptions[0]
                            : "",
                      }));
                    }}
                    className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">症状を選択してください</option>
                    {addSymptomOptions.map((symptom) => (
                      <option key={symptom} value={symptom}>
                        {symptom}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs font-semibold leading-5 text-slate-500">
                    既存登録済みの症状から選択してください。
                  </p>
                </div>
              </Field>
            ) : (
              <MasterTextInput label="症状" required value={form.symptom} onChange={(value) => onFormChange((current) => ({ ...current, symptom: value }))} />
            )}
            {mode === "新規項目追加" ? (
              <Field label="想定修理内容" requirement="必須">
                <div className="grid min-w-0 gap-2">
                  <select
                    value={form.estimatedRepairType}
                    disabled={
                      !form.symptom ||
                      addEstimatedRepairTypeOptions.length === 0
                    }
                    onChange={(event) =>
                      onFormChange((current) => ({
                        ...current,
                        estimatedRepairType: event.target.value,
                      }))
                    }
                    className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="">
                      {form.symptom
                        ? "想定修理内容を選択してください"
                        : "先に症状を選択してください"}
                    </option>
                    {addEstimatedRepairTypeOptions.map((estimatedRepairType) => (
                      <option
                        key={estimatedRepairType}
                        value={estimatedRepairType}
                      >
                        {estimatedRepairType}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs font-semibold leading-5 text-slate-500">
                    {form.symptom &&
                    addEstimatedRepairTypeOptions.length === 0
                      ? "この症状に紐づく修理内容がありません。"
                      : addEstimatedRepairTypeOptions.length === 1
                        ? "選択した症状に紐づく修理内容を自動入力しました。"
                        : "選択した症状に紐づく修理内容から選択してください。"}
                  </p>
                </div>
              </Field>
            ) : (
              <MasterTextInput label="想定修理内容" required value={form.estimatedRepairType} onChange={(value) => onFormChange((current) => ({ ...current, estimatedRepairType: value }))} />
            )}
            <MasterTextInput label="修理費用" required value={form.repairPrice} onChange={(value) => onFormChange((current) => ({ ...current, repairPrice: value }))} />
            <MasterSelectInput label="対応区分" required value={form.repairStatus} options={supportStatusOptions} onChange={(value) => onFormChange((current) => ({ ...current, repairStatus: value }))} />
            <MasterSelectInput label="受付状態" required value={form.receptionStatus} options={receptionStatusOptions} onChange={(value) => onFormChange((current) => ({ ...current, receptionStatus: value }))} />
            <MasterTextArea label="備考" value={form.note} onChange={(value) => onFormChange((current) => ({ ...current, note: value }))} />
          </MasterFormGrid>
        </MasterSection>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-500">
          機種、症状、登録データを選択すると編集フォームが表示されます。
        </p>
      )}
    </div>
  );
}

function SwitchExistingDataSelector({
  modelOptions,
  selectedModelName,
  symptomOptions,
  selectedSymptom,
  search,
  searchResults,
  candidateRows,
  selectedRowNumber,
  onModelChange,
  onSymptomChange,
  onSearchChange,
  onSearchResultSelect,
  onSelect,
}: {
  modelOptions: string[];
  selectedModelName: string;
  symptomOptions: string[];
  selectedSymptom: string;
  search: string;
  searchResults: SwitchEstimateMasterItem[];
  candidateRows: SwitchEstimateMasterItem[];
  selectedRowNumber?: number;
  onModelChange: (modelName: string) => void;
  onSymptomChange: (symptom: string) => void;
  onSearchChange: (search: string) => void;
  onSearchResultSelect: (item: SwitchEstimateMasterItem) => void;
  onSelect: (item: SwitchEstimateMasterItem) => void;
}) {
  return (
    <section className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <Field label="機種名・型番・症状で検索" requirement="任意">
        <div className="grid min-w-0 gap-2">
          <input
            value={search}
            placeholder="機種名・型番・症状・修理内容で検索"
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            機種名、型番、症状、修理内容から検索できます。
          </p>
          {normalizeSearchText(search) ? (
            searchResults.length > 0 ? (
              <div className="grid max-h-72 min-w-0 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">
                {searchResults.map((item) => (
                  <button
                    key={item.rowNumber}
                    type="button"
                    onClick={() => onSearchResultSelect(item)}
                    className="min-w-0 rounded-md px-3 py-2 text-left transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="block break-words text-sm font-bold leading-6 text-slate-800">
                      {item.modelName} / {item.symptom}
                    </span>
                    <span className="block break-words text-xs font-semibold leading-5 text-slate-500">
                      {item.modelNumber || "型番なし"} / {item.estimatedRepairType}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                該当する登録データがありません。
              </p>
            )
          ) : null}
        </div>
      </Field>
      <p className="text-sm font-semibold leading-6 text-slate-600">
        検索を使わない場合は、機種、症状、登録データを順に選択してください。
      </p>
      <Field label="機種を選択" step="STEP 1" requirement="必須">
        <select value={selectedModelName} onChange={(event) => onModelChange(event.target.value)} className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
          <option value="">機種を選択してください</option>
          {modelOptions.map((modelName) => <option key={modelName} value={modelName}>{modelName}</option>)}
        </select>
      </Field>
      <Field label="症状を選択" step="STEP 2" requirement="必須">
        <select value={selectedSymptom} disabled={!selectedModelName || symptomOptions.length === 0} onChange={(event) => onSymptomChange(event.target.value)} className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">
          <option value="">{!selectedModelName ? "先に機種を選択してください" : "症状を選択してください"}</option>
          {symptomOptions.map((symptom) => <option key={symptom} value={symptom}>{symptom}</option>)}
        </select>
      </Field>
      <Field label="変更する登録データを選択" step="STEP 3" requirement="必須">
        <select
          value={selectedRowNumber ?? ""}
          disabled={!selectedSymptom || candidateRows.length === 0}
          onChange={(event) => {
            const rowNumber = Number(event.target.value);
            const item = candidateRows.find((row) => row.rowNumber === rowNumber);
            if (item) onSelect(item);
          }}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">{!selectedSymptom ? "先に症状を選択してください" : "変更するデータを選択してください"}</option>
          {candidateRows.map((item) => (
            <option key={item.rowNumber} value={item.rowNumber}>
              {item.modelNumber || "型番なし"} / {item.estimatedRepairType}
            </option>
          ))}
        </select>
      </Field>
    </section>
  );
}

function RepairItemMasterPanel({
  mode,
  form,
  rows,
  search,
  onModeChange,
  onSearchChange,
  onSelect,
  onFormChange,
}: {
  mode: RepairItemMode;
  form: RepairItemForm;
  rows: RepairItemMasterItem[];
  search: string;
  onModeChange: (mode: RepairItemMode) => void;
  onSearchChange: (search: string) => void;
  onSelect: (item: RepairItemMasterItem) => void;
  onFormChange: React.Dispatch<React.SetStateAction<RepairItemForm>>;
}) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedRepairItemKey, setSelectedRepairItemKey] = useState("");
  const activeRows = useMemo(
    () =>
      [...rows]
        .filter((item) => !isInactiveReceptionStatus(item.receptionStatus))
        .sort(compareRepairItemMasterRows),
    [rows],
  );
  const categoryOptions = useMemo(
    () => createRepairItemCategoryOptions(activeRows),
    [activeRows],
  );
  const repairItemOptions = useMemo(
    () => createRepairItemNameOptions(activeRows, selectedCategory),
    [activeRows, selectedCategory],
  );
  const candidateRows = useMemo(
    () =>
      getRepairItemCandidateRows(
        activeRows,
        selectedCategory,
        selectedRepairItemKey,
      ),
    [activeRows, selectedCategory, selectedRepairItemKey],
  );
  const searchResults = useMemo(
    () => searchRepairItemMasterRows(activeRows, search),
    [activeRows, search],
  );
  const showRepairItemForm = mode === "修理メニュー追加" || Boolean(form.rowNumber);

  useEffect(() => {
    if (mode !== "既存メニュー変更") {
      setSelectedCategory("");
      setSelectedRepairItemKey("");
      onSearchChange("");
    }
  }, [mode, onSearchChange]);

  useEffect(() => {
    if (
      mode === "既存メニュー変更" &&
      candidateRows.length === 1 &&
      form.rowNumber !== candidateRows[0].rowNumber
    ) {
      onSelect(candidateRows[0]);
    }
  }, [candidateRows, form.rowNumber, mode, onSelect]);

  return (
    <div className="grid min-w-0 gap-5">
      <SegmentedControl
        options={repairItemModes}
        value={mode}
        getLabel={(option) => repairItemModeLabels[option]}
        onChange={onModeChange}
      />
      {mode === "既存メニュー変更" ? (
        <RepairItemExistingDataSelector
          categories={categoryOptions}
          selectedCategory={selectedCategory}
          repairItemOptions={repairItemOptions}
          selectedRepairItemKey={selectedRepairItemKey}
          search={search}
          searchResults={searchResults}
          candidateRows={candidateRows}
          selectedRowNumber={form.rowNumber}
          onCategoryChange={(category) => {
            setSelectedCategory(category);
            setSelectedRepairItemKey("");
            onFormChange(createEmptyRepairItemForm());
          }}
          onRepairItemChange={(repairItemKey) => {
            setSelectedRepairItemKey(repairItemKey);
            onFormChange(createEmptyRepairItemForm());
          }}
          onSearchChange={(value) => {
            onSearchChange(value);
          }}
          onSearchResultSelect={(item) => {
            setSelectedCategory(item.category);
            setSelectedRepairItemKey(
              normalizeRepairItemName(
                item.repairItemName || item.displayName,
              ),
            );
            onSelect(item);
          }}
          onSelect={onSelect}
        />
      ) : null}
      {showRepairItemForm ? (
        <MasterSection
          title={mode === "修理メニュー追加" ? "修理メニューを追加" : "STEP 4 内容を編集"}
          description={
            mode === "修理メニュー追加"
              ? "基本料金を空欄にすると、価格種別と対応区分は既存仕様に沿って自動設定されます。"
              : "選択した登録データの内容を編集します。"
          }
        >
          <MasterFormGrid>
            <MasterSelectInput label="カテゴリ" required value={form.category} options={categoryOptions} onChange={(value) => onFormChange((current) => ({ ...current, category: value, repairItemName: mode === "修理メニュー追加" ? "" : current.repairItemName }))} />
            <MasterTextInput label="修理メニュー名" required value={form.repairItemName} onChange={(value) => onFormChange((current) => ({ ...current, repairItemName: value }))} />
            {mode === "既存メニュー変更" ? (
              <>
                <MasterTextInput label="並び順" value={form.sortOrder} onChange={(value) => onFormChange((current) => ({ ...current, sortOrder: value }))} />
                <MasterTextInput label="表示名" value={form.displayName} onChange={(value) => onFormChange((current) => ({ ...current, displayName: value }))} />
                <MasterSelectInput label="価格種別" required value={form.priceType} options={repairItemPriceTypes} onChange={(value) => onFormChange((current) => ({ ...current, priceType: value }))} />
                <MasterSelectInput label="対応区分" required value={form.repairStatus} options={supportStatusOptions} onChange={(value) => onFormChange((current) => ({ ...current, repairStatus: value }))} />
              </>
            ) : null}
            <MasterTextInput label="基本料金" value={form.standardPrice} onChange={(value) => onFormChange((current) => ({ ...current, standardPrice: value }))} />
            <MasterSelectInput label="対象機種カテゴリ" value={form.targetModelCategory} options={repairItemTargetCategories} onChange={(value) => onFormChange((current) => ({ ...current, targetModelCategory: value }))} />
            <MasterSelectInput label="受付状態" required value={form.receptionStatus} options={receptionStatusOptions} onChange={(value) => onFormChange((current) => ({ ...current, receptionStatus: value }))} />
            <MasterTextArea label="備考" value={form.note} onChange={(value) => onFormChange((current) => ({ ...current, note: value }))} />
          </MasterFormGrid>
        </MasterSection>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-500">
          カテゴリ、修理メニュー、登録データを選択すると編集フォームが表示されます。
        </p>
      )}
    </div>
  );
}

function RepairItemExistingDataSelector({
  categories,
  selectedCategory,
  repairItemOptions,
  selectedRepairItemKey,
  search,
  searchResults,
  candidateRows,
  selectedRowNumber,
  onCategoryChange,
  onRepairItemChange,
  onSearchChange,
  onSearchResultSelect,
  onSelect,
}: {
  categories: string[];
  selectedCategory: string;
  repairItemOptions: RepairItemNameOption[];
  selectedRepairItemKey: string;
  search: string;
  searchResults: RepairItemMasterItem[];
  candidateRows: RepairItemMasterItem[];
  selectedRowNumber?: number;
  onCategoryChange: (category: string) => void;
  onRepairItemChange: (repairItemKey: string) => void;
  onSearchChange: (search: string) => void;
  onSearchResultSelect: (item: RepairItemMasterItem) => void;
  onSelect: (item: RepairItemMasterItem) => void;
}) {
  return (
    <section className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold leading-6 text-slate-600">
        カテゴリ、修理メニュー、登録データを順に選択すると編集フォームが表示されます。
      </p>
      <Field label="修理メニュー名・表示名で検索" requirement="任意">
        <div className="grid min-w-0 gap-2">
          <input
            value={search}
            placeholder="修理メニュー名・表示名・対象機種カテゴリ・備考で検索"
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
          <p className="text-xs font-semibold leading-5 text-slate-500">
            カテゴリ未選択でも検索できます。
          </p>
          {normalizeRepairItemSearchText(search) ? (
            searchResults.length > 0 ? (
              <div className="grid max-h-72 min-w-0 gap-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-1">
                {searchResults.map((item) => (
                  <button
                    key={item.rowNumber}
                    type="button"
                    onClick={() => onSearchResultSelect(item)}
                    className="grid min-h-11 min-w-0 gap-0.5 rounded-md px-3 py-2 text-left transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <span className="truncate text-sm font-semibold leading-6 text-slate-700">
                      {item.displayName || item.repairItemName} / {item.category}
                    </span>
                    <span className="truncate text-xs font-semibold leading-5 text-slate-500">
                      対象機種カテゴリ：
                      {item.targetModelCategory || "指定なし"} /{" "}
                      {item.priceType || "価格種別なし"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-500">
                該当する修理メニューがありません。
              </p>
            )
          ) : null}
        </div>
      </Field>
      <Field label="カテゴリを選択" step="STEP 1" requirement="必須">
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">カテゴリを選択してください</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </Field>
      <Field label="修理メニューを選択" step="STEP 2" requirement="必須">
        <select
          value={selectedRepairItemKey}
          disabled={!selectedCategory || repairItemOptions.length === 0}
          onChange={(event) => onRepairItemChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {!selectedCategory
              ? "カテゴリを選択してください"
              : repairItemOptions.length === 0
                ? "該当する修理メニューがありません"
                : "修理メニューを選択してください"}
          </option>
          {repairItemOptions.map((option) => (
            <option key={option.key} value={option.key}>
              {option.label}
            </option>
          ))}
        </select>
      </Field>
      {selectedCategory && repairItemOptions.length === 0 ? (
        <p className="rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-500">
          修理メニューを追加から先に登録してください。
        </p>
      ) : null}
      <Field label="変更する登録データを選択" step="STEP 3" requirement="必須">
        <select
          value={selectedRowNumber ?? ""}
          disabled={!selectedRepairItemKey || candidateRows.length === 0}
          onChange={(event) => {
            const rowNumber = Number(event.target.value);
            const item = candidateRows.find((row) => row.rowNumber === rowNumber);
            if (item) {
              onSelect(item);
            }
          }}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {!selectedRepairItemKey
              ? "変更するデータを選択してください"
              : candidateRows.length === 0
                ? "該当する登録データがありません"
                : "変更するデータを選択してください"}
          </option>
          {candidateRows.map((item) => (
            <option key={item.rowNumber} value={item.rowNumber}>
              {formatRepairItemCandidateLabel(item)}
            </option>
          ))}
        </select>
      </Field>
      {selectedRepairItemKey && candidateRows.length === 1 ? (
        <p className="text-xs font-semibold leading-5 text-slate-500">
          候補が1件のため自動選択します。
        </p>
      ) : null}
    </section>
  );
}

function MasterSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <div className="min-w-0">
        <h3 className="text-base font-bold text-slate-950">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function MasterFormGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid min-w-0 gap-4 md:grid-cols-2">{children}</div>;
}

function MasterTextInput({
  label,
  required = false,
  value,
  placeholder,
  guide,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  placeholder?: string;
  guide?: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label} requirement={required ? "必須" : "任意"} guide={guide}>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      />
    </Field>
  );
}

function MasterTextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="md:col-span-2">
      <Field label={label} requirement="任意">
        <textarea
          value={value}
          rows={3}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 w-full max-w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </Field>
    </div>
  );
}

function MasterSelectInput({
  label,
  required = false,
  value,
  options,
  onChange,
}: {
  label: string;
  required?: boolean;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  const optionValues = value && !options.includes(value) ? [value, ...options] : options;

  return (
    <Field label={label} requirement={required ? "必須" : "任意"}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">未選択</option>
        {optionValues.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </Field>
  );
}

function AndroidManufacturerInput({
  value,
  manufacturers,
  onChange,
}: {
  value: string;
  manufacturers: string[];
  onChange: (value: string) => void;
}) {
  const isKnownManufacturer = value && manufacturers.includes(value);
  const selectValue = isKnownManufacturer ? value : value ? "__other__" : "";

  return (
    <div className="grid min-w-0 gap-3">
      <Field label="メーカー" requirement="必須">
        <select
          value={selectValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue === "__other__" ? "" : nextValue);
          }}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          <option value="">未選択</option>
          {manufacturers.map((manufacturer) => (
            <option key={manufacturer} value={manufacturer}>
              {manufacturer}
            </option>
          ))}
          <option value="__other__">その他（手入力）</option>
        </select>
      </Field>
      {selectValue === "__other__" ? (
        <Field label="新規メーカー名" requirement="必須">
          <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </Field>
      ) : null}
    </div>
  );
}

function AndroidFixedRepairCard({
  title,
  status,
  manualPrice,
  onStatusChange,
  onManualPriceChange,
}: {
  title: string;
  status: string;
  manualPrice: string;
  onStatusChange: (value: string) => void;
  onManualPriceChange: (value: string) => void;
}) {
  return (
    <section className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      <MasterSelectInput
        label="価格・対応設定"
        value={status}
        options={androidAdditionalRepairStatusOptions}
        onChange={onStatusChange}
      />
      <Field label="価格" requirement="任意">
        <input
          inputMode="numeric"
          value={manualPrice}
          onChange={(event) => onManualPriceChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </Field>
      <p className="text-xs font-semibold leading-5 text-slate-500">
        価格を変更すると、この機種だけの個別価格として保存されます。
      </p>
    </section>
  );
}

function AndroidAdditionalRepairSettingsPanel({
  definitions,
  settings,
  onSettingsChange,
}: {
  definitions: DynamicAndroidRepairDefinition[];
  settings: AndroidModelRepairSettingForm[];
  onSettingsChange: (settings: AndroidModelRepairSettingForm[]) => void;
}) {
  const settingsByName = new Map(
    settings.map((setting) => [
      normalizeRepairItemName(setting.repairItemName),
      setting,
    ]),
  );

  if (definitions.length === 0) {
    return null;
  }

  function updateSetting(
    repairItemName: string,
    patch: Partial<AndroidModelRepairSettingForm>,
  ) {
    const key = normalizeRepairItemName(repairItemName);
    const nextSettings = definitions.map((definition) => {
      const current =
        settingsByName.get(normalizeRepairItemName(definition.repairItemName)) ??
        createDefaultAndroidModelRepairSettingForm(definition.repairItemName);

      return normalizeRepairItemName(definition.repairItemName) === key
        ? { ...current, ...patch }
        : current;
    });

    onSettingsChange(nextSettings);
  }

  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-bold text-slate-800">
        追加修理メニュー設定（{definitions.length}件）
      </summary>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        修理メニュー管理で追加したAndroidメニューの、機種別の価格・対応設定を変更できます。未設定の場合は見積もり時に要確認として扱われます。{androidPriceSupportSettingHelpText}
      </p>
      <div className="mt-4 grid min-w-0 gap-4">
        {definitions.map((definition) => {
          const setting =
            settingsByName.get(normalizeRepairItemName(definition.repairItemName)) ??
            createDefaultAndroidModelRepairSettingForm(definition.repairItemName);
          const requiresPrice = setting.repairStatus === manualPriceStatusOption;

          return (
            <section
              key={definition.key}
              className="grid min-w-0 gap-3 rounded-md border border-slate-200 bg-white p-4"
            >
              <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                <p className="min-w-0 break-words text-sm font-bold text-slate-900">
                  {definition.label}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  基本料金：{formatRepairItemStandardPrice(definition.standardPrice)}
                </p>
              </div>
              <div className="grid min-w-0 gap-3 md:grid-cols-2">
                <MasterSelectInput
                  label="価格・対応設定"
                  required
                  value={setting.repairStatus}
                  options={androidAdditionalRepairStatusOptions}
                  onChange={(value) =>
                    updateSetting(definition.repairItemName, {
                      repairStatus: value,
                      customPrice:
                        value === manualPriceStatusOption
                          ? setting.customPrice
                          : setting.customPrice,
                    })
                  }
                />
                <MasterTextInput
                  label="個別価格"
                  required={requiresPrice}
                  value={setting.customPrice}
                  onChange={(value) =>
                    updateSetting(definition.repairItemName, { customPrice: value })
                  }
                />
                <MasterSelectInput
                  label="受付状態"
                  required
                  value={setting.receptionStatus}
                  options={receptionStatusOptions}
                  onChange={(value) =>
                    updateSetting(definition.repairItemName, {
                      receptionStatus: value,
                    })
                  }
                />
                <MasterTextInput
                  label="備考"
                  value={setting.note}
                  onChange={(value) =>
                    updateSetting(definition.repairItemName, { note: value })
                  }
                />
              </div>
            </section>
          );
        })}
      </div>
    </details>
  );
}

function MasterSearchSelect<T extends { rowNumber: number }>({
  title,
  description,
  search,
  rows,
  selectedRowNumber,
  placeholder,
  getLabel,
  onSearchChange,
  onSelect,
}: {
  title?: string;
  description?: string;
  search: string;
  rows: T[];
  selectedRowNumber?: number;
  placeholder: string;
  getLabel: (item: T) => string;
  onSearchChange: (search: string) => void;
  onSelect: (item: T) => void;
}) {
  return (
    <section className="grid min-w-0 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
      {title || description ? (
        <div className="min-w-0">
          {title ? (
            <h3 className="text-base font-bold text-slate-950">{title}</h3>
          ) : null}
          {description ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <Field label="対象データ検索" requirement="必須">
        <input
          value={search}
          placeholder={placeholder}
          onChange={(event) => onSearchChange(event.target.value)}
          className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </Field>
      <select
        value={selectedRowNumber ?? ""}
        onChange={(event) => {
          const rowNumber = Number(event.target.value);
          const item = rows.find((row) => row.rowNumber === rowNumber);
          if (item) {
            onSelect(item);
          }
        }}
        className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">対象を選択</option>
        {rows.slice(0, 200).map((item) => (
          <option key={item.rowNumber} value={item.rowNumber}>
            {getLabel(item)}
          </option>
        ))}
      </select>
      <p className="text-xs font-semibold leading-5 text-slate-500">
        表示件数: {Math.min(rows.length, 200)} / {rows.length}
      </p>
    </section>
  );
}

function AdminReportModal({
  form,
  feedback,
  sending,
  onChange,
  onCancel,
  onSubmit,
}: {
  form: AdminReportForm;
  feedback: AdminReportFeedback | null;
  sending: boolean;
  onChange: React.Dispatch<React.SetStateAction<AdminReportForm>>;
  onCancel: () => void;
  onSubmit: () => void | Promise<void>;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="max-h-[90vh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl sm:p-6">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">管理者へ報告</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={sending}
            className="min-h-11 shrink-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            キャンセル
          </button>
        </div>

        <div className="mt-5 grid min-w-0 gap-4">
          <Field label="報告種別">
            <select
              value={form.reportType}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  reportType: event.target.value as AdminReportType,
                }))
              }
              className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              {adminReportTypes.map((reportType) => (
                <option key={reportType} value={reportType}>
                  {reportType}
                </option>
              ))}
            </select>
          </Field>

          <Field label="対象カテゴリ">
            <input
              value={form.category}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
              className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="対象機種">
            <textarea
              value={form.targetModel}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  targetModel: event.target.value,
                }))
              }
              rows={3}
              className="min-h-24 w-full max-w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="対象修理内容 / 症状">
            <textarea
              value={form.targetRepairOrSymptom}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  targetRepairOrSymptom: event.target.value,
                }))
              }
              rows={4}
              className="min-h-28 w-full max-w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          <Field label="報告内容">
            <textarea
              value={form.message}
              onChange={(event) =>
                onChange((current) => ({
                  ...current,
                  message: event.target.value,
                }))
              }
              rows={6}
              placeholder={
                "例：Pixel 10 Pro の画面修理金額が実際の価格と異なるため確認をお願いします。\n例：Nintendo Switch 2 の症状候補に「ゲームカードを読み込まない」を追加してください。\n例：見積作成後の表示が崩れています。"
              }
              className="min-h-40 w-full max-w-full min-w-0 resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-base outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </Field>

          {feedback ? (
            <p
              className={`rounded-md px-4 py-3 text-sm font-semibold leading-6 ${
                feedback.tone === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : feedback.tone === "error"
                    ? "bg-red-50 text-red-700"
                    : "bg-slate-50 text-slate-500"
              }`}
            >
              {feedback.message}
            </p>
          ) : null}

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={onSubmit}
              disabled={sending}
              className="min-h-12 w-full min-w-0 rounded-md bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {sending ? "送信中..." : "送信"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={sending}
              className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              キャンセル
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function SwitchStockCheckModal({
  stockCheck,
  repairLines,
  onApply,
  onCancel,
}: {
  stockCheck?: SwitchStockCheckByLine;
  repairLines: SwitchEstimateLine[];
  onApply: (stockCheck: SwitchStockCheckByLine) => void;
  onCancel: () => void;
}) {
  const [lineStockCheck, setLineStockCheck] = useState<SwitchStockCheckByLine>(
    () => normalizeSwitchStockCheckByLine(stockCheck, repairLines),
  );

  function updateLineStockCheck(
    line: SwitchEstimateLine,
    nextCheck: SwitchStockCheck,
  ) {
    if (isSwitchOutsourceRequiredLine(line)) {
      return;
    }

    const lineKey = getSwitchRepairLineKey(line);
    setLineStockCheck((current) => ({
      ...current,
      [lineKey]: {
        status: nextCheck.status,
        workTime:
          nextCheck.status === "inStock"
            ? nextCheck.workTime ?? current[lineKey]?.workTime ?? "60分"
            : undefined,
      },
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <section className="flex max-h-[calc(100vh-3rem)] w-[calc(100vw-2rem)] max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex min-w-0 items-start justify-between gap-4">
          <h2 className="p-5 pb-0 text-xl font-bold text-slate-950 sm:p-6 sm:pb-0">
            在庫確認
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="m-5 min-h-11 shrink-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:m-6"
          >
            閉じる
          </button>
        </div>

        <div className="mt-5 grid min-w-0 gap-4 overflow-y-auto px-5 pb-5 sm:px-6 sm:pb-6">
          {repairLines.map((line) => {
            const lineKey = getSwitchRepairLineKey(line);
            const check = lineStockCheck[lineKey] ?? createDefaultSwitchStockCheck(line);
            const outsourceRequired = isSwitchOutsourceRequiredLine(line);

            return (
              <section
                key={lineKey}
                className="grid min-w-0 gap-4 rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="min-w-0">
                  <h3 className="break-words text-sm font-bold leading-6 text-slate-950">
                    {formatSwitchStockLineLabel(line)}
                  </h3>
                  {outsourceRequired ? (
                    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold leading-6 text-amber-900">
                      この修理は委託・預かり対応が必要です。
                    </p>
                  ) : null}
                </div>

                <Field label="在庫状況">
                  <select
                    value={check.status}
                    disabled={outsourceRequired}
                    onChange={(event) =>
                      updateLineStockCheck(line, {
                        status: event.target.value as SwitchStockStatus,
                        workTime: check.workTime,
                      })
                    }
                    className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition disabled:bg-slate-100 disabled:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="inStock">在庫あり</option>
                    <option value="outOfStock">在庫なし</option>
                    <option value="outsourced">委託・預かり対応</option>
                    <option value="needCheck">要確認</option>
                  </select>
                </Field>

                {check.status === "inStock" ? (
                  <Field label="作業時間">
                    <select
                      value={check.workTime ?? "60分"}
                      onChange={(event) =>
                        updateLineStockCheck(line, {
                          status: "inStock",
                          workTime: event.target.value as SwitchWorkTime,
                        })
                      }
                      className="min-h-12 w-full max-w-full min-w-0 rounded-lg border border-slate-300 bg-white px-4 text-base outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {SWITCH_WORK_TIME_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </Field>
                ) : null}
              </section>
            );
          })}

          <div className="grid min-w-0 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() =>
                onApply(normalizeSwitchStockCheckByLine(lineStockCheck, repairLines))
              }
              className="min-h-12 w-full min-w-0 rounded-md bg-slate-900 px-4 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              案内文に反映
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="min-h-12 w-full min-w-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              キャンセル
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function StockStatusOption({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 has-disabled:cursor-not-allowed has-disabled:bg-slate-100 has-disabled:text-slate-400">
      <input
        type="radio"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-blue-700"
      />
      <span className="min-w-0 break-words">{label}</span>
    </label>
  );
}

function Field({
  label,
  step,
  requirement,
  completed = false,
  guide,
  children,
}: {
  label: string;
  step?: string;
  requirement?: "必須" | "任意";
  completed?: boolean;
  guide?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 max-w-full flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {step ? <StepBadge>{step}</StepBadge> : null}
        <span className="min-w-0 break-words text-sm font-bold text-slate-800">
          {label}
        </span>
        {requirement ? <RequirementBadge tone={requirement} /> : null}
        {completed ? (
          <span className="inline-flex min-h-6 items-center rounded-full bg-emerald-50 px-2 text-xs font-bold text-emerald-700">
            入力済み
          </span>
        ) : null}
      </div>
      {guide ? <InputGuide message={guide} /> : null}
      {children}
    </div>
  );
}

function StepBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex min-h-6 shrink-0 items-center rounded-full bg-slate-900 px-2.5 text-xs font-bold text-white">
      {children}
    </span>
  );
}

function RequirementBadge({ tone }: { tone: "必須" | "任意" }) {
  return (
    <span
      className={`inline-flex min-h-6 shrink-0 items-center rounded-full px-2 text-xs font-bold ${
        tone === "必須"
          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {tone}
    </span>
  );
}

function InputGuide({ message }: { message: string }) {
  return (
    <p className="min-w-0 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-950">
      {message}
    </p>
  );
}

function SwitchModelSelector({
  availableModels,
  selectedModels,
  onAdd,
  onRemove,
  onQuantityChange,
}: {
  availableModels: string[];
  selectedModels: SwitchSelectedModel[];
  onAdd: (modelName: string) => void;
  onRemove: (modelName: string) => void;
  onQuantityChange: (modelName: string, quantity: number) => void;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="grid min-w-0 gap-2">
        <label
          htmlFor="switch-model-add"
          className="text-xs font-bold text-slate-600"
        >
          機種を追加
        </label>
        <select
          id="switch-model-add"
          value=""
          onChange={(event) => onAdd(event.target.value)}
          disabled={availableModels.length === 0}
          className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
        >
          <option value="">
            {availableModels.length > 0
              ? "機種を追加"
              : "追加できる機種はありません"}
          </option>
          {availableModels.map((modelName) => (
            <option key={modelName} value={modelName}>
              {modelName}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-w-0 gap-2">
        <p className="text-xs font-bold text-slate-600">選択済み機種</p>
        {selectedModels.length > 0 ? (
          <div className="grid min-w-0 gap-3">
            {selectedModels.map((model) => (
              <div
                key={model.modelName}
                className="grid min-w-0 gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800"
              >
                <p className="min-w-0 break-words leading-6">{model.modelName}</p>
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <label className="flex min-h-11 min-w-0 shrink-0 items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">
                      台数
                    </span>
                    <select
                      value={model.quantity}
                      onChange={(event) =>
                        onQuantityChange(
                          model.modelName,
                          Number(event.target.value),
                        )
                      }
                      className="min-h-11 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}台
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => onRemove(model.modelName)}
                    className="min-h-11 rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="min-w-0 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold leading-6 text-blue-950">
            <p>修理する機種を追加してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SwitchUnitInputCard({
  unit,
  unitNumber,
  symptomOptions,
  repairTypeOptions,
  disabledRepairTypeOptions,
  isEditing,
  symptomDropdownOpen,
  repairTypeDropdownOpen,
  onEdit,
  onClose,
  onSymptomDropdownOpenChange,
  onRepairTypeDropdownOpenChange,
  onToggleSymptom,
  onToggleRepairType,
}: {
  unit: SwitchUnitInput;
  unitNumber: number;
  symptomOptions: string[];
  repairTypeOptions: string[];
  disabledRepairTypeOptions: string[];
  isEditing: boolean;
  symptomDropdownOpen: boolean;
  repairTypeDropdownOpen: boolean;
  onEdit: () => void;
  onClose: () => void;
  onSymptomDropdownOpenChange: (open: boolean) => void;
  onRepairTypeDropdownOpenChange: (open: boolean) => void;
  onToggleSymptom: (symptom: string) => void;
  onToggleRepairType: (repairType: string) => void;
}) {
  const symptomCount = unit.selectedSymptoms.length;
  const repairTypeCount = unit.selectedRepairTypes.length;
  const completed = isSwitchUnitInputComplete(unit);
  const symptomSummary = formatSelectionPreview(unit.selectedSymptoms);
  const repairTypeSummary = formatSelectionPreview(unit.selectedRepairTypes);

  return (
    <section
      className={`min-w-0 rounded-lg border p-4 ${
        isEditing
          ? "border-blue-200 bg-blue-50/50"
          : completed
          ? "border-emerald-200 bg-emerald-50/40"
          : "border-amber-200 bg-amber-50/40"
      }`}
    >
      <div className="min-w-0 rounded-lg bg-white px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">端末 {unitNumber}</p>
            <h3 className="mt-1 break-words text-base font-bold text-slate-950">
              {formatSwitchUnitLabel(unit)}
            </h3>
          </div>
          <span
            className={`inline-flex min-h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-bold ${
              isEditing
                ? "bg-blue-100 text-blue-700"
                : completed
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isEditing ? "編集中" : completed ? "選択済み" : "未入力"}
          </span>
        </div>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          {isEditing
            ? "編集中：症状または修理内容のどちらかを選択してください。"
            : completed
            ? `選択済み：症状 ${symptomCount}件 / 修理内容 ${repairTypeCount}件`
            : "未入力：症状または修理内容のどちらかを選択してください。"}
        </p>
        {completed ? (
          <div className="mt-3 grid min-w-0 gap-1 text-sm font-semibold leading-6 text-slate-700">
            <p className="text-xs font-bold text-slate-500">選択内容：</p>
            {symptomSummary ? (
              <p className="min-w-0 break-words">症状：{symptomSummary}</p>
            ) : null}
            {repairTypeSummary ? (
              <p className="min-w-0 break-words">
                修理内容：{repairTypeSummary}
              </p>
            ) : null}
          </div>
        ) : null}
        {!isEditing ? (
          <button
            type="button"
            onClick={onEdit}
            className="mt-3 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            編集する
          </button>
        ) : null}
      </div>
      {isEditing ? (
        <div className="mt-4 grid min-w-0 gap-4">
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="break-words text-sm font-bold text-slate-900">
              症状から見積もりを作成する
            </h4>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              症状が分かる場合はこちらから選択してください。
            </p>
            <div className="mt-3">
              <MultiSelectDropdown
                options={symptomOptions}
                selectedValues={unit.selectedSymptoms}
                buttonLabel="症状を選択"
                emptyMessage="症状候補がありません。"
                unselectedMessage="症状を選択してください"
                open={symptomDropdownOpen}
                onOpenChange={onSymptomDropdownOpenChange}
                onToggle={onToggleSymptom}
              />
            </div>
          </section>
          <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
            <h4 className="break-words text-sm font-bold text-slate-900">
              修理内容から見積もりを作成する
            </h4>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              修理内容が分かっている場合はこちらから選択してください。
            </p>
            <div className="mt-3">
              <MultiSelectDropdown
                options={repairTypeOptions}
                selectedValues={unit.selectedRepairTypes}
                disabledValues={disabledRepairTypeOptions}
                disabledLabelSuffix="（症状から選択済み）"
                buttonLabel="修理内容を選択"
                emptyMessage="修理内容候補がありません。"
                unselectedMessage="修理内容を選択してください"
                open={repairTypeDropdownOpen}
                onOpenChange={onRepairTypeDropdownOpenChange}
                onToggle={onToggleRepairType}
              />
            </div>
          </section>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-800 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            閉じる
          </button>
        </div>
      ) : null}
    </section>
  );
}

function MultiSelectDropdown({
  options,
  selectedValues,
  disabledValues = [],
  disabledLabelSuffix = "",
  buttonLabel,
  emptyMessage,
  unselectedMessage,
  open,
  onOpenChange,
  onToggle,
}: {
  options: string[];
  selectedValues: string[];
  disabledValues?: string[];
  disabledLabelSuffix?: string;
  buttonLabel: string;
  emptyMessage: string;
  unselectedMessage: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggle: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open, onOpenChange]);

  if (options.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
        {emptyMessage}
      </div>
    );
  }

  const selectedCount = selectedValues.length;
  const displayLabel =
    selectedCount > 0 ? `${buttonLabel}（${selectedCount}件選択中）` : buttonLabel;
  const disabledValueSet = new Set(disabledValues);

  return (
    <div ref={containerRef} className="grid min-w-0 gap-3">
      <div className="relative min-w-0">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="flex min-h-12 w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <span className="min-w-0 break-words">{displayLabel}</span>
          <span className="shrink-0 text-sm text-slate-500">
            {open ? "▲" : "▼"}
          </span>
        </button>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+0.25rem)] z-20 max-h-80 min-w-0 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2 shadow-lg">
            {options.map((option) => {
              const selected = selectedValues.includes(option);
              const disabled = disabledValueSet.has(option);

              return (
                <button
                  key={option}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    if (!disabled) {
                      onToggle(option);
                    }
                  }}
                  className={`flex min-h-11 w-full min-w-0 items-start gap-3 rounded-md px-3 py-3 text-left text-base font-semibold transition ${
                    disabled
                      ? "cursor-not-allowed bg-slate-50 text-slate-400"
                      : selected
                      ? "bg-blue-50 text-blue-900"
                      : "text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      selected
                        ? "border-blue-700 bg-blue-700 text-white"
                        : "border-slate-300 bg-white text-transparent"
                    }`}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span className="min-w-0 whitespace-normal break-words">
                    {option}
                    {disabled ? disabledLabelSuffix : ""}
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-500">選択済み：</p>
        {selectedValues.length > 0 ? (
          <div className="mt-2 flex min-w-0 flex-wrap gap-2">
            {selectedValues.map((value) => (
              <span
                key={value}
                className="inline-flex min-h-11 max-w-full min-w-0 items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-900"
              >
                <span className="min-w-0 whitespace-normal break-words">{value}</span>
                <button
                  type="button"
                  onClick={() => onToggle(value)}
                  aria-label={`${value}を解除`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold text-blue-800 transition hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-2 min-w-0 rounded-md border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-500">
            {unselectedMessage}
          </p>
        )}
      </div>
    </div>
  );
}

function CheckboxList({
  options,
  selectedValues,
  disabled,
  onToggle,
}: {
  options: string[];
  selectedValues: string[];
  disabled: boolean;
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) {
    return (
      <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
        選択できる候補がありません。
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-3">
      {options.map((option) => (
        <OptionCheckbox
          key={option}
          checked={selectedValues.includes(option)}
          label={option}
          disabled={disabled}
          onChange={() => onToggle(option)}
        />
      ))}
    </div>
  );
}

function ButtonGrid<T extends string>({
  options,
  value,
  disabled = false,
  columns,
  activeTone = "blue",
  onChange,
}: {
  options: T[];
  value: T | string;
  disabled?: boolean;
  columns?: 2 | 3;
  activeTone?: "blue" | "green";
  onChange: (value: T) => void;
}) {
  const gridClass =
    columns === 3
      ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3"
      : columns === 2
        ? "grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2"
        : "flex min-w-0 flex-wrap gap-2";
  const buttonWidthClass = columns ? "w-full" : "max-w-full";
  const activeClass =
    activeTone === "green"
      ? "border-emerald-700 bg-emerald-700 text-white"
      : "border-blue-700 bg-blue-700 text-white";

  return (
    <div className={`${gridClass} w-full max-w-full`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option)}
          className={`min-h-11 ${buttonWidthClass} min-w-0 whitespace-normal break-words rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 ${
            value === option
              ? activeClass
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {option}
        </button>
      ))}
      {options.length === 0 ? (
        <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          選択できる候補がありません。
        </div>
      ) : null}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  getLabel,
  onChange,
}: {
  options: T[];
  value: T;
  getLabel?: (value: T) => string;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid w-full max-w-full min-w-0 grid-cols-2 gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`min-h-11 w-full min-w-0 whitespace-normal break-words rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            value === option
              ? "border-blue-700 bg-blue-700 text-white"
              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
          }`}
        >
          {getLabel ? getLabel(option) : option}
        </button>
      ))}
    </div>
  );
}

function StatusButtons({
  value,
  disabled = false,
  savingStatus,
  onChange,
}: {
  value: OrderStatus;
  disabled?: boolean;
  savingStatus?: OrderStatus;
  onChange: (value: OrderStatus) => void | Promise<void>;
}) {
  return (
    <div className="grid w-full max-w-full min-w-0 grid-cols-2 gap-3">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("受注")}
        className={`min-h-11 w-full min-w-0 rounded-md px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
          value === "受注" ? "bg-blue-700" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {savingStatus === "受注" ? "保存中..." : "受注"}
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("検討")}
        className={`min-h-11 w-full min-w-0 rounded-md px-4 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-slate-300 ${
          value === "検討"
            ? "bg-emerald-700"
            : "bg-emerald-600 hover:bg-emerald-700"
        }`}
      >
        {savingStatus === "検討" ? "保存中..." : "検討"}
      </button>
    </div>
  );
}

function OptionCheckbox({
  checked,
  label,
  price = "",
  disabled = false,
  onChange,
}: {
  checked: boolean;
  label: string;
  price?: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex min-h-16 w-full max-w-full min-w-0 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 has-disabled:cursor-not-allowed has-disabled:bg-slate-100 has-disabled:text-slate-400">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-blue-700"
      />
      <span className="min-w-0 break-words">
        {label}
        {price ? ` ${price}` : ""}
      </span>
    </label>
  );
}

function SwitchOptionCheckbox({
  checked,
  label,
  price,
  quantity,
  maxQuantity,
  onChange,
  onQuantityChange,
}: {
  checked: boolean;
  label: string;
  price: string;
  quantity: number;
  maxQuantity: number;
  onChange: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const quantityOptions = Array.from(
    { length: Math.min(5, Math.max(1, maxQuantity)) },
    (_, index) => index + 1,
  );

  return (
    <label className="flex min-h-16 w-full max-w-full min-w-0 cursor-pointer flex-wrap items-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-5 w-5 shrink-0 accent-blue-700"
      />
      <span className="min-w-0 flex-1 break-words">
        {label} {price}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-xs font-semibold text-slate-500">台数</span>
        <select
          value={quantity}
          onChange={(event) => onQuantityChange(Number(event.target.value))}
          onClick={(event) => event.stopPropagation()}
          className="min-h-11 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        >
          {quantityOptions.map((value) => (
            <option key={value} value={value}>
              {value}台
            </option>
          ))}
        </select>
      </span>
    </label>
  );
}

function InfoRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd
        className={`mt-1 whitespace-pre-line break-words leading-7 ${
          strong
            ? "text-lg font-bold text-slate-950"
            : "text-base font-semibold text-slate-900"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function CopyButton({
  label,
  copyKey,
  copiedKey,
  onCopy,
}: {
  label: string;
  copyKey: string;
  copiedKey: string;
  onCopy: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onCopy}
      className="min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {copiedKey === copyKey ? "コピー済み" : label}
    </button>
  );
}

function createEstimateResult({
  form,
  selectedOptions,
  selectedAndroidModel,
  switchRows,
  androidRepairMenus,
}: {
  form: FormState;
  selectedOptions: NormalizedOption[];
  selectedAndroidModel: AndroidPriceMasterItem | undefined;
  switchRows: SwitchEstimateMasterItem[];
  androidRepairMenus: AndroidRepairMenuItem[];
}): ConfirmedEstimate {
  const isSwitch = form.category === "Switch";
  const isOtherAndroidManufacturer =
    !isSwitch && form.maker === OTHER_ANDROID_MANUFACTURER;
  const switchRepairLines = isSwitch ? createSwitchRepairLines(form, switchRows) : [];
  const switchOptionLines = isSwitch
    ? createSwitchOptionLines(form, selectedOptions)
    : [];
  const switchTotal = sumSwitchLineTotals(switchRepairLines, switchOptionLines);
  const switchHasVariable = switchRepairLines.some((line) => line.isVariablePrice);
  const androidOptionTotal = !isSwitch
    ? selectedOptions.reduce((total, option) => total + option.price, 0)
    : 0;
  const quote: EstimateQuote = isSwitch
      ? {
        modelName: formatSwitchSelectedModels(form.switchSelectedModels),
        modelNumber: "-",
        symptom: formatSwitchUnitSelections(
          form.switchUnitInputs,
          "selectedSymptoms",
        ),
        repairType: formatSwitchRepairTypesForSave(switchRepairLines),
        price: switchTotal,
        status: "",
        note: uniqueValues(switchRepairLines.map((line) => line.note)).join("\n"),
        receptionStatus: uniqueValues(
          switchRepairLines.map((line) => line.receptionStatus),
        ).join("\n"),
      }
    : {
        modelName: isOtherAndroidManufacturer
          ? form.modelName || OTHER_ANDROID_MODEL_FALLBACK
          : form.modelName || "未選択",
        modelNumber:
          isOtherAndroidManufacturer
            ? "-"
            : form.modelNumber || selectedAndroidModel?.modelNumber || "未選択",
        symptom: "",
        repairType: form.repairType || "未選択",
        price: sumAndroidRepairMenuPrices(androidRepairMenus),
        status: uniqueValues(androidRepairMenus.map((menu) => menu.supportStatus)).join("、"),
        note: uniqueValues(androidRepairMenus.map((menu) => menu.note).filter(Boolean)).join("\n"),
        receptionStatus: "",
      };
  const estimateText =
    isSwitch
      ? formatSwitchTotalEstimate(switchTotal, switchHasVariable)
      : androidRepairMenus.length === 1 &&
          androidRepairMenus[0]?.key === ANDROID_POWER_FAILURE_MENU_KEY
        ? getAndroidPowerFailureEstimate(androidRepairMenus)
        : formatAndroidRepairEstimate(androidRepairMenus, androidOptionTotal);
  const customerMessage = isSwitch
    ? createSwitchCustomerMessage({
        form,
        repairLines: switchRepairLines,
        optionLines: switchOptionLines,
        total: switchTotal,
        hasVariablePrice: switchHasVariable,
      })
    : createAndroidMultipleRepairCustomerMessage({
        modelName: quote.modelName,
        menus: androidRepairMenus,
        optionTotal: androidOptionTotal,
        isOtherManufacturer: isOtherAndroidManufacturer,
      });
  const reservationCopy = createReservationCopy({
    form,
    quote,
    estimateText,
    selectedOptions,
    switchRepairLines,
    switchOptionLines,
  });

  return {
    form: {
      ...form,
      switchSelectedModels: form.switchSelectedModels.map((item) => ({ ...item })),
      switchUnitInputs: cloneSwitchUnitInputs(form.switchUnitInputs),
      switchOptionSelections: cloneSwitchOptionSelections(
        form.switchOptionSelections,
      ),
      selectedOptionKeys: [...form.selectedOptionKeys],
      selectedAndroidRepairKeys: [...form.selectedAndroidRepairKeys],
    },
    quote,
    estimateText,
    customerMessage,
    reservationCopy,
    selectedOptions: [...selectedOptions],
    switchRepairLines,
    switchOptionLines,
    unsupportedAndroidRepairLabels: uniqueValues(
      androidRepairMenus
        .filter((menu) => menu.isUnsupported)
        .map((menu) => menu.label),
    ),
  };
}

function createReservationCopy({
  form,
  quote,
  estimateText,
  selectedOptions,
  switchRepairLines,
  switchOptionLines,
  switchStockCheck,
}: {
  form: FormState;
  quote: EstimateQuote;
  estimateText: string;
  selectedOptions: NormalizedOption[];
  switchRepairLines: SwitchEstimateLine[];
  switchOptionLines: SwitchOptionLine[];
  switchStockCheck?: SwitchStockCheckByLine;
}) {
  const isSwitch = form.category === "Switch";
  const isOtherAndroidManufacturer =
    !isSwitch && form.maker === OTHER_ANDROID_MANUFACTURER;
  const isAndroidPowerFailureOnly =
    !isSwitch &&
    form.selectedAndroidRepairKeys.length === 1 &&
    form.selectedAndroidRepairKeys[0] === ANDROID_POWER_FAILURE_MENU_KEY;
  const includesAndroidDonorRepair =
    !isSwitch &&
    form.selectedAndroidRepairKeys.includes(ANDROID_DONOR_REPAIR_MENU_KEY);

  if (isSwitch) {
    const switchReservationCopy = [
      `ステータス: ${form.orderStatus}`,
      "カテゴリ: Switch",
      "機種:",
      ...formatSwitchSelectedModelLines(form.switchSelectedModels),
      "症状から見積もり:",
      formatSwitchUnitSelections(form.switchUnitInputs, "selectedSymptoms"),
      "修理内容から見積もり:",
      formatSwitchUnitSelections(form.switchUnitInputs, "selectedRepairTypes"),
      "修理内訳:",
      ...(switchRepairLines.length > 0
        ? switchRepairLines.map(formatSwitchRepairLine)
        : ["なし"]),
      "追加オプション:",
      ...(switchOptionLines.length > 0
        ? switchOptionLines.map(formatSwitchOptionLine)
        : ["なし"]),
      "お見積り合計:",
      estimateText,
      ...(switchStockCheck
        ? [
            "在庫・対応可否:",
            ...formatSwitchStockCheckReservationLines(
              switchStockCheck,
              switchRepairLines,
            ),
          ]
        : []),
    ];

    return switchReservationCopy.join("\n");
  }

  const androidReservationCopy = [
    `ステータス: ${form.orderStatus}`,
    "カテゴリ: Android",
    `メーカー: ${form.maker || "未選択"}`,
    `機種名: ${quote.modelName}`,
    `型番: ${quote.modelNumber}`,
    `修理内容: ${quote.repairType}`,
    `オプション: ${formatSelectedOptions(selectedOptions)}`,
    `${isAndroidPowerFailureOnly || includesAndroidDonorRepair ? "概算見積金額" : "見積金額"}: ${estimateText}`,
  ];

  if (
    !isAndroidPowerFailureOnly &&
    !includesAndroidDonorRepair &&
    (!isOtherAndroidManufacturer || form.repairType !== "画面修理")
  ) {
    androidReservationCopy.push(`対応区分: ${quote.status || "未選択"}`);
  }

  if (isOtherAndroidManufacturer && quote.note) {
    androidReservationCopy.push(`注意: ${quote.note}`);
  }

  if (includesAndroidDonorRepair) {
    androidReservationCopy.push(
      "料金内訳: 基本作業料金 税込 15,000円＋ドナー端末代（確認後にご案内）",
      "ドナー端末の納期: 3日〜1週間程度",
      "ドナー端末入荷後の作業時間: 3時間程度",
    );
  }

  return androidReservationCopy.join("\n");
}

function createEmptyAdminReportForm(category: InquiryCategory): AdminReportForm {
  return {
    reportType: adminReportTypes[0],
    category,
    targetModel: "",
    targetRepairOrSymptom: "",
    message: "",
  };
}

function createAdminReportInitialForm(
  form: FormState,
  estimate: ConfirmedEstimate,
): AdminReportForm {
  return {
    reportType: adminReportTypes[0],
    category: form.category,
    targetModel: createAdminReportTargetModel(form, estimate),
    targetRepairOrSymptom: createAdminReportTargetRepairOrSymptom(form, estimate),
    message: "",
  };
}

function createAdminReportTargetModel(
  form: FormState,
  estimate: ConfirmedEstimate,
) {
  if (form.category === "Switch") {
    return form.switchSelectedModels.length > 0
      ? formatSwitchSelectedModels(form.switchSelectedModels)
      : estimate.quote.modelName;
  }

  return form.modelName || estimate.quote.modelName || "";
}

function createAdminReportTargetRepairOrSymptom(
  form: FormState,
  estimate: ConfirmedEstimate,
) {
  if (form.category === "Switch") {
    const lines = form.switchUnitInputs.flatMap((unit) => {
      const values = [
        ...unit.selectedSymptoms.map((symptom) => `症状: ${symptom}`),
        ...unit.selectedRepairTypes.map((repairType) => `修理内容: ${repairType}`),
      ];

      return values.map((value) => `${formatSwitchUnitLabel(unit)} / ${value}`);
    });

    return lines.length > 0
      ? lines.join("\n")
      : [estimate.quote.symptom, estimate.quote.repairType]
          .filter(Boolean)
          .join("\n");
  }

  return form.repairType || estimate.quote.repairType || "";
}

function createAdminReportEstimateSummary(estimate: ConfirmedEstimate) {
  if (estimate.form.category === "Switch") {
    return [
      "機種:",
      estimate.quote.modelName || "未選択",
      "",
      "修理内訳:",
      ...(estimate.switchRepairLines.length > 0
        ? estimate.switchRepairLines.map(formatSwitchRepairLine)
        : ["なし"]),
      "",
      "追加オプション:",
      ...(estimate.switchOptionLines.length > 0
        ? estimate.switchOptionLines.map(formatSwitchOptionLine)
        : ["なし"]),
      "",
      "合計:",
      estimate.estimateText,
      ...(estimate.switchStockCheck
        ? [
            "",
            "在庫・対応可否:",
            ...formatSwitchStockCheckReservationLines(
              estimate.switchStockCheck,
              estimate.switchRepairLines,
            ),
          ]
        : []),
    ].join("\n");
  }

  const includesDonorRepair = estimate.form.selectedAndroidRepairKeys.includes(
    ANDROID_DONOR_REPAIR_MENU_KEY,
  );
  const isPowerFailureOnly =
    estimate.form.selectedAndroidRepairKeys.length === 1 &&
    estimate.form.selectedAndroidRepairKeys[0] === ANDROID_POWER_FAILURE_MENU_KEY;

  return [
    `機種: ${estimate.quote.modelName}`,
    `修理内容: ${estimate.quote.repairType}`,
    `${isPowerFailureOnly || includesDonorRepair ? "概算見積金額" : "見積金額"}: ${estimate.estimateText}`,
    ...(includesDonorRepair
      ? [
          "料金内訳: 基本作業料金 税込 15,000円＋ドナー端末代（確認後にご案内）",
          "ドナー端末の納期: 3日〜1週間程度",
          "ドナー端末入荷後の作業時間: 3時間程度",
        ]
      : []),
  ].join("\n");
}

function createEmptyAndroidMasterForm(): AndroidMasterForm {
  return {
    sortOrder: "",
    manufacturer: "",
    modelName: "",
    modelNumber: "",
    screenPrice: "",
    screenStatus: "",
    batteryManualPrice: stringValue(ANDROID_FIXED_REPAIR_PRICES.battery),
    batteryStatus: "",
    chargePortManualPrice: stringValue(ANDROID_FIXED_REPAIR_PRICES.chargePort),
    chargePortStatus: "",
    cameraLensManualPrice: stringValue(ANDROID_FIXED_REPAIR_PRICES.cameraLens),
    cameraLensStatus: "",
    sleepButtonManualPrice: stringValue(ANDROID_FIXED_REPAIR_PRICES.sleepButton),
    sleepButtonStatus: "",
    volumeButtonManualPrice: stringValue(ANDROID_FIXED_REPAIR_PRICES.volumeButton),
    volumeButtonStatus: "",
    note: "",
    receptionStatus: "受付可",
    additionalRepairSettings: [],
  };
}

function createEmptySwitchMasterForm(): SwitchMasterForm {
  return {
    sortOrder: "",
    modelName: "",
    modelNumber: "",
    symptom: "",
    estimatedRepairType: "",
    repairPrice: "",
    repairStatus: "店舗対応可",
    note: "",
    receptionStatus: "受付可",
  };
}

function createEmptyRepairItemForm(): RepairItemForm {
  return {
    sortOrder: "",
    category: "Android",
    repairItemName: "",
    displayName: "",
    priceType: "固定価格",
    standardPrice: "",
    repairStatus: "要確認",
    targetModelCategory: "",
    note: "",
    receptionStatus: "受付可",
  };
}

function createAndroidMasterFormFromItem(
  item: AndroidPriceMasterItem,
  repairItemMaster: RepairItemMasterItem[] = [],
  androidModelRepairSettings: AndroidModelRepairSettingItem[] = [],
): AndroidMasterForm {
  const screenStatus = parseManualPriceStatus(item.screenStatus);
  const batteryStatus = parseAndroidFixedStatusValue(
    item.batteryStatus,
    ANDROID_FIXED_REPAIR_PRICES.battery,
  );
  const chargePortStatus = parseAndroidFixedStatusValue(
    item.chargePortStatus,
    ANDROID_FIXED_REPAIR_PRICES.chargePort,
  );
  const cameraLensStatus = parseAndroidFixedStatusValue(
    item.cameraLensStatus,
    ANDROID_FIXED_REPAIR_PRICES.cameraLens,
  );
  const sleepButtonStatus = parseAndroidFixedStatusValue(
    item.sleepButtonStatus,
    ANDROID_FIXED_REPAIR_PRICES.sleepButton,
  );
  const volumeButtonStatus = parseAndroidFixedStatusValue(
    item.volumeButtonStatus,
    ANDROID_FIXED_REPAIR_PRICES.volumeButton,
  );

  return {
    rowNumber: item.rowNumber,
    sortOrder: stringValue(item.sortOrder),
    manufacturer: item.manufacturer,
    modelName: item.modelName,
    modelNumber: item.modelNumber,
    screenPrice: stringValue(item.screenPrice) || screenStatus.manualPrice,
    screenStatus: screenStatus.status,
    batteryManualPrice: batteryStatus.manualPrice,
    batteryStatus: batteryStatus.status,
    chargePortManualPrice: chargePortStatus.manualPrice,
    chargePortStatus: chargePortStatus.status,
    cameraLensManualPrice: cameraLensStatus.manualPrice,
    cameraLensStatus: cameraLensStatus.status,
    sleepButtonManualPrice: sleepButtonStatus.manualPrice,
    sleepButtonStatus: sleepButtonStatus.status,
    volumeButtonManualPrice: volumeButtonStatus.manualPrice,
    volumeButtonStatus: volumeButtonStatus.status,
    note: item.note,
    receptionStatus: item.receptionStatus,
    additionalRepairSettings: createAndroidModelRepairSettingForms(
      repairItemMaster,
      androidModelRepairSettings,
      item,
    ),
  };
}

function createSwitchMasterFormFromItem(
  item: SwitchEstimateMasterItem,
): SwitchMasterForm {
  return {
    rowNumber: item.rowNumber,
    sortOrder: stringValue(item.sortOrder),
    modelName: item.modelName,
    modelNumber: item.modelNumber,
    symptom: item.symptom,
    estimatedRepairType: item.estimatedRepairType,
    repairPrice: stringValue(item.repairPrice),
    repairStatus: item.repairStatus,
    note: item.note,
    receptionStatus: item.receptionStatus,
  };
}

function createRepairItemFormFromItem(item: RepairItemMasterItem): RepairItemForm {
  return {
    rowNumber: item.rowNumber,
    sortOrder: stringValue(item.sortOrder),
    category: item.category,
    repairItemName: item.repairItemName,
    displayName: item.displayName,
    priceType: item.priceType,
    standardPrice: stringValue(item.standardPrice),
    repairStatus: item.repairStatus,
    targetModelCategory: item.targetModelCategory,
    note: item.note,
    receptionStatus: item.receptionStatus,
  };
}

function filterMasterRows<T>(
  rows: T[],
  search: string,
  getSearchText: (item: T) => string,
) {
  const query = normalizeSearchText(search);

  if (!query) {
    return rows;
  }

  return rows.filter((item) => normalizeSearchText(getSearchText(item)).includes(query));
}

function createAndroidModelOptions(
  rows: AndroidPriceMasterItem[],
  manufacturer: string,
): AndroidMasterModelOption[] {
  if (!manufacturer) {
    return [];
  }

  const options = new Map<string, AndroidMasterModelOption>();

  rows.forEach((item) => {
    if (item.manufacturer !== manufacturer) {
      return;
    }

    const key = normalizeModelName(item.modelName);
    if (!key || options.has(key)) {
      return;
    }

    options.set(key, {
      key,
      label: item.modelName,
    });
  });

  return Array.from(options.values());
}

function searchAndroidMasterRows(
  rows: AndroidPriceMasterItem[],
  search: string,
) {
  const query = normalizeAndroidModelSearchText(search);
  const queryTokens = getAndroidModelSearchTokens(search);

  if (!query) {
    return [];
  }

  return rows.filter((item) => {
    const target = createAndroidModelSearchTarget(
      `${item.manufacturer} ${item.modelName} ${item.modelNumber}`,
    );

    return (
      target.includes(query) ||
      queryTokens.every((token) => target.includes(token))
    );
  });
}

function searchSwitchMasterRows(
  rows: SwitchEstimateMasterItem[],
  search: string,
) {
  const query = normalizeSearchText(search);

  if (!query) {
    return [];
  }

  return rows.filter((item) =>
    normalizeSearchText(
      `${item.modelName} ${item.modelNumber} ${item.symptom} ${item.estimatedRepairType}`,
    ).includes(query),
  );
}

function getAndroidMasterCandidateRows(
  rows: AndroidPriceMasterItem[],
  manufacturer: string,
  modelKey: string,
) {
  if (!manufacturer || !modelKey) {
    return [];
  }

  return rows.filter(
    (item) =>
      item.manufacturer === manufacturer &&
      normalizeModelName(item.modelName) === modelKey,
  );
}

function formatAndroidMasterSearchResultLabel(item: AndroidPriceMasterItem) {
  return [
    item.modelName,
    item.manufacturer,
    item.modelNumber || "型番なし",
  ].join(" / ");
}

function formatAndroidMasterCandidateLabel(item: AndroidPriceMasterItem) {
  return [
    item.modelName,
    item.modelNumber ? `型番: ${item.modelNumber}` : "型番なし",
    `画面: ${formatMasterPriceValue(item.screenPrice)}`,
    `受付: ${item.receptionStatus || "-"}`,
    `行: ${item.rowNumber}`,
  ].join(" / ");
}

function createRepairItemNameOptions(
  rows: RepairItemMasterItem[],
  category: string,
): RepairItemNameOption[] {
  if (!category) {
    return [];
  }

  const options = new Map<string, RepairItemNameOption>();

  rows.forEach((item) => {
    if (item.category !== category) {
      return;
    }

    const key = normalizeRepairItemName(
      item.repairItemName || item.displayName,
    );
    if (!key || options.has(key)) {
      return;
    }

    options.set(key, {
      key,
      label: item.repairItemName || item.displayName,
    });
  });

  return Array.from(options.values());
}

function searchRepairItemMasterRows(
  rows: RepairItemMasterItem[],
  search: string,
) {
  const query = normalizeRepairItemSearchText(search);

  if (!query) {
    return [];
  }

  return rows.filter((item) =>
    normalizeRepairItemSearchText(
      [
        item.category,
        item.repairItemName,
        item.displayName,
        item.targetModelCategory,
        item.note,
      ].join(" "),
    ).includes(query),
  );
}

function createRepairItemCategoryOptions(rows: RepairItemMasterItem[]) {
  return uniqueValues([
    ...categories,
    ...rows.map((item) => item.category),
  ]);
}

function getRepairItemCandidateRows(
  rows: RepairItemMasterItem[],
  category: string,
  repairItemKey: string,
) {
  if (!category || !repairItemKey) {
    return [];
  }

  return rows.filter(
    (item) =>
      item.category === category &&
      normalizeRepairItemName(item.repairItemName || item.displayName) ===
        repairItemKey,
  );
}

function formatRepairItemCandidateLabel(item: RepairItemMasterItem) {
  return [
    item.repairItemName,
    `表示名: ${item.displayName || "-"}`,
    item.priceType || "-",
    formatRepairItemStandardPrice(item.standardPrice),
    item.repairStatus || "-",
    item.targetModelCategory || "対象指定なし",
    `受付: ${item.receptionStatus || "-"}`,
    `行: ${item.rowNumber}`,
  ].join(" / ");
}

function formatRepairItemStandardPrice(value: number | string) {
  const text = stringValue(value);

  return text ? `${text}円` : "価格なし";
}

function compareRepairItemMasterRows(
  a: RepairItemMasterItem,
  b: RepairItemMasterItem,
) {
  return (
    compareSortOrder(a, b) ||
    (a.repairItemName || a.displayName).localeCompare(
      b.repairItemName || b.displayName,
      "ja",
    )
  );
}

function createDynamicAndroidRepairDefinitions(
  repairItemMaster: RepairItemMasterItem[],
): DynamicAndroidRepairDefinition[] {
  const definitions = new Map<string, DynamicAndroidRepairDefinition>();

  repairItemMaster
    .filter((item) => !isInactiveReceptionStatus(item.receptionStatus))
    .forEach((item) => {
      const label = stringValue(item.displayName || item.repairItemName);
      const key = normalizeRepairItemName(label);

      if (
        item.category !== "Android" ||
        !key ||
        (isAndroidBasicRepairName(label) &&
          !isAndroidSpeakerRepairName(label)) ||
        (isAndroidBasicRepairName(item.repairItemName) &&
          !isAndroidSpeakerRepairName(item.repairItemName)) ||
        isInactiveAndroidRepairStatus(item.repairStatus) ||
        definitions.has(key)
      ) {
        return;
      }

      definitions.set(key, {
        key,
        label,
        repairItemName: item.repairItemName,
        standardPrice: item.standardPrice,
        note: item.note,
        receptionStatus: item.receptionStatus,
      });
    });

  return Array.from(definitions.values());
}

function createAvailableDynamicAndroidRepairDefinitions(
  repairItemMaster: RepairItemMasterItem[],
  androidModelRepairSettings: AndroidModelRepairSettingItem[],
  selectedAndroidModel?: AndroidPriceMasterItem,
) {
  const definitions = createDynamicAndroidRepairDefinitions(repairItemMaster);

  if (!selectedAndroidModel) {
    return definitions;
  }

  return definitions.filter((definition) => {
    const setting = findAndroidModelRepairSetting(
      androidModelRepairSettings,
      selectedAndroidModel,
      definition.repairItemName,
    );

    return !setting || !isInactiveReceptionStatus(setting.receptionStatus);
  });
}

function isInactiveReceptionStatus(value: string) {
  const normalized = value.trim();

  return (
    normalized === "受付停止" ||
    normalized === "受付停止中" ||
    normalized === "非対応" ||
    normalized === "削除済み"
  );
}

function createAndroidModelRepairSettingForms(
  repairItemMaster: RepairItemMasterItem[],
  androidModelRepairSettings: AndroidModelRepairSettingItem[],
  model: Pick<AndroidMasterForm, "manufacturer" | "modelName" | "modelNumber">,
  currentSettings: AndroidModelRepairSettingForm[] = [],
) {
  const currentByName = new Map(
    currentSettings.map((setting) => [
      normalizeRepairItemName(setting.repairItemName),
      setting,
    ]),
  );

  return createDynamicAndroidRepairDefinitions(repairItemMaster).map((definition) => {
    const key = normalizeRepairItemName(definition.repairItemName);
    const current = currentByName.get(key);

    if (current) {
      return current;
    }

    const savedSetting = findAndroidModelRepairSetting(
      androidModelRepairSettings,
      model,
      definition.repairItemName,
    );

    return savedSetting
      ? createAndroidModelRepairSettingFormFromItem(savedSetting)
      : createDefaultAndroidModelRepairSettingForm(definition.repairItemName);
  });
}

function syncAndroidAdditionalRepairSettings(
  form: AndroidMasterForm,
  repairItemMaster: RepairItemMasterItem[],
  androidModelRepairSettings: AndroidModelRepairSettingItem[],
) {
  const nextSettings = createAndroidModelRepairSettingForms(
    repairItemMaster,
    androidModelRepairSettings,
    form,
    form.additionalRepairSettings,
  );

  return sameAndroidModelRepairSettingForms(
    form.additionalRepairSettings,
    nextSettings,
  )
    ? form
    : {
        ...form,
        additionalRepairSettings: nextSettings,
      };
}

function createDefaultAndroidModelRepairSettingForm(
  repairItemName: string,
): AndroidModelRepairSettingForm {
  return {
    repairItemName,
    repairStatus: "要確認",
    customPrice: "",
    note: "",
    receptionStatus: "受付可",
  };
}

function createAndroidModelRepairSettingFormFromItem(
  item: AndroidModelRepairSettingItem,
): AndroidModelRepairSettingForm {
  return {
    repairItemName: item.repairItemName,
    repairStatus: item.repairStatus || "要確認",
    customPrice: stringValue(item.customPrice),
    note: item.note,
    receptionStatus: item.receptionStatus || "受付可",
  };
}

function sameAndroidModelRepairSettingForms(
  left: AndroidModelRepairSettingForm[],
  right: AndroidModelRepairSettingForm[],
) {
  return (
    left.length === right.length &&
    left.every((item, index) => {
      const other = right[index];

      return (
        other &&
        item.repairItemName === other.repairItemName &&
        item.repairStatus === other.repairStatus &&
        item.customPrice === other.customPrice &&
        item.note === other.note &&
        item.receptionStatus === other.receptionStatus
      );
    })
  );
}

function findAndroidModelRepairSetting(
  settings: AndroidModelRepairSettingItem[],
  model: Pick<AndroidMasterForm, "manufacturer" | "modelName" | "modelNumber">,
  repairItemName: string,
) {
  const modelKey = createAndroidModelRepairSettingLookupKey({
    manufacturer: model.manufacturer,
    modelName: model.modelName,
    modelNumber: model.modelNumber,
    repairItemName,
  });

  if (!modelKey) {
    return undefined;
  }

  return settings.find(
    (setting) =>
      createAndroidModelRepairSettingLookupKey(setting) === modelKey,
  );
}

function createAndroidModelRepairSettingLookupKey({
  manufacturer,
  modelName,
  modelNumber,
  repairItemName,
}: {
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  repairItemName: string;
}) {
  const normalizedManufacturer = normalizeModelName(manufacturer);
  const normalizedModelName = normalizeModelName(modelName);
  const normalizedRepairItemName = normalizeRepairItemName(repairItemName);

  if (!normalizedManufacturer || !normalizedModelName || !normalizedRepairItemName) {
    return "";
  }

  return [
    normalizedManufacturer,
    normalizedModelName,
    normalizeModelName(modelNumber),
    normalizedRepairItemName,
  ].join("\t");
}

function formatMasterPriceValue(value: number | string) {
  const text = stringValue(value);

  return text ? `${text}円` : "-";
}

function parseManualPriceStatus(value: string) {
  const normalized = stringValue(value).normalize("NFKC").replace(/,/g, "");

  if (normalized === manualPriceStatusOption || normalized === manualPriceStoredStatus) {
    return { status: manualPriceStatusOption, manualPrice: "" };
  }

  if (!normalized.startsWith(manualPriceStoredPrefix)) {
    return { status: stringValue(value), manualPrice: "" };
  }

  return {
    status: manualPriceStatusOption,
    manualPrice: normalized.slice(manualPriceStoredPrefix.length).trim(),
  };
}

function parseAndroidFixedStatusValue(
  value: string,
  defaultPrice: number,
) {
  const parsedManualStatus = parseManualPriceStatus(value);

  if (
    parsedManualStatus.manualPrice ||
    parsedManualStatus.status === manualPriceStatusOption
  ) {
    return {
      status: parsedManualStatus.status,
      manualPrice: parsedManualStatus.manualPrice || stringValue(defaultPrice),
    };
  }

  const normalized = stringValue(value).normalize("NFKC").replace(/,/g, "");
  const separatorIndex = normalized.lastIndexOf(androidStatusPriceSeparator);

  if (separatorIndex <= 0) {
    return {
      status: parsedManualStatus.status,
      manualPrice: stringValue(defaultPrice),
    };
  }

  const status = normalized.slice(0, separatorIndex).trim();
  const manualPrice = normalizeManualPrice(
    normalized.slice(separatorIndex + androidStatusPriceSeparator.length),
  );

  return {
    status: status || parsedManualStatus.status,
    manualPrice: manualPrice || stringValue(defaultPrice),
  };
}

function validateAndroidManualPrices(form: AndroidMasterForm) {
  const missingLabels = [
    form.screenStatus === manualPriceStatusOption &&
    !normalizeManualPrice(form.screenPrice)
      ? "画面修理"
      : "",
  ].filter(Boolean);
  const invalidLabels = [
    hasInvalidManualPrice(form.screenPrice) ? "画面修理" : "",
    hasInvalidManualPrice(form.batteryManualPrice)
      ? "バッテリー"
      : "",
    hasInvalidManualPrice(form.chargePortManualPrice)
      ? "充電口"
      : "",
    hasInvalidManualPrice(form.cameraLensManualPrice)
      ? "カメラレンズ"
      : "",
    hasInvalidManualPrice(form.sleepButtonManualPrice)
      ? "スリープボタン"
      : "",
    hasInvalidManualPrice(form.volumeButtonManualPrice)
      ? "音量ボタン"
      : "",
  ].filter(Boolean);

  if (missingLabels.length > 0) {
    return `${missingLabels.join("、")}の手動設定金額を半角数字で入力してください。`;
  }

  return invalidLabels.length > 0
    ? `${invalidLabels.join("、")}の価格を半角数字で入力してください。`
    : "";
}

function validateAndroidAdditionalRepairSettings(form: AndroidMasterForm) {
  const missingLabels = form.additionalRepairSettings
    .filter(
      (setting) =>
        setting.repairStatus === manualPriceStatusOption &&
        !normalizeManualPrice(setting.customPrice),
    )
    .map((setting) => setting.repairItemName);

  return missingLabels.length > 0
    ? `${missingLabels.join("、")}の個別価格を半角数字で入力してください。`
    : "";
}

function createAndroidMasterPayloadItem(form: AndroidMasterForm) {
  return {
    rowNumber: form.rowNumber,
    sortOrder: form.sortOrder,
    manufacturer: form.manufacturer.trim(),
    modelName: form.modelName.trim(),
    modelNumber: form.modelNumber.trim(),
    screenPrice:
      form.screenStatus === manualPriceStatusOption
        ? normalizeManualPrice(form.screenPrice)
        : form.screenPrice.trim(),
    screenStatus:
      form.screenStatus === manualPriceStatusOption
        ? manualPriceStoredStatus
        : form.screenStatus,
    batteryStatus: createAndroidStatusPayloadValue(
      form.batteryStatus,
      form.batteryManualPrice,
      ANDROID_FIXED_REPAIR_PRICES.battery,
    ),
    chargePortStatus: createAndroidStatusPayloadValue(
      form.chargePortStatus,
      form.chargePortManualPrice,
      ANDROID_FIXED_REPAIR_PRICES.chargePort,
    ),
    cameraLensStatus: createAndroidStatusPayloadValue(
      form.cameraLensStatus,
      form.cameraLensManualPrice,
      ANDROID_FIXED_REPAIR_PRICES.cameraLens,
    ),
    sleepButtonStatus: createAndroidStatusPayloadValue(
      form.sleepButtonStatus,
      form.sleepButtonManualPrice,
      ANDROID_FIXED_REPAIR_PRICES.sleepButton,
    ),
    volumeButtonStatus: createAndroidStatusPayloadValue(
      form.volumeButtonStatus,
      form.volumeButtonManualPrice,
      ANDROID_FIXED_REPAIR_PRICES.volumeButton,
    ),
    note: form.note.trim(),
    receptionStatus: form.receptionStatus,
  };
}

function createAndroidMasterPayloadForm(
  form: AndroidMasterForm,
  mode: AndroidMasterMode,
  rows: AndroidPriceMasterItem[],
): AndroidMasterForm {
  if (mode !== "新規機種追加" || form.sortOrder.trim()) {
    return form;
  }

  return {
    ...form,
    sortOrder: stringValue(getNextAndroidSortOrder(rows, form.manufacturer)),
  };
}

function getNextAndroidSortOrder(
  rows: AndroidPriceMasterItem[],
  manufacturer: string,
) {
  const sortOrders = rows
    .filter((item) => item.manufacturer === manufacturer.trim())
    .map((item) => Number(item.sortOrder))
    .filter(Number.isFinite);

  if (sortOrders.length === 0) {
    return 10;
  }

  return Math.min(...sortOrders) - 10;
}

function createAndroidStatusPayloadValue(
  status: string,
  manualPrice: string,
  defaultPrice: number,
) {
  const normalizedStatus = status || "要確認";
  const normalizedPrice =
    normalizeManualPrice(manualPrice) || stringValue(defaultPrice);

  return normalizedStatus === manualPriceStatusOption
    ? `${manualPriceStoredPrefix}${normalizedPrice}`
    : `${normalizedStatus}${androidStatusPriceSeparator}${normalizedPrice}`;
}

function normalizeManualPrice(value: string) {
  const normalized = value.normalize("NFKC").trim().replace(/,/g, "");

  return /^\d+$/.test(normalized) ? normalized : "";
}

function hasInvalidManualPrice(value: string) {
  return Boolean(value.trim()) && !normalizeManualPrice(value);
}

function findAndroidDuplicateCandidates(
  rows: AndroidPriceMasterItem[],
  form: AndroidMasterForm,
) {
  const manufacturer = normalizeModelName(form.manufacturer);
  const modelName = normalizeModelName(form.modelName);
  const modelNumber = normalizeModelName(form.modelNumber);

  if (!manufacturer || !modelName) {
    return [];
  }

  return rows.filter((item) => {
    if (form.rowNumber && item.rowNumber === form.rowNumber) {
      return false;
    }

    const sameManufacturer = normalizeModelName(item.manufacturer) === manufacturer;
    const sameModelName = normalizeModelName(item.modelName) === modelName;
    const rowModelNumber = normalizeModelName(item.modelNumber);
    const modelNumberIsClose =
      !modelNumber || !rowModelNumber || rowModelNumber === modelNumber;

    return sameManufacturer && sameModelName && modelNumberIsClose;
  });
}

function validateMasterForm({
  activeTab,
  androidMode,
  switchMode,
  repairItemMode,
  androidForm,
  switchForm,
  repairItemForm,
}: {
  activeTab: MasterManagementTab;
  androidMode: AndroidMasterMode;
  switchMode: SwitchMasterMode;
  repairItemMode: RepairItemMode;
  androidForm: AndroidMasterForm;
  switchForm: SwitchMasterForm;
  repairItemForm: RepairItemForm;
}) {
  if (activeTab === "Android") {
    if (androidMode === "既存データ変更" && !androidForm.rowNumber) {
      return "変更対象を選択してください。";
    }

    const requiredValidation = validateRequiredMasterFields(androidForm, [
      ["manufacturer", "メーカー"],
      ["modelName", "機種名"],
      ["receptionStatus", "受付状態"],
    ]);

    const additionalValidation = validateAndroidAdditionalRepairSettings(androidForm);

    return (
      requiredValidation ||
      validateAndroidManualPrices(androidForm) ||
      additionalValidation
    );
  }

  if (activeTab === "Switch") {
    if (switchMode === "既存データ変更" && !switchForm.rowNumber) {
      return "変更対象を選択してください。";
    }

    return validateRequiredMasterFields(switchForm, [
      ["modelName", "機種名"],
      ["symptom", "症状"],
      ["estimatedRepairType", "想定修理内容"],
      ["repairPrice", "修理費用"],
      ["repairStatus", "対応区分"],
      ["receptionStatus", "受付状態"],
    ]);
  }

  if (repairItemMode === "既存メニュー変更" && !repairItemForm.rowNumber) {
    return "変更対象を選択してください。";
  }

  const requiredFields: [keyof RepairItemForm, string][] = [
    ["category", "カテゴリ"],
    ["repairItemName", "修理メニュー名"],
    ["receptionStatus", "受付状態"],
  ];

  if (repairItemMode === "既存メニュー変更") {
    requiredFields.push(["priceType", "価格種別"], ["repairStatus", "対応区分"]);
  }

  return validateRequiredMasterFields(repairItemForm, requiredFields);
}

function validateRequiredMasterFields<T extends Record<string, unknown>>(
  form: T,
  fields: [keyof T, string][],
) {
  const missing = fields
    .filter(([key]) => !stringValue(form[key]))
    .map(([, label]) => label);

  return missing.length > 0 ? `${missing.join("、")}を入力してください。` : "";
}

function createMasterActionPayload({
  activeTab,
  androidMode,
  androidRows,
  switchMode,
  repairItemMode,
  androidForm,
  switchForm,
  repairItemForm,
  storeName,
  loginEmail,
  role,
}: {
  activeTab: MasterManagementTab;
  androidMode: AndroidMasterMode;
  androidRows: AndroidPriceMasterItem[];
  switchMode: SwitchMasterMode;
  repairItemMode: RepairItemMode;
  androidForm: AndroidMasterForm;
  switchForm: SwitchMasterForm;
  repairItemForm: RepairItemForm;
  storeName: string;
  loginEmail: string;
  role: string;
}) {
  const authPayload = { storeName, loginEmail, role };

  if (activeTab === "Android") {
    const payloadForm = createAndroidMasterPayloadForm(
      androidForm,
      androidMode,
      androidRows,
    );

    return {
      action:
        androidMode === "新規機種追加"
          ? "addAndroidMasterItem"
          : "updateAndroidMasterItem",
      payload: {
        ...authPayload,
        item: createAndroidMasterPayloadItem(payloadForm),
      },
    };
  }

  if (activeTab === "Switch") {
    return {
      action:
        switchMode === "新規項目追加"
          ? "addSwitchMasterItem"
          : "updateSwitchMasterItem",
      payload: {
        ...authPayload,
        item: switchForm,
      },
    };
  }

  const repairItemPayload =
    repairItemMode === "修理メニュー追加"
      ? createAddRepairItemPayloadItem(repairItemForm)
      : {
          ...repairItemForm,
          displayName:
            repairItemForm.displayName.trim() ||
            repairItemForm.repairItemName.trim(),
        };

  return {
    action:
      repairItemMode === "修理メニュー追加" ? "addRepairItem" : "updateRepairItem",
    payload: {
      ...authPayload,
      item: repairItemPayload,
    },
  };
}

function createAndroidModelRepairSettingsPayload({
  androidForm,
  storeName,
  loginEmail,
  role,
}: {
  androidForm: AndroidMasterForm;
  storeName: string;
  loginEmail: string;
  role: string;
}) {
  return {
    storeName,
    loginEmail,
    role,
    settings: androidForm.additionalRepairSettings.map((setting) => ({
      manufacturer: androidForm.manufacturer.trim(),
      modelName: androidForm.modelName.trim(),
      modelNumber: androidForm.modelNumber.trim(),
      repairItemName: setting.repairItemName.trim(),
      repairStatus: setting.repairStatus,
      customPrice: setting.customPrice.trim(),
      note: setting.note.trim(),
      receptionStatus: setting.receptionStatus,
    })),
  };
}

function createAddRepairItemPayloadItem(form: RepairItemForm): RepairItemForm {
  const standardPrice = form.standardPrice.trim();
  const category = form.category.trim();

  return {
    ...form,
    sortOrder: "",
    category,
    repairItemName: form.repairItemName.trim(),
    displayName: form.repairItemName.trim(),
    priceType: standardPrice ? "固定価格" : "要相談",
    standardPrice,
    repairStatus: createDefaultRepairItemStatus(category, standardPrice),
    targetModelCategory: form.targetModelCategory.trim(),
    note: form.note.trim(),
    receptionStatus: form.receptionStatus,
  };
}

function createDefaultRepairItemStatus(category: string, standardPrice: string) {
  if (category === "Android") {
    return "要確認";
  }

  if (category === "Switch" && standardPrice) {
    return "店舗対応可";
  }

  return "要確認";
}

function estimateInputMatches(current: FormState, confirmed: FormState) {
  return (
    current.category === confirmed.category &&
    current.maker === confirmed.maker &&
    current.modelName === confirmed.modelName &&
    current.modelNumber === confirmed.modelNumber &&
    current.repairType === confirmed.repairType &&
    current.symptom === confirmed.symptom &&
    sameSwitchSelectedModels(
      current.switchSelectedModels,
      confirmed.switchSelectedModels,
    ) &&
    sameSwitchUnitInputs(current.switchUnitInputs, confirmed.switchUnitInputs) &&
    sameSwitchOptionSelections(
      current.switchOptionSelections,
      confirmed.switchOptionSelections,
    ) &&
    sameStringList(current.selectedOptionKeys, confirmed.selectedOptionKeys)
  );
}

function sameSwitchSelectedModels(
  left: SwitchSelectedModel[],
  right: SwitchSelectedModel[],
) {
  return (
    left.length === right.length &&
    left.every(
      (value, index) =>
        value.modelName === right[index]?.modelName &&
        value.modelNumber === right[index]?.modelNumber &&
        value.quantity === right[index]?.quantity,
    )
  );
}

function sameSwitchUnitInputs(left: SwitchUnitInput[], right: SwitchUnitInput[]) {
  return (
    left.length === right.length &&
    left.every((unit, index) => {
      const other = right[index];

      return (
        unit.unitId === other?.unitId &&
        unit.modelName === other.modelName &&
        unit.modelNumber === other.modelNumber &&
        unit.unitIndex === other.unitIndex &&
        sameStringList(unit.selectedSymptoms, other.selectedSymptoms) &&
        sameStringList(unit.selectedRepairTypes, other.selectedRepairTypes)
      );
    })
  );
}

function sameStringList(left: string[], right: string[]) {
  return (
    left.length === right.length && left.every((value, index) => value === right[index])
  );
}

function sameSwitchOptionSelections(
  left: SwitchOptionSelectionState,
  right: SwitchOptionSelectionState,
) {
  return SWITCH_BODY_OPTIONS.every((option) => {
    const leftSelection = getSwitchOptionSelection(left, option.key);
    const rightSelection = getSwitchOptionSelection(right, option.key);

    return (
      leftSelection.selected === rightSelection.selected &&
      leftSelection.quantity === rightSelection.quantity
    );
  });
}

function uniqueModelCandidates(rows: AndroidPriceMasterItem[]): ModelCandidate[] {
  const candidates = rows.map((item) => ({
    label: `${item.modelName} / ${item.modelNumber}`.trim(),
    maker: item.manufacturer,
    modelName: item.modelName,
    modelNumber: item.modelNumber,
  }));

  return Array.from(
    new Map(candidates.map((candidate) => [candidate.label, candidate])).values(),
  );
}

function validateEstimateForm(form: FormState) {
  if (form.category !== "Switch") {
    const missingItems = [
      !form.maker ? "メーカー" : "",
      !form.modelName ? "機種" : "",
      !form.repairType ? "修理内容" : "",
    ].filter(Boolean);

    return missingItems.length > 0
      ? `${missingItems.join("、")}を選択してください。`
      : "";
  }

  if (form.switchSelectedModels.length === 0) {
    return "修理する機種を1つ以上追加してください。";
  }

  if (
    form.switchSelectedModels.some(
      (item) => item.quantity < 1 || item.quantity > 5,
    )
  ) {
    return "台数は1〜5台で選択してください。";
  }

  if (
    form.switchUnitInputs.every(
      (unit) =>
        unit.selectedSymptoms.length === 0 &&
        unit.selectedRepairTypes.length === 0,
    )
  ) {
    return "見積もりを作成するには、少なくとも1台に「症状」または「修理内容」のどちらかを選択してください。両方を入力する必要はありません。";
  }

  const switchBodyQuantity = getSwitchBodyQuantity(form.switchSelectedModels);
  const hasInvalidOptionQuantity = SWITCH_BODY_OPTIONS.some((option) => {
    const selection = getSwitchOptionSelection(
      form.switchOptionSelections,
      option.key,
    );

    return (
      selection.selected &&
      (switchBodyQuantity <= 0 ||
        selection.quantity < 1 ||
        selection.quantity > switchBodyQuantity)
    );
  });

  if (hasInvalidOptionQuantity) {
    return "オプション台数が選択中のSwitch本体台数を超えています。";
  }

  return "";
}

function isSwitchUnitInputComplete(unit: SwitchUnitInput) {
  return unit.selectedSymptoms.length > 0 || unit.selectedRepairTypes.length > 0;
}

function addSwitchSelectedModel(
  selectedModels: SwitchSelectedModel[],
  modelName: string,
  switchRows: SwitchEstimateMasterItem[],
) {
  if (selectedModels.some((item) => item.modelName === modelName)) {
    return selectedModels;
  }

  const rows = switchRows.filter((item) => item.modelName === modelName);
  const modelNumbers = uniqueValues(rows.map((item) => item.modelNumber));

  return [
    ...selectedModels,
    {
      modelName,
      modelNumber: modelNumbers.length === 1 ? modelNumbers[0] : undefined,
      quantity: 1,
    },
  ];
}

function cleanupSwitchSelections(
  form: FormState,
  switchRows: SwitchEstimateMasterItem[],
) {
  const selectedModelNames = form.switchSelectedModels.map((item) => item.modelName);
  const switchUnitInputs = createSwitchUnitInputs(
    form.switchSelectedModels,
    form.switchUnitInputs,
    switchRows,
  );
  const selectedOptionKeys =
    getSwitchBodyQuantity(form.switchSelectedModels) > 0
      ? form.selectedOptionKeys
      : form.selectedOptionKeys.filter(
          (key) => !SWITCH_BODY_OPTIONS.some((option) => option.key === key),
        );
  const switchBodyQuantity = getSwitchBodyQuantity(form.switchSelectedModels);
  const switchOptionSelections =
    switchBodyQuantity > 0
      ? clampSwitchOptionSelections(form.switchOptionSelections, switchBodyQuantity)
      : {};

  return {
    ...form,
    switchUnitInputs: switchUnitInputs.filter((unit) =>
      selectedModelNames.includes(unit.modelName),
    ),
    switchOptionSelections,
    selectedOptionKeys,
  };
}

function createSwitchUnitInputs(
  selectedModels: SwitchSelectedModel[],
  currentUnits: SwitchUnitInput[],
  switchRows: SwitchEstimateMasterItem[],
) {
  const currentById = new Map(currentUnits.map((unit) => [unit.unitId, unit]));

  return selectedModels.flatMap((model) => {
    const quantity = clampSwitchQuantity(model.quantity);
    const modelRows = switchRows.filter((item) => item.modelName === model.modelName);
    const validSymptoms = new Set(uniqueValues(modelRows.map((item) => item.symptom)));
    const validRepairTypes = new Set(
      uniqueValues(modelRows.map((item) => item.estimatedRepairType)),
    );

    return Array.from({ length: quantity }, (_, index) => {
      const unitIndex = index + 1;
      const unitId = createSwitchUnitId(model.modelName, unitIndex);
      const current = currentById.get(unitId);
      const nextUnit = {
        unitId,
        modelName: model.modelName,
        modelNumber: model.modelNumber,
        unitIndex,
        selectedSymptoms:
          current?.selectedSymptoms.filter((symptom) => validSymptoms.has(symptom)) ??
          [],
        selectedRepairTypes:
          current?.selectedRepairTypes.filter((repairType) =>
            validRepairTypes.has(repairType),
          ) ?? [],
      };

      return cleanupSwitchUnitDuplicateRepairTypes(nextUnit, switchRows);
    });
  });
}

function createSwitchUnitId(modelName: string, unitIndex: number) {
  return `${modelName}__${unitIndex}`;
}

function clampSwitchQuantity(quantity: number) {
  const normalized = Math.floor(quantity) || 1;

  return Math.min(5, Math.max(1, normalized));
}

function clampSwitchOptionQuantity(quantity: number, maxQuantity: number) {
  const normalized = Math.floor(quantity) || 1;

  return Math.min(Math.min(5, Math.max(1, maxQuantity)), Math.max(1, normalized));
}

function cloneSwitchUnitInputs(units: SwitchUnitInput[]) {
  return units.map((unit) => ({
    ...unit,
    selectedSymptoms: [...unit.selectedSymptoms],
    selectedRepairTypes: [...unit.selectedRepairTypes],
  }));
}

function cloneSwitchOptionSelections(selections: SwitchOptionSelectionState) {
  return Object.fromEntries(
    Object.entries(selections).map(([key, value]) => [key, { ...value }]),
  );
}

function getSwitchOptionSelection(
  selections: SwitchOptionSelectionState,
  optionKey: string,
) {
  return selections[optionKey] ?? { selected: false, quantity: 1 };
}

function formatSelectionPreview(values: string[]) {
  if (values.length === 0) {
    return "";
  }

  return values.length === 1 ? values[0] : `${values[0]} ほか${values.length - 1}件`;
}

function createSwitchOptionSummary(selections: SwitchOptionSelectionState) {
  const selectedOptions = SWITCH_BODY_OPTIONS.flatMap((option) => {
    const selection = getSwitchOptionSelection(selections, option.key);

    return selection.selected
      ? [`${option.label} ${selection.quantity}台分`]
      : [];
  });

  if (selectedOptions.length === 0) {
    return "";
  }

  return selectedOptions.length === 1
    ? `選択済み：${selectedOptions[0]}`
    : `選択済み：${selectedOptions[0]} ほか${selectedOptions.length - 1}件`;
}

function toggleSwitchOptionSelection(
  selections: SwitchOptionSelectionState,
  optionKey: string,
) {
  const current = getSwitchOptionSelection(selections, optionKey);

  return {
    ...selections,
    [optionKey]: current.selected
      ? { selected: false, quantity: 1 }
      : { selected: true, quantity: 1 },
  };
}

function clampSwitchOptionSelections(
  selections: SwitchOptionSelectionState,
  maxQuantity: number,
) {
  return Object.fromEntries(
    Object.entries(selections).map(([key, value]) => [
      key,
      {
        selected: value.selected,
        quantity: clampSwitchOptionQuantity(value.quantity, maxQuantity),
      },
    ]),
  );
}

function toggleStringValue(values: string[], value: string) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function cleanupSwitchDuplicateRepairTypeSelections(
  form: FormState,
  switchRows: SwitchEstimateMasterItem[],
) {
  let changed = false;
  const switchUnitInputs = form.switchUnitInputs.map((unit) => {
    const nextUnit = cleanupSwitchUnitDuplicateRepairTypes(unit, switchRows);

    if (nextUnit !== unit) {
      changed = true;
    }

    return nextUnit;
  });

  return changed ? { ...form, switchUnitInputs } : form;
}

function cleanupSwitchUnitDuplicateRepairTypes(
  unit: SwitchUnitInput,
  switchRows: SwitchEstimateMasterItem[],
) {
  const symptomRepairKeys = getSwitchSymptomDerivedRepairTypeKeys(unit, switchRows);

  if (symptomRepairKeys.size === 0 || unit.selectedRepairTypes.length === 0) {
    return unit;
  }

  const selectedRepairTypes = unit.selectedRepairTypes.filter(
    (repairType) =>
      !symptomRepairKeys.has(normalizeSwitchRepairTypeForDuplicateCheck(repairType)),
  );

  return selectedRepairTypes.length === unit.selectedRepairTypes.length
    ? unit
    : { ...unit, selectedRepairTypes };
}

function getSwitchSymptomDerivedRepairTypes(
  unit: SwitchUnitInput,
  switchRows: SwitchEstimateMasterItem[],
) {
  if (unit.selectedSymptoms.length === 0) {
    return [];
  }

  const selectedSymptoms = new Set(unit.selectedSymptoms);

  return uniqueValues(
    switchRows
      .filter(
        (row) =>
          row.modelName === unit.modelName && selectedSymptoms.has(row.symptom),
      )
      .map((row) => row.estimatedRepairType),
  );
}

function getSwitchSymptomDerivedRepairTypeKeys(
  unit: SwitchUnitInput,
  switchRows: SwitchEstimateMasterItem[],
) {
  return new Set(
    getSwitchSymptomDerivedRepairTypes(unit, switchRows).map(
      normalizeSwitchRepairTypeForDuplicateCheck,
    ),
  );
}

function isSwitchRepairTypeSelectedFromSymptoms(
  unit: SwitchUnitInput,
  repairType: string,
  switchRows: SwitchEstimateMasterItem[],
) {
  return getSwitchSymptomDerivedRepairTypeKeys(unit, switchRows).has(
    normalizeSwitchRepairTypeForDuplicateCheck(repairType),
  );
}

function normalizeSwitchRepairTypeForDuplicateCheck(value: string) {
  const normalized = value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/[‐‑‒–—ー-]/g, "");

  if (
    normalized.includes("lcd") ||
    normalized.includes("液晶") ||
    normalized.includes("ディスプレイ") ||
    normalized.includes("画面")
  ) {
    return "display";
  }

  if (normalized.includes("バッテリー") || normalized.includes("電池")) {
    return "battery";
  }

  if (
    normalized.includes("充電口") ||
    normalized.includes("usbc") ||
    normalized.includes("typec") ||
    normalized.includes("タイプc")
  ) {
    return "chargePort";
  }

  if (normalized.includes("スティック") || normalized.includes("アナログ")) {
    return "stick";
  }

  return normalized;
}

function createSwitchRepairLines(
  form: FormState,
  switchRows: SwitchEstimateMasterItem[],
) {
  const lines = new Map<string, SwitchEstimateLine>();
  let originalOrder = 0;

  form.switchUnitInputs.forEach((unit) => {
    const selectedSymptoms = new Set(unit.selectedSymptoms);
    const selectedRepairTypes = new Set(unit.selectedRepairTypes);
    const modelRows = switchRows.filter(
      (item) => item.modelName === unit.modelName,
    );

    modelRows.forEach((row) => {
      const fromSymptom = selectedSymptoms.has(row.symptom);
      const fromRepairType = selectedRepairTypes.has(row.estimatedRepairType);

      if (!fromSymptom && !fromRepairType) {
        return;
      }

      const key = `${unit.unitId}\u0000${normalizeSwitchRepairTypeForDuplicateCheck(
        row.estimatedRepairType,
      )}`;

      if (lines.has(key)) {
        return;
      }

      const unitPrice = isSwitchAddablePrice(row.repairPrice)
        ? typeof row.repairPrice === "number"
          ? row.repairPrice
          : parseSinglePriceString(row.repairPrice) ?? 0
        : undefined;

      lines.set(key, {
        unitId: unit.unitId,
        modelName: row.modelName,
        unitIndex: unit.unitIndex,
        originalOrder,
        source: fromSymptom ? "symptom" : "repairType",
        symptom: fromSymptom ? row.symptom : undefined,
        repairType: row.estimatedRepairType,
        price: row.repairPrice,
        lineTotal: unitPrice,
        isVariablePrice: unitPrice === undefined,
        status: row.repairStatus,
        note: row.note,
        receptionStatus: row.receptionStatus,
      });
      originalOrder += 1;
    });
  });

  return applySwitchControllerSimultaneousRepairPricing(Array.from(lines.values()));
}

function applySwitchControllerSimultaneousRepairPricing(
  lines: SwitchEstimateLine[],
) {
  const groupedLines = new Map<string, SwitchEstimateLine[]>();

  lines.forEach((line) => {
    const unitLines = groupedLines.get(line.unitId) ?? [];
    unitLines.push(line);
    groupedLines.set(line.unitId, unitLines);
  });

  return Array.from(groupedLines.values()).flatMap((unitLines) => {
    if (!unitLines.some((line) => isSwitchControllerModel(line.modelName))) {
      return unitLines;
    }

    const pricedLines = unitLines.filter(
      (line) => !line.isVariablePrice && line.lineTotal !== undefined,
    );

    if (pricedLines.length <= 1) {
      return unitLines;
    }

    const primaryLine = [...pricedLines].sort((left, right) => {
      const priceDifference = (right.lineTotal ?? 0) - (left.lineTotal ?? 0);

      return priceDifference !== 0
        ? priceDifference
        : left.originalOrder - right.originalOrder;
    })[0];

    const adjustedLines = unitLines.map((line) => {
      if (line.isVariablePrice || line.lineTotal === undefined) {
        return line;
      }

      if (line === primaryLine) {
        return line;
      }

      return {
        ...line,
        lineTotal: SWITCH_CONTROLLER_ADDITIONAL_REPAIR_PRICE,
        isSimultaneousRepairPrice: true,
      };
    });

    return adjustedLines.sort((left, right) => {
      if (left.isVariablePrice !== right.isVariablePrice) {
        return left.isVariablePrice ? 1 : -1;
      }

      if (!left.isVariablePrice && !right.isVariablePrice) {
        const priceDifference = (right.lineTotal ?? 0) - (left.lineTotal ?? 0);

        if (priceDifference !== 0) {
          return priceDifference;
        }
      }

      return left.originalOrder - right.originalOrder;
    });
  });
}

function createSwitchOptionLines(
  form: FormState,
  selectedOptions: NormalizedOption[],
) {
  const bodyQuantity = getSwitchBodyQuantity(form.switchSelectedModels);

  if (bodyQuantity <= 0) {
    return [];
  }

  return selectedOptions.flatMap((option) => {
    const selection = getSwitchOptionSelection(
      form.switchOptionSelections,
      option.key,
    );
    const quantity = clampSwitchOptionQuantity(selection.quantity, bodyQuantity);

    if (!selection.selected || quantity > bodyQuantity) {
      return [];
    }

    return [
      {
        label: option.label,
        price: option.price,
        quantity,
        lineTotal: option.price * quantity,
      },
    ];
  });
}

function sumSwitchLineTotals(
  repairLines: SwitchEstimateLine[],
  optionLines: SwitchOptionLine[],
) {
  return (
    repairLines.reduce((total, line) => total + (line.lineTotal ?? 0), 0) +
    optionLines.reduce((total, line) => total + line.lineTotal, 0)
  );
}

function getSwitchBodyQuantity(selectedModels: SwitchSelectedModel[]) {
  return selectedModels.reduce(
    (total, item) =>
      total + (isSwitchBodyModel(item.modelName) ? Math.max(1, item.quantity) : 0),
    0,
  );
}

function formatSwitchSelectedModels(selectedModels: SwitchSelectedModel[]) {
  if (selectedModels.length === 0) {
    return "未選択";
  }

  return formatSwitchSelectedModelLines(selectedModels).join("\n");
}

function formatSwitchSelectedModelLines(selectedModels: SwitchSelectedModel[]) {
  return selectedModels.map((item) => `${item.modelName}: ${item.quantity}台`);
}

function formatSwitchUnitLabel(unit: Pick<SwitchUnitInput, "modelName" | "unitIndex">) {
  return `${unit.modelName} ${unit.unitIndex}台目`;
}

function formatSwitchUnitSelections(
  units: SwitchUnitInput[],
  key: "selectedSymptoms" | "selectedRepairTypes",
) {
  const lines = units.flatMap((unit) =>
    unit[key].map((value) => `${formatSwitchUnitLabel(unit)} ${value}`),
  );

  return lines.length > 0 ? lines.join(" / ") : "未選択";
}

function formatSwitchRepairTypesForSave(repairLines: SwitchEstimateLine[]) {
  if (repairLines.length === 0) {
    return "未選択";
  }

  return repairLines
    .map((line) => `${formatSwitchUnitLabel(line)} ${line.repairType}`)
    .join(" / ");
}

function formatSelectedText(values: string[]) {
  return values.length > 0 ? values.join(" / ") : "未選択";
}

function formatSwitchTotalEstimate(total: number, hasVariablePrice: boolean) {
  if (!hasVariablePrice) {
    return formatTaxIncludedYen(total);
  }

  if (total > 0) {
    return `${formatTaxIncludedYen(total)} + 別途見積もり項目あり`;
  }

  return "別途見積もり項目あり";
}

function formatSwitchRepairLine(line: SwitchEstimateLine) {
  const base = `${formatSwitchUnitLabel(line)} / ${
    line.repairType
  }: ${formatSwitchRepairLinePrice(line)}`;

  return line.isSimultaneousRepairPrice
    ? `${base}（同時修理2箇所目以降）`
    : base;
}

function formatSwitchOptionLine(line: SwitchOptionLine) {
  return `${line.label}: ${formatTaxIncludedYen(line.price)} × ${
    line.quantity
  }台 = ${formatTaxIncludedYen(line.lineTotal)}`;
}

function formatSwitchUnitPrice(value: number | string) {
  if (isSwitchAddablePrice(value)) {
    const price = typeof value === "number" ? value : parseSinglePriceString(value);

    return formatTaxIncludedYen(price ?? 0);
  }

  if (typeof value === "string" && isRangePrice(value)) {
    return formatTaxIncludedRange(value);
  }

  return isConsultationPrice(value) ? "要相談" : String(value || "要相談");
}

function formatSwitchRepairLinePrice(line: SwitchEstimateLine) {
  if (line.lineTotal !== undefined) {
    return formatTaxIncludedYen(line.lineTotal);
  }

  return formatSwitchUnitPrice(line.price);
}

function hasSwitchOutsourceRequired(repairLines: SwitchEstimateLine[]) {
  return repairLines.some(isSwitchOutsourceRequiredLine);
}

function getSwitchRepairLineKey(line: SwitchEstimateLine) {
  return `${line.unitId}:${line.repairType}`;
}

function formatSwitchStockLineLabel(line: SwitchEstimateLine) {
  return `${formatSwitchUnitLabel(line)} / ${line.repairType}`;
}

function formatSwitchCustomerUnitLabel(
  line: Pick<SwitchEstimateLine, "modelName" | "unitIndex">,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const selectedQuantity = selectedModels?.find(
    (item) => item.modelName === line.modelName,
  )?.quantity;
  const sameModelUnitCount =
    selectedQuantity ??
    new Set(
      repairLines
        .filter((item) => item.modelName === line.modelName)
        .map((item) => item.unitIndex),
    ).size;

  return sameModelUnitCount > 1
    ? `${line.modelName} ${line.unitIndex}台目`
    : line.modelName;
}

function formatSwitchCustomerRepairSubject(
  line: SwitchEstimateLine,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  return `${formatSwitchCustomerUnitLabel(
    line,
    repairLines,
    selectedModels,
  )}の${line.repairType}`;
}

function createDefaultSwitchStockCheck(line: SwitchEstimateLine): SwitchStockCheck {
  return isSwitchOutsourceRequiredLine(line)
    ? { status: "outsourced" }
    : { status: "needCheck" };
}

function normalizeSwitchStockCheckByLine(
  stockCheck: SwitchStockCheckByLine | undefined,
  repairLines: SwitchEstimateLine[],
): SwitchStockCheckByLine {
  return Object.fromEntries(
    repairLines.map((line) => {
      const lineKey = getSwitchRepairLineKey(line);
      const defaultCheck = createDefaultSwitchStockCheck(line);
      const current = stockCheck?.[lineKey] ?? defaultCheck;
      const status = isSwitchOutsourceRequiredLine(line)
        ? "outsourced"
        : current.status;

      return [
        lineKey,
        {
          status,
          workTime:
            status === "inStock"
              ? current.workTime ?? defaultCheck.workTime ?? "60分"
              : undefined,
        },
      ];
    }),
  );
}

function getSwitchStockCheckEntries(
  stockCheck: SwitchStockCheckByLine,
  repairLines: SwitchEstimateLine[],
) {
  return repairLines.map((line) => ({
    line,
    check:
      stockCheck[getSwitchRepairLineKey(line)] ?? createDefaultSwitchStockCheck(line),
  }));
}

function isSwitchOutsourceRequiredLine(line: SwitchEstimateLine) {
  const model = normalizeSwitchStockCheckText(line.modelName || "");
  const repair = normalizeSwitchStockCheckText(
    `${line.repairType || ""} ${formatSwitchRepairLine(line)}`,
  );

  const isBoardRepair = repair.includes("基板") || repair.includes("基盤");
  const isChargePortRepair =
    repair.includes("充電口") ||
    repair.includes("usbc") ||
    repair.includes("typec") ||
    repair.includes("タイプc");
  const isProController =
    model.includes("proコントロラ") ||
    model.includes("プロコントロラ") ||
    model.includes("proコントローラー") ||
    model.includes("proコン") ||
    model.includes("プロコン") ||
    model.includes("procon") ||
    model.includes("procontroller");
  const isStickRepair =
    repair.includes("スティック") || repair.includes("アナログスティック");

  return isBoardRepair || isChargePortRepair || (isProController && isStickRepair);
}

function normalizeSwitchStockCheckText(value: string) {
  return normalizeSearchText(value).replace(/\s+/g, "").replace(/[‐‑‒–—ー-]/g, "");
}

function appendSwitchStockCheckMessage(
  baseMessage: string,
  stockCheck: SwitchStockCheckByLine,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const stockMessage = createSwitchStockCheckCustomerMessage(
    stockCheck,
    repairLines,
    selectedModels,
  );

  if (!stockMessage) {
    return baseMessage;
  }

  if (baseMessage.endsWith(SWITCH_CONDITION_CHANGE_GUIDE)) {
    return [
      baseMessage.slice(0, -SWITCH_CONDITION_CHANGE_GUIDE.length).trimEnd(),
      stockMessage,
      SWITCH_CONDITION_CHANGE_GUIDE,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [baseMessage, stockMessage]
    .filter(Boolean)
    .join("\n");
}

function createSwitchStockCheckCustomerMessage(
  stockCheck: SwitchStockCheckByLine,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const entries = getSwitchStockCheckEntries(stockCheck, repairLines);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(({ line, check }) =>
      createSwitchStockCheckCustomerLineMessage(
        line,
        check,
        repairLines,
        selectedModels,
      ),
    )
    .join("\n");
}

function createSwitchStockCheckCustomerLineMessage(
  line: SwitchEstimateLine,
  check: SwitchStockCheck,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const subject = formatSwitchCustomerRepairSubject(
    line,
    repairLines,
    selectedModels,
  );

  if (check.status === "outsourced") {
    return `${subject}は、基板作業が必要となるため、お預かり期間を1週間前後いただきます。`;
  }

  if (check.status === "outOfStock") {
    return [
      `${subject}は、現在店頭在庫がないため、パーツ取り寄せに1日〜2日程度お時間をいただきます。`,
      "パーツ入荷後に改めてご連絡いたします。",
    ].join("\n");
  }

  if (check.status === "needCheck") {
    return [
      `${subject}は、在庫状況または対応可否の確認が必要です。`,
      "確認後、正式な納期・作業時間をご案内いたします。",
    ].join("\n");
  }

  return [
    `${subject}は、パーツ在庫があるため即日対応が可能です。`,
    check.workTime === "要確認"
      ? "作業時間は端末状態により変動するため、店頭にて確認後ご案内いたします。"
      : `作業時間はおおよそ${check.workTime ?? "60分"}です。`,
  ].join("\n");
}

function formatSwitchStockCheckSummary(stockCheck: SwitchStockCheck) {
  if (stockCheck.status === "inStock") {
    return `在庫あり / 作業時間${stockCheck.workTime ?? "60分"}`;
  }

  if (stockCheck.status === "outOfStock") {
    return "在庫なし / 取り寄せ1日〜2日程度";
  }

  if (stockCheck.status === "outsourced") {
    return "委託・預かり対応 / 1週間前後";
  }

  return "要確認 / 確認後案内";
}

function formatSwitchStockCheckSummaryLines(
  stockCheck: SwitchStockCheckByLine,
  repairLines: SwitchEstimateLine[],
) {
  return getSwitchStockCheckEntries(stockCheck, repairLines).map(
    ({ line, check }) =>
      `${formatSwitchStockLineLabel(line)}：${formatSwitchStockCheckSummary(check)}`,
  );
}

function formatSwitchStockCheckReservationLines(
  stockCheck: SwitchStockCheckByLine,
  repairLines: SwitchEstimateLine[],
) {
  return formatSwitchStockCheckSummaryLines(stockCheck, repairLines);
}

function createSwitchCustomerMessage({
  form,
  repairLines,
  optionLines,
  total,
  hasVariablePrice,
}: {
  form: FormState;
  repairLines: SwitchEstimateLine[];
  optionLines: SwitchOptionLine[];
  total: number;
  hasVariablePrice: boolean;
}) {
  const modelText = form.switchSelectedModels
    .map((item) => `${item.modelName} ${item.quantity}台`)
    .join("、");
  const repairMessages = repairLines.map((line) =>
    createSwitchRepairPriceCustomerLineMessage(
      line,
      repairLines,
      form.switchSelectedModels,
    ),
  );
  const optionDetails = optionLines.map(formatSwitchCustomerOptionDetail);
  const hasSimultaneousRepairPrice = repairLines.some(
    (line) => line.isSimultaneousRepairPrice,
  );
  const simultaneousRepairGuide = hasSimultaneousRepairPrice
    ? "コントローラー系の同時修理は、各端末ごとに2箇所目以降を1箇所につき税込 1,000円で計算しています。"
    : "";
  const singleRepairLine = repairLines.length === 1 ? repairLines[0] : undefined;
  const optionGuide =
    optionDetails.length > 0
      ? `追加オプションとして、${optionDetails.join("、")}を含んでいます。`
      : "";

  if (singleRepairLine) {
    return [
      createSingleSwitchRepairCustomerMessage(
        singleRepairLine,
        repairLines,
        form.switchSelectedModels,
      ),
      optionGuide,
      SWITCH_CONDITION_CHANGE_GUIDE,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (repairLines.length === 0) {
    return [
      optionGuide || "修理内容は未選択です。",
      SWITCH_CONDITION_CHANGE_GUIDE,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (hasVariablePrice) {
    return [
      `${modelText}の修理お見積もりです。`,
      ...repairMessages,
      optionGuide,
      simultaneousRepairGuide,
      SWITCH_CONDITION_CHANGE_GUIDE,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `${modelText}の修理お見積もりは、合計${formatTaxIncludedYen(total)}です。`,
    ...repairMessages,
    optionGuide,
    simultaneousRepairGuide,
    SWITCH_CONDITION_CHANGE_GUIDE,
  ]
    .filter(Boolean)
    .join("\n");
}

function createSingleSwitchRepairCustomerMessage(
  repairLine: SwitchEstimateLine,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const subject = formatSwitchCustomerRepairSubject(
    repairLine,
    repairLines,
    selectedModels,
  );

  if (isConsultationPrice(repairLine.price)) {
    return `${subject}は、端末状態や部品状況の確認が必要なため、確認後に正式な金額をご案内いたします。`;
  }

  if (typeof repairLine.price === "string" && isRangePrice(repairLine.price)) {
    return `${subject}は、端末状態により金額が変動するため、${formatSwitchCustomerRangePrice(
      repairLine.price,
    )}でのご案内となります。`;
  }

  if (repairLine.isVariablePrice) {
    return `${subject}は、端末状態や部品状況の確認が必要なため、確認後に正式な金額をご案内いたします。`;
  }

  return `${subject}は、お見積もり金額${formatTaxIncludedYen(
    repairLine.lineTotal ?? 0,
  )}です。`;
}

function createSwitchRepairPriceCustomerLineMessage(
  line: SwitchEstimateLine,
  repairLines: SwitchEstimateLine[],
  selectedModels?: SwitchSelectedModel[],
) {
  const subject = formatSwitchCustomerRepairSubject(
    line,
    repairLines,
    selectedModels,
  );

  if (isConsultationPrice(line.price)) {
    return `${subject}は、端末状態や部品状況の確認が必要なため、確認後に正式な金額をご案内いたします。`;
  }

  if (typeof line.price === "string" && isRangePrice(line.price)) {
    return `${subject}は、端末状態により金額が変動するため、${formatSwitchCustomerRangePrice(
      line.price,
    )}でのご案内となります。`;
  }

  if (line.isVariablePrice) {
    return `${subject}は、端末状態や部品状況の確認が必要なため、確認後に正式な金額をご案内いたします。`;
  }

  return `${subject}は${formatTaxIncludedYen(line.lineTotal ?? 0)}です。`;
}

function formatSwitchCustomerOptionDetail(line: SwitchOptionLine) {
  return `${line.label}${line.quantity}台分${formatTaxIncludedYen(line.lineTotal)}`;
}

function formatSwitchCustomerRangePrice(value: string) {
  return formatTaxIncludedRange(value);
}

function getAndroidRepairEstimate(
  item: AndroidPriceMasterItem,
  definition: AndroidRepairDefinition,
) {
  if (definition.key === "screen") {
    const status = stringValue(item[definition.statusKey]);
    const screenPrice = item.screenPrice;

    return {
      repairType: definition.label,
      price: hasPriceValue(screenPrice)
        ? screenPrice
        : status === "非対応"
          ? "受付対象外"
          : undefined,
      status,
      note: item.note,
      receptionStatus: item.receptionStatus,
    };
  }

  if (definition.key === "chargePort") {
    return {
      repairType: definition.label,
      price: ANDROID_FIXED_REPAIR_PRICES.chargePort,
      status: "店舗対応可",
      note: item.note,
      receptionStatus: "",
    };
  }

  const parsedStatus = parseAndroidFixedStatusValue(
    stringValue(item[definition.statusKey]),
    ANDROID_FIXED_REPAIR_PRICES[definition.key],
  );
  const status = parsedStatus.status;
  const estimatePrice =
    normalizeManualPrice(parsedStatus.manualPrice) ||
    stringValue(ANDROID_FIXED_REPAIR_PRICES[definition.key]);

  if (status === "非対応") {
    return {
      repairType: definition.label,
      price: "受付対象外",
      status,
      note: item.note,
      receptionStatus: item.receptionStatus,
    };
  }

  if (status === "要確認") {
    return {
      repairType: definition.label,
      price: estimatePrice,
      status,
      note: item.note,
      receptionStatus: item.receptionStatus,
    };
  }

  if (status === "外注必要") {
    return {
      repairType: definition.label,
      price: estimatePrice,
      status,
      note: item.note,
      receptionStatus: item.receptionStatus,
    };
  }

  const manualPrice = getManualPriceFromStatus(
    stringValue(item[definition.statusKey]),
  );

  if (manualPrice !== undefined) {
    return {
      repairType: definition.label,
      price: manualPrice,
      status: "店舗対応可",
      note: item.note,
      receptionStatus: item.receptionStatus,
    };
  }

  return {
    repairType: definition.label,
    price: estimatePrice,
    status: status === manualPriceStatusOption ? "店舗対応可" : status,
    note: item.note,
    receptionStatus: item.receptionStatus,
  };
}

function createAndroidRepairMenus({
  selectedAndroidModel,
  isOtherManufacturer,
  repairItemMaster,
  androidModelRepairSettings,
}: {
  selectedAndroidModel?: AndroidPriceMasterItem;
  isOtherManufacturer: boolean;
  repairItemMaster: RepairItemMasterItem[];
  androidModelRepairSettings: AndroidModelRepairSettingItem[];
}): AndroidRepairMenuItem[] {
  const toMenu = (
    key: string,
    label: string,
    estimate?: ReturnType<typeof getOtherAndroidRepairEstimate>,
  ): AndroidRepairMenuItem => {
    const isUnsupported =
      estimate?.status === "非対応" ||
      estimate?.price === "受付対象外" ||
      stringValue(estimate?.receptionStatus) === "非対応";
    const unavailable =
      !estimate ||
      isInactiveAndroidRepairStatus(estimate.status) ||
      estimate.price === "受付対象外" ||
      isInactiveReceptionStatus(estimate.receptionStatus);
    const price = unavailable ? null : getAddableAndroidPrice(estimate.price);
    return {
      key,
      label,
      price,
      priceLabel: price === null ? "要確認" : formatTaxIncludedYen(price),
      supportStatus: unavailable ? "要確認" : estimate.status || "要確認",
      isUnsupported,
      isPriceIncludedInTotal: price !== null,
      note: estimate?.note || "",
      guidanceText: createAndroidRepairTimingGuidance(label, estimate?.status),
    };
  };

  const fixedMenus = androidRepairDefinitions.map((definition) => {
    const estimate = isOtherManufacturer
      ? getOtherAndroidRepairEstimate(definition.label, repairItemMaster)
      : selectedAndroidModel
        ? getAndroidRepairEstimate(selectedAndroidModel, definition)
        : undefined;
    return toMenu(`fixed-${definition.key}`, definition.label, estimate);
  });
  const availableDynamicDefinitions = createAvailableDynamicAndroidRepairDefinitions(
    repairItemMaster,
    androidModelRepairSettings,
    selectedAndroidModel,
  );
  const speakerDefinition = availableDynamicDefinitions.find((definition) =>
    isAndroidSpeakerRepairName(definition.label) ||
    isAndroidSpeakerRepairName(definition.repairItemName),
  );
  const speakerEstimate = speakerDefinition
    ? isOtherManufacturer
      ? getOtherAndroidRepairEstimate(speakerDefinition.label, repairItemMaster)
      : selectedAndroidModel
        ? getDynamicAndroidRepairEstimate(
            selectedAndroidModel,
            speakerDefinition,
            androidModelRepairSettings,
          )
        : undefined
    : undefined;
  const speakerMenu = toMenu(
    "android-speaker-repair",
    "スピーカー修理",
    speakerEstimate,
  );
  const dynamicMenus = availableDynamicDefinitions.flatMap((definition) => {
    if (
      isAndroidSpeakerRepairName(definition.label) ||
      isAndroidSpeakerRepairName(definition.repairItemName)
    ) return [];
    const estimate = isOtherManufacturer
      ? getOtherAndroidRepairEstimate(definition.label, repairItemMaster)
      : selectedAndroidModel
        ? getDynamicAndroidRepairEstimate(selectedAndroidModel, definition, androidModelRepairSettings)
        : undefined;
    const menu = estimate ? toMenu(`dynamic-${definition.key}`, definition.label, estimate) : null;
    return menu ? [menu] : [];
  });

  return [
    ...fixedMenus,
    speakerMenu,
    {
      key: "android-water-damage-cleaning", label: "水没洗浄", price: 9680,
      priceLabel: formatTaxIncludedYen(9680), supportStatus: "店舗対応可", isPriceIncludedInTotal: true,
      isUnsupported: false, note: "", guidanceText: ANDROID_WATER_DAMAGE_GUIDANCE,
    },
    {
      key: ANDROID_POWER_FAILURE_MENU_KEY, label: "起動不良、電源つかない", price: null,
      priceLabel: "原因により変動", supportStatus: "案内のみ", isPriceIncludedInTotal: false,
      isUnsupported: false, note: "", guidanceText: createAndroidPowerFailureGuidance(fixedMenus),
      powerFailureEstimateMinimum: getAndroidPowerFailureMinimum(
        fixedMenus.find((menu) => menu.label === "バッテリー交換")?.price,
      ),
    },
    {
      key: ANDROID_DONOR_REPAIR_MENU_KEY, label: "ドナー修理", price: 15000,
      priceLabel: `${formatTaxIncludedYen(15000)}＋ドナー端末代`, supportStatus: "要確認", isPriceIncludedInTotal: true,
      isUnsupported: false, note: "", guidanceText: ANDROID_DONOR_REPAIR_GUIDANCE,
    },
    ...dynamicMenus,
  ];
}

function isAndroidSpeakerRepairName(value: string) {
  return (
    normalizedAndroidBasicRepairAliases.get(normalizeRepairItemName(value)) ===
    "スピーカー修理"
  );
}

function isAndroidBasicRepairName(value: string) {
  return normalizedAndroidBasicRepairAliases.has(normalizeRepairItemName(value));
}

function isInactiveAndroidRepairStatus(value: string) {
  const normalized = stringValue(value).normalize("NFKC").trim();
  const separatorIndex = normalized.lastIndexOf(androidStatusPriceSeparator);
  const status = separatorIndex > 0
    ? normalized.slice(0, separatorIndex).trim()
    : normalized;

  return isInactiveReceptionStatus(status);
}

function getAddableAndroidPrice(value: number | string | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return typeof value === "string" ? parseSinglePriceString(value) ?? null : null;
}

function sumAndroidRepairMenuPrices(menus: AndroidRepairMenuItem[]) {
  return menus.reduce((total, menu) => total + (menu.isPriceIncludedInTotal ? menu.price ?? 0 : 0), 0);
}

function formatAndroidRepairEstimate(menus: AndroidRepairMenuItem[], optionTotal: number) {
  const baseEstimate = formatTaxIncludedYen(
    sumAndroidRepairMenuPrices(menus) + optionTotal,
  );
  return menus.some((menu) => menu.key === ANDROID_DONOR_REPAIR_MENU_KEY)
    ? `${baseEstimate}＋ドナー端末代`
    : baseEstimate;
}

function createAndroidRepairTimingGuidance(repairType: string, status?: string) {
  if (status === "外注必要") {
    return [
      "■納期",
      `外注対応となり、お預かり期間は${ANDROID_OUTSOURCE_GUIDE.leadTime}です。`,
      "",
      "■作業時間",
      "作業時間は端末の状態を確認後にご案内いたします。",
    ].join("\n");
  }

  const repairGuide = getAndroidRepairGuide(repairType);
  if (!repairGuide) {
    return [
      "■パーツ納期",
      "パーツの取り寄せ期間は、在庫状況を確認後にご案内いたします。",
      "",
      "■作業時間",
      "パーツ入荷後の作業時間は、端末の状態を確認後にご案内いたします。",
    ].join("\n");
  }

  return [
    "■パーツ納期",
    `在庫がない場合は、取り寄せに${repairGuide.partsLeadTime}かかります。`,
    "",
    "■作業時間",
    `パーツ入荷後、${repairGuide.workTime}で作業完了予定です。`,
    "パーツ入荷後に改めてご連絡いたしますので、その後ご来店をお願いいたします。",
  ].join("\n");
}

function createAndroidPowerFailureGuidance(menus: AndroidRepairMenuItem[]) {
  const batteryMenu = menus.find((menu) => menu.label === "バッテリー交換");
  const batteryPrice = batteryMenu?.price;
  return [
    "起動不良・電源が入らない症状は、故障原因によって修理内容・料金・納期が異なります。",
    "", "■バッテリーの故障が原因の場合", `バッテリー交換：${batteryPrice !== null && batteryPrice !== undefined ? formatTaxIncludedYen(batteryPrice) : "要確認"}`,
    "", "■充電口の故障により充電できない場合", `充電口修理：${formatTaxIncludedYen(ANDROID_FIXED_REPAIR_PRICES.chargePort)}`,
    "", "■基板自体が故障している場合", `基板修理：${ANDROID_BOARD_REPAIR.priceLabel}`,
    "", "診断の結果、バッテリーや充電口ではなく、端末内部の基板が故障している場合があります。",
    "", "基板修理は、端末を一時的に起動・操作できる状態まで復旧させ、内部データの取り出しやバックアップを行うことを主な目的とした修理です。",
    "修理に成功した場合は動作する状態でのご返却となりますが、修理後の継続的な通常使用を保証するものではありません。",
    "", "また、基板修理は必ず成功するものではありません。",
    "CPUやデータを保存しているストレージなど、重要な部品自体が故障している場合は、修理やデータの取り出しができないことがあります。",
    "", "基板修理に加えて、バッテリーや充電口などの部品交換が必要な場合は、別途部品交換費用が発生します。",
    "", `基板修理は外注対応となり、お預かり期間は${ANDROID_BOARD_REPAIR.leadTime}が目安です。`,
    "", `※上記は主な故障原因を想定した概算料金です。故障箇所や端末の状態、必要な部品交換によっては、${formatTaxIncludedYen(ANDROID_BOARD_REPAIR.price)}を超える場合があります。`,
    "",
    "正式な修理内容・料金・納期は、端末の状態を確認したうえでご案内いたします。",
  ].join("\n");
}

function getAndroidPowerFailureMinimum(batteryPrice: number | null | undefined) {
  const candidates: number[] = [ANDROID_FIXED_REPAIR_PRICES.chargePort];
  if (typeof batteryPrice === "number" && Number.isFinite(batteryPrice)) {
    candidates.push(batteryPrice);
  }
  return Math.min(...candidates);
}

function getAndroidPowerFailureEstimate(menus: AndroidRepairMenuItem[]) {
  const minimum = menus.find(
    (menu) => menu.key === ANDROID_POWER_FAILURE_MENU_KEY,
  )?.powerFailureEstimateMinimum ?? ANDROID_FIXED_REPAIR_PRICES.chargePort;
  return formatTaxIncludedYenRange(
    minimum,
    ANDROID_BOARD_REPAIR.price,
  );
}

function createAndroidMultipleRepairCustomerMessage({ modelName, menus, optionTotal, isOtherManufacturer }: {
  modelName: string; menus: AndroidRepairMenuItem[]; optionTotal: number; isOtherManufacturer: boolean;
}) {
  const isPowerFailureOnly =
    menus.length === 1 && menus[0]?.key === ANDROID_POWER_FAILURE_MENU_KEY;
  const includesDonorRepair = menus.some(
    (menu) => menu.key === ANDROID_DONOR_REPAIR_MENU_KEY,
  );
  const includesOtherManufacturerScreen =
    isOtherManufacturer && menus.some((menu) => menu.label === "画面修理");
  const lines = [
    `${modelName}の修理メニュー：${menus.map((menu) => menu.label).join("、")}`,
    ...(isPowerFailureOnly
      ? [`概算見積金額：${getAndroidPowerFailureEstimate(menus)}`]
      : [
          ...menus
            .filter((menu) => menu.key !== ANDROID_DONOR_REPAIR_MENU_KEY)
            .map((menu) => `・${menu.label}：${menu.priceLabel} / ${menu.supportStatus}`),
          `${includesDonorRepair ? "概算見積金額" : "合計金額"}：${formatAndroidRepairEstimate(menus, optionTotal)}`,
        ]),
  ];
  const guidance = menus.flatMap((menu) => {
    if (isOtherManufacturer && menu.label === "画面修理") {
      return [
        createAndroidCustomerMessage({ modelName, repairType: menu.label, price: menu.price ?? undefined, status: menu.supportStatus, optionTotal: 0, isOtherManufacturer }),
        menu.guidanceText,
      ].filter(Boolean);
    }
    if (menu.guidanceText) return [menu.guidanceText];
    return menu.note ? [menu.note] : [];
  });
  return [
    ...lines,
    "",
    ...guidance,
    ...(isPowerFailureOnly || includesDonorRepair || includesOtherManufacturerScreen
      ? []
      : [ANDROID_DATA_GUIDE]),
  ].filter(Boolean).join("\n");
}

function getDynamicAndroidRepairEstimate(
  item: AndroidPriceMasterItem,
  definition: DynamicAndroidRepairDefinition,
  androidModelRepairSettings: AndroidModelRepairSettingItem[],
) {
  const setting = findAndroidModelRepairSetting(
    androidModelRepairSettings,
    item,
    definition.repairItemName,
  );
  const status = setting?.repairStatus || "要確認";
  const customPrice = setting?.customPrice;
  const price = hasPriceValue(customPrice)
    ? customPrice
    : hasPriceValue(definition.standardPrice)
    ? definition.standardPrice
    : "要確認";

  if (setting && isInactiveReceptionStatus(setting.receptionStatus)) {
    return {
      repairType: definition.label,
      price: "受付対象外",
      status: "非対応",
      note: [setting.note, definition.note, item.note].filter(Boolean).join("\n"),
      receptionStatus: setting.receptionStatus,
    };
  }

  return {
    repairType: definition.label,
    price,
    status: status === manualPriceStatusOption ? "店舗対応可" : status,
    note: [setting?.note, definition.note, item.note].filter(Boolean).join("\n"),
    receptionStatus:
      setting?.receptionStatus || definition.receptionStatus || item.receptionStatus,
  };
}

function getOtherAndroidRepairEstimate(
  repairType: string,
  repairItemMaster: RepairItemMasterItem[] = [],
) {
  if (repairType === "画面修理") {
    return {
      repairType,
      price: OTHER_ANDROID_SCREEN_PRICE,
      status: "要確認",
      note: OTHER_ANDROID_SCREEN_NOTE,
      receptionStatus: "",
    };
  }

  const fixedPrice = getAndroidFixedRepairPrice(repairType);
  const dynamicDefinition = createDynamicAndroidRepairDefinitions(
    repairItemMaster,
  ).find((item) => item.label === repairType);

  if (dynamicDefinition) {
    return {
      repairType,
      price: hasPriceValue(dynamicDefinition.standardPrice)
        ? dynamicDefinition.standardPrice
        : "要確認",
      status: "要確認",
      note: dynamicDefinition.note || OTHER_ANDROID_CONFIRM_NOTE,
      receptionStatus: dynamicDefinition.receptionStatus,
    };
  }

  return {
    repairType,
    price: fixedPrice,
    status: fixedPrice === undefined ? "要確認" : "店舗対応可",
    note: fixedPrice === undefined ? OTHER_ANDROID_CONFIRM_NOTE : "",
    receptionStatus: "",
  };
}

function getAndroidFixedRepairPrice(repairType: string) {
  const definition = androidRepairDefinitions.find(
    (item) => item.label === repairType,
  );

  if (!definition || definition.key === "screen") {
    return undefined;
  }

  return ANDROID_FIXED_REPAIR_PRICES[definition.key];
}

function createAndroidCustomerMessage({
  modelName,
  repairType,
  price,
  status,
  optionTotal,
  isOtherManufacturer,
}: {
  modelName: string;
  repairType: string;
  price: number | string | undefined;
  status: string;
  optionTotal: number;
  isOtherManufacturer: boolean;
}) {
  if (isOtherManufacturer && repairType === "画面修理") {
    return [
      `${modelName}の画面修理は、パーツ原価に作業費税込 11,000円を加えた金額でのお見積りとなります。`,
      "パーツ原価を確認後、正式な金額をご案内いたします。",
      ANDROID_DATA_GUIDE,
    ].join("\n");
  }

  if (price === undefined) {
    return [
      `${modelName}の${repairType}は、価格マスター未登録です。`,
      "内容を確認後、正式にご案内いたします。",
      ANDROID_DATA_GUIDE,
    ].join("\n");
  }

  if (status === "非対応" || price === "受付対象外") {
    return `${modelName}の${repairType}は、現在受付対象外です。`;
  }

  if (status === "要確認") {
    const priceLine =
      price !== undefined && isPriceLike(price)
        ? `${modelName}の${repairType}は、基本料金${formatEstimate(
            price,
            optionTotal,
          )}を目安として、端末状態と部品状況を確認後に正式にご案内いたします。`
        : `${modelName}の${repairType}は、端末状態と部品状況を確認後、正式にご案内いたします。`;

    return [priceLine, ANDROID_DATA_GUIDE].join("\n");
  }

  if (isConsultationPrice(price) || !isPriceLike(price)) {
    return [
      `${modelName}の${repairType}は、端末状態と部品状況を確認後、正式にご案内いたします。`,
      ANDROID_DATA_GUIDE,
    ].join("\n");
  }

  if (status === "外注必要") {
    return [
      `${modelName}の${repairType}は、外注対応となり、お見積り金額${formatEstimate(price, optionTotal)}です。`,
      `お預かり期間は${ANDROID_OUTSOURCE_GUIDE.leadTime}となります。`,
      "お預かり後、端末状態や部品状況を確認したうえで正式にご案内いたします。",
      ANDROID_OUTSOURCE_DATA_GUIDE,
      ANDROID_CONDITION_CHANGE_GUIDE,
    ].join("\n");
  }

  const repairGuide = getAndroidRepairGuide(repairType);
  const guideLines = repairGuide
    ? [
        `パーツの取り寄せは通常${repairGuide.partsLeadTime}、入荷後の作業時間は${repairGuide.workTime}となります。`,
        "パーツ入荷後に改めてご連絡いたしますので、その後ご来店をお願いいたします。",
      ]
    : [];

  return [
    `${modelName}の${repairType}は、お見積り金額${formatEstimate(price, optionTotal)}です。`,
    ...guideLines,
    ANDROID_DATA_GUIDE,
    ANDROID_CONDITION_CHANGE_GUIDE,
  ].join("\n");
}

function getAndroidRepairGuide(repairType: string) {
  const definition = androidRepairDefinitions.find(
    (item) => item.label === repairType,
  );

  return definition ? ANDROID_REPAIR_GUIDE[definition.key] : undefined;
}

function formatSwitchEstimate(value: number | string, optionTotal = 0) {
  if (isSwitchAddablePrice(value)) {
    const basePrice =
      typeof value === "number" ? value : parseSinglePriceString(value) ?? 0;

    return formatTaxIncludedYen(basePrice + optionTotal);
  }

  const baseEstimate = formatSwitchBaseEstimate(value);

  if (optionTotal <= 0) {
    return baseEstimate;
  }

  return `${baseEstimate}\nオプション合計: ${formatTaxIncludedYen(optionTotal)}`;
}

function formatSwitchBaseEstimate(value: number | string) {
  if (typeof value === "number") {
    return formatEstimate(value);
  }

  if (isConsultationPrice(value)) {
    return "要相談";
  }

  const parsedNumber = parseSinglePriceString(value);

  if (parsedNumber !== undefined) {
    return formatTaxIncludedYen(parsedNumber);
  }

  if (isRangePrice(value)) {
    return formatTaxIncludedRange(value);
  }

  return value || "要相談";
}

function isSwitchAddablePrice(value: number | string) {
  return typeof value === "number" || parseSinglePriceString(value) !== undefined;
}

function formatEstimate(value: number | string, optionTotal = 0) {
  if (typeof value === "number") {
    return formatTaxIncludedYen(value + optionTotal);
  }

  const parsedNumber = parseNumericString(value);
  if (parsedNumber !== undefined) {
    return formatTaxIncludedYen(parsedNumber + optionTotal);
  }

  if (isConsultationPrice(value)) {
    return "要相談";
  }

  if (!isPriceLike(value)) {
    return value || "要相談";
  }

  return formatTaxIncludedRange(value);
}

function formatYen(value: number | string) {
  if (typeof value === "number") {
    return `${value.toLocaleString("ja-JP")}円`;
  }

  const normalized = value.normalize("NFKC").trim().replace(/,/g, "");
  const rangeMatch = normalized.match(/^(\d+)[〜~～](\d+)?$/);

  if (rangeMatch) {
    const min = Number(rangeMatch[1]).toLocaleString("ja-JP");
    const max = rangeMatch[2]
      ? Number(rangeMatch[2]).toLocaleString("ja-JP")
      : "";

    return max ? `${min}円〜${max}円` : `${min}円〜`;
  }

  const parsedNumber = parseNumericString(normalized);

  return parsedNumber !== undefined
    ? `${parsedNumber.toLocaleString("ja-JP")}円`
    : normalized;
}

function isConsultationPrice(value: number | string) {
  return typeof value === "string" && value.normalize("NFKC").trim() === "要相談";
}

function isPriceLike(value: number | string) {
  if (typeof value === "number") {
    return true;
  }

  const normalized = value.normalize("NFKC").trim().replace(/,/g, "");

  return /^\d+$/.test(normalized) || /^\d+[〜~～]\d*$/.test(normalized);
}

function hasPriceValue(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  return typeof value === "string" && isPriceLike(value);
}

function parseNumericString(value: string) {
  const normalized = value.normalize("NFKC").trim().replace(/,/g, "");

  if (!/^\d+$/.test(normalized)) {
    return undefined;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSinglePriceString(value: string) {
  const normalized = value
    .normalize("NFKC")
    .trim()
    .replace(/,/g, "")
    .replace(/\s+/g, "");
  const match = normalized.match(/^(\d+)円?$/);

  if (!match) {
    return undefined;
  }

  const parsed = Number(match[1]);

  return Number.isFinite(parsed) ? parsed : undefined;
}

function isRangePrice(value: number | string) {
  if (typeof value === "number") {
    return false;
  }

  const normalized = normalizePriceText(value);

  return /^(\d+)円?[〜~～](\d+)?円?$/.test(normalized);
}

function formatRangePrice(value: string) {
  const normalized = normalizePriceText(value);
  const match = normalized.match(/^(\d+)円?[〜~～](\d+)?円?$/);

  if (!match) {
    return value;
  }

  const min = Number(match[1]).toLocaleString("ja-JP");
  const max = match[2] ? Number(match[2]).toLocaleString("ja-JP") : "";

  return max ? `${min}円〜${max}円` : `${min}円〜`;
}

function formatTaxIncludedRange(value: string) {
  return `税込 ${formatRangePrice(value)}`;
}

function formatTaxIncludedYenRange(minimum: number, maximum: number) {
  return `税込 ${minimum.toLocaleString("ja-JP")}円〜${maximum.toLocaleString("ja-JP")}円`;
}

function normalizePriceText(value: string) {
  return value.normalize("NFKC").trim().replace(/,/g, "").replace(/\s+/g, "");
}

function getManualPriceFromStatus(status: string) {
  const parsed = parseManualPriceStatus(status);

  if (parsed.status !== manualPriceStatusOption || !parsed.manualPrice) {
    return undefined;
  }

  const price = Number(parsed.manualPrice);

  return Number.isFinite(price) ? price : undefined;
}

function formatTaxIncludedYen(value: number) {
  return `税込 ${value.toLocaleString("ja-JP")}円`;
}

function normalizeOptions(options: OptionItem[]): NormalizedOption[] {
  return options
    .map((option, index) => {
      const label = stringValue(option.optionName || option.name || option.label);
      const price = parseOptionPrice(option.optionPrice || option.price);

      return label
        ? {
            key: `${label}-${index}`,
            label,
            price,
          }
        : undefined;
    })
    .filter((option): option is NormalizedOption => Boolean(option));
}

function parseOptionPrice(value: number | string | boolean | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== "string") {
    return 0;
  }

  const parsed = Number(value.normalize("NFKC").replace(/[^\d.-]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

function formatSelectedOptions(options: NormalizedOption[]) {
  if (options.length === 0) {
    return "なし";
  }

  return options
    .map((option) => `${option.label} + ${formatTaxIncludedYen(option.price)}`)
    .join("、");
}

function formatReservationOptions(options: NormalizedOption[]) {
  return options
    .map((option) => `${option.label} ${formatTaxIncludedYen(option.price)}`)
    .join(" / ");
}

function getSelectedOptionsForForm(
  form: FormState,
  androidOptions: NormalizedOption[],
) {
  if (form.category === "Switch") {
    if (getSwitchBodyQuantity(form.switchSelectedModels) <= 0) {
      return [];
    }

    return SWITCH_BODY_OPTIONS.filter(
      (option) =>
        getSwitchOptionSelection(form.switchOptionSelections, option.key).selected,
    );
  }

  if (form.category === "Android") {
    return androidOptions.filter((option) =>
      form.selectedOptionKeys.includes(option.key),
    );
  }

  return [];
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values.map(stringValue).filter(Boolean)));
}

function createSwitchEstimatedRepairTypeOptions(
  rows: SwitchEstimateMasterItem[],
  symptom: string,
) {
  return uniqueValues(
    [...rows]
      .sort(compareSortOrder)
      .filter(
        (item) =>
          !isInactiveReceptionStatus(item.receptionStatus) &&
          item.symptom === symptom,
      )
      .map((item) => item.estimatedRepairType),
  );
}

function androidMakerMatches(selectedMaker: string, rowMaker: string) {
  const selected = stringValue(selectedMaker);
  const row = stringValue(rowMaker);

  if (!selected || selected === row) {
    return true;
  }

  return (androidMakerAliases[selected] || [selected]).includes(row);
}

function normalizeSearchText(value: string) {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
}

function normalizeRepairItemName(value: string) {
  const compact = convertHiraganaToKatakana(normalizeSearchText(value)).replace(
    /[\s_\-‐‑‒–—ー]/g,
    "",
  );

  return compact
    .replace(/battery/g, "バッテリー")
    .replace(/screen/g, "画面")
    .replace(/display/g, "画面")
    .replace(/chargeport/g, "充電口")
    .replace(/chargingport/g, "充電口")
    .replace(/camera/g, "カメラ");
}

function normalizeRepairItemSearchText(value: string) {
  return normalizeRepairItemName(value);
}

function normalizeModelName(value: string) {
  return normalizeAndroidModelSearchText(value);
}

function createAndroidModelSearchTarget(value: string) {
  const normalized = normalizeAndroidModelText(value);

  return normalizeRomanNumeralsForModel(
    applyAndroidModelSearchAliases(normalized),
  ).replace(/[\s_\-‐‑‒–—ー]/g, "");
}

function getAndroidModelSearchTokens(value: string) {
  return normalizeAndroidModelText(value)
    .split(" ")
    .map(normalizeAndroidModelSearchText)
    .filter(Boolean);
}

function normalizeAndroidModelSearchText(value: string) {
  return createAndroidModelSearchTarget(value);
}

function normalizeAndroidModelText(value: string) {
  return convertHiraganaToKatakana(
    value.normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase(),
  );
}

function convertHiraganaToKatakana(value: string) {
  return value.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60),
  );
}

function applyAndroidModelSearchAliases(value: string) {
  const aliases: Array<[RegExp, string]> = [
    [/ピクセル|pixel/g, "pixel"],
    [/エクスペリア|xperia/g, "xperia"],
    [/ギャラクシー|galaxy/g, "galaxy"],
    [/アクオス|aquos/g, "aquos"],
    [/オッポ|oppo/g, "oppo"],
    [/シャオミ|xiaomi/g, "xiaomi"],
    [/ファーウェイ|huawei/g, "huawei"],
    [/モトローラ|motorola/g, "motorola"],
    [/レドミ|redmi/g, "redmi"],
    [/ポコ|poco/g, "poco"],
  ];

  return aliases.reduce(
    (normalized, [pattern, replacement]) => normalized.replace(pattern, replacement),
    value,
  );
}

function normalizeRomanNumeralsForModel(value: string) {
  return value
    .replace(/(\d+)(ix|viii|vii|vi|iv|v|iii|ii|i)\b/g, (_, number, roman) =>
      `${number}${romanNumeralToNumber(roman)}`,
    )
    .replace(/\bix\b/g, "9")
    .replace(/\bviii\b/g, "8")
    .replace(/\bvii\b/g, "7")
    .replace(/\bvi\b/g, "6")
    .replace(/\biv\b/g, "4")
    .replace(/\bv\b/g, "5")
    .replace(/\biii\b/g, "3")
    .replace(/\bii\b/g, "2")
    .replace(/\bi\b/g, "1");
}

function romanNumeralToNumber(value: string) {
  const values: Record<string, string> = {
    i: "1",
    ii: "2",
    iii: "3",
    iv: "4",
    v: "5",
    vi: "6",
    vii: "7",
    viii: "8",
    ix: "9",
  };

  return values[value] || value;
}

function isSwitchBodyModel(modelName: string) {
  return SWITCH_BODY_MODEL_NAMES.has(
    modelName.normalize("NFKC").trim().replace(/\s+/g, " "),
  );
}

function isSwitchControllerModel(modelName: string) {
  if (isSwitchBodyModel(modelName)) {
    return false;
  }

  const normalized = modelName
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[‐‑‒–—ー-]/g, "");

  return (
    normalized.includes("joycon") ||
    normalized.includes("ジョイコン") ||
    normalized.includes("proコントローラー") ||
    normalized.includes("procontroller") ||
    normalized.includes("プロコントローラー") ||
    normalized.includes("プロコン")
  );
}

function stringValue(value: unknown) {
  if (typeof value === "number") {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function compareSortOrder(
  a: { sortOrder: number | string },
  b: { sortOrder: number | string },
) {
  const sortA = Number(a.sortOrder);
  const sortB = Number(b.sortOrder);

  if (Number.isFinite(sortA) && Number.isFinite(sortB) && sortA !== sortB) {
    return sortA - sortB;
  }

  return 0;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeAuthUser(user: Partial<UserMasterItem>): AuthUser | null {
  const email = normalizeEmail(stringValue(user.email));

  if (!email) {
    return null;
  }

  return {
    email,
    storeName: stringValue(user.storeName),
    role: stringValue(user.role) || "staff",
  };
}

function findUserByEmail(users: UserMasterItem[], email: string) {
  const normalizedEmail = normalizeEmail(email);

  return users
    .map((user) => normalizeAuthUser(user))
    .find((user): user is AuthUser => Boolean(user && user.email === normalizedEmail));
}

function readStoredAuthUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const rawAuth = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!rawAuth) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawAuth) as Partial<UserMasterItem>;
    const user = normalizeAuthUser(parsed);

    if (!user) {
      removeStoredAuthUser();
    }

    return user;
  } catch {
    removeStoredAuthUser();
    return null;
  }
}

function persistAuthUser(user: AuthUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

function removeStoredAuthUser() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function fetchInitialData(): Promise<InitialData> {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_API_URL is not set.");
  }

  const response = await fetch(`${apiUrl}?action=getInitialData`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Initial data fetch failed with status ${response.status}.`);
  }

  const result = (await response.json()) as {
    success?: boolean;
    ok?: boolean;
    data?: Partial<InitialData>;
    message?: string;
    error?: string;
  };

  if (result.success === false || result.ok === false) {
    throw new Error(result.message || result.error || "Initial data fetch failed.");
  }

  return {
    priceMaster: result.data?.priceMaster ?? [],
    switchEstimateMaster: result.data?.switchEstimateMaster ?? [],
    repairItemMaster: result.data?.repairItemMaster ?? [],
    androidModelRepairSettings: result.data?.androidModelRepairSettings ?? [],
    staffList: result.data?.staffList ?? [],
    optionMaster: result.data?.optionMaster ?? [],
    users: result.data?.users ?? [],
  };
}

async function fetchUserMaster() {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_API_URL is not set.");
  }

  const response = await fetch(`${apiUrl}?action=getUserMaster`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`User master fetch failed with status ${response.status}.`);
  }

  const result = (await response.json()) as {
    ok?: boolean;
    success?: boolean;
    users?: Partial<UserMasterItem>[];
    data?: {
      users?: Partial<UserMasterItem>[];
    };
    error?: string;
    message?: string;
  };

  if (result.ok === false || result.success === false) {
    throw new Error(result.error || result.message || "User master fetch failed.");
  }

  const users = result.users || result.data?.users || [];

  return users
    .map((user) => normalizeAuthUser(user))
    .filter((user): user is AuthUser => Boolean(user));
}

async function saveInquiry({
  storeName,
  loginEmail,
  role,
  modelName,
  repairType,
  status,
}: {
  storeName: string;
  loginEmail: string;
  role: string;
  modelName: string;
  repairType: string;
  status: OrderStatus;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl || !modelName || modelName === "未選択" || !repairType) {
    throw new Error("Inquiry save payload is incomplete.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "saveInquiry",
      payload: {
        storeName,
        loginEmail,
        role,
        modelName,
        repairType,
        status,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Inquiry save failed with status ${response.status}.`);
  }
}

async function postMasterAction(action: string, payload: unknown) {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_API_URL is not set.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Master save failed with status ${response.status}.`);
  }

  const text = await response.text();

  if (!text) {
    return;
  }

  try {
    const result = JSON.parse(text) as {
      success?: boolean;
      ok?: boolean;
      message?: string;
      error?: string;
    };

    if (result.success === false || result.ok === false) {
      throw new Error(result.message || result.error || "Master save failed.");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }

    throw error;
  }
}

async function sendAdminReport(payload: {
  storeName: string;
  loginEmail: string;
  role: string;
  reportType: string;
  category: string;
  targetModel: string;
  targetRepairOrSymptom: string;
  message: string;
  currentEstimateSummary: string;
  createdAt: string;
}) {
  const apiUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_API_URL;

  if (!apiUrl) {
    throw new Error("NEXT_PUBLIC_APPS_SCRIPT_API_URL is not set.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action: "sendAdminReport",
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Admin report failed with status ${response.status}.`);
  }

  const text = await response.text();

  if (!text) {
    return;
  }

  try {
    const result = JSON.parse(text) as { success?: boolean; ok?: boolean; message?: string };

    if (result.success === false || result.ok === false) {
      throw new Error(result.message || "Admin report failed.");
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return;
    }

    throw error;
  }
}
