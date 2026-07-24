const ANDROID_MASTER_SHEET_NAME = "RepairQuote価格マスター";
const SWITCH_MASTER_SHEET_NAME = "Switch症状見積もりマスター";
const DYSON_ROOMBA_MASTER_SHEET_NAME = "Dyson・Roomba見積マスター";
const OPTION_MASTER_SHEET_NAME = "オプションマスター";
const USER_MASTER_SHEET_NAME = "ユーザーマスター";
const STAFF_MASTER_SHEET_NAME = "スタッフマスター";
const INQUIRY_HISTORY_SHEET_NAME = "見積履歴";
const ADMIN_REPORT_SHEET_NAME = "管理者報告";
const REPAIR_ITEM_MASTER_SHEET_NAME = "修理項目マスター";
const ANDROID_MODEL_REPAIR_SETTINGS_SHEET_NAME = "Android機種別修理メニュー設定";
const MASTER_CHANGE_HISTORY_SHEET_NAME = "マスター変更履歴";

const ANDROID_MASTER_HEADERS = [
  "並び順",
  "メーカー",
  "機種名",
  "型番",
  "画面修理価格",
  "画面修理対応区分",
  "バッテリー対応区分",
  "充電口対応区分",
  "カメラレンズ対応区分",
  "スリープボタン対応区分",
  "音量ボタン対応区分",
  "備考",
  "受付状態",
];

const ANDROID_SUPPORT_STATUS_HEADERS = [
  "画面修理対応区分",
  "バッテリー対応区分",
  "充電口対応区分",
  "カメラレンズ対応区分",
  "スリープボタン対応区分",
  "音量ボタン対応区分",
];

const SWITCH_MASTER_HEADERS = [
  "並び順",
  "機種名",
  "型番",
  "症状",
  "想定修理内容",
  "修理費用",
  "対応区分",
  "案内文補足",
  "受付状態",
];

const OPTION_MASTER_HEADERS = [
  "オプション名",
  "価格",
  "ステータス",
];

const USER_MASTER_HEADERS = [
  "メールアドレス",
  "店舗名",
  "権限",
];

const STAFF_MASTER_HEADERS = [
  "スタッフ名",
  "店舗名",
  "メールアドレス",
];

const INQUIRY_HISTORY_HEADERS = [
  "保存日時",
  "店舗名",
  "ログインメール",
  "権限",
  "機種名",
  "修理内容",
  "対応結果",
  "カテゴリ",
  "メーカー",
  "型番",
  "症状",
  "見積金額",
  "対応区分",
  "備考",
  "お客様案内文",
  "予約コピー",
];

const ADMIN_REPORT_HEADERS = [
  "報告日時",
  "店舗名",
  "ログインメール",
  "権限",
  "報告種別",
  "カテゴリ",
  "対象機種",
  "対象修理内容・症状",
  "報告内容",
  "見積もり要約",
  "ステータス",
];

const REPAIR_ITEM_MASTER_HEADERS = [
  "並び順",
  "カテゴリ",
  "修理項目名",
  "表示名",
  "価格種別",
  "標準価格",
  "対応区分",
  "対象機種カテゴリ",
  "備考",
  "受付状態",
];

const ANDROID_MODEL_REPAIR_SETTINGS_HEADERS = [
  "作成日時",
  "更新日時",
  "メーカー",
  "機種名",
  "型番",
  "修理メニュー名",
  "対応区分",
  "個別価格",
  "備考",
  "受付状態",
];

const MASTER_CHANGE_HISTORY_HEADERS = [
  "日時",
  "操作種別",
  "カテゴリ",
  "店舗名",
  "ログインメール",
  "権限",
  "対象シート",
  "対象行",
  "変更前",
  "変更後",
  "結果",
];

function doGet(e) {
  try {
    const action = getAction_(e);

    if (!action || action === "getInitialData") {
      return createJsonResponse(getInitialData());
    }

    if (action === "getPriceMaster") {
      return createJsonResponse(getPriceMaster());
    }

    if (action === "getSwitchEstimateMaster") {
      return createJsonResponse(getSwitchEstimateMaster());
    }

    if (action === "getOptionMaster") {
      return createJsonResponse(getOptionMaster());
    }

    if (action === "getUserMaster") {
      return createJsonResponse(getUserMaster());
    }

    if (action === "getRepairItemMaster") {
      return createJsonResponse(getRepairItemMaster());
    }

    if (action === "getAndroidModelRepairSettings") {
      return createJsonResponse(getAndroidModelRepairSettings());
    }

    return createJsonResponse({
      success: false,
      ok: false,
      message: "Invalid action: " + action,
    });
  } catch (error) {
    return createJsonResponse(createErrorResponse_(error));
  }
}

function doPost(e) {
  try {
    const body = parsePostBody_(e);
    const action = body.action || getAction_(e);
    const payload = body.payload || {};

    if (action === "saveInquiry") {
      return createJsonResponse(saveInquiry(payload));
    }

    if (action === "sendAdminReport") {
      return createJsonResponse(sendAdminReport(payload));
    }

    if (action === "getInitialData") {
      return createJsonResponse(getInitialData());
    }

    if (action === "getPriceMaster") {
      return createJsonResponse(getPriceMaster());
    }

    if (action === "getSwitchEstimateMaster") {
      return createJsonResponse(getSwitchEstimateMaster());
    }

    if (action === "getOptionMaster") {
      return createJsonResponse(getOptionMaster());
    }

    if (action === "getUserMaster") {
      return createJsonResponse(getUserMaster());
    }

    if (action === "getRepairItemMaster") {
      return createJsonResponse(getRepairItemMaster());
    }

    if (action === "getAndroidModelRepairSettings") {
      return createJsonResponse(getAndroidModelRepairSettings());
    }

    if (action === "addAndroidMasterItem") {
      return createJsonResponse(addAndroidMasterItem(payload));
    }

    if (action === "updateAndroidMasterItem") {
      return createJsonResponse(updateAndroidMasterItem(payload));
    }

    if (action === "deleteAndroidMasterItem") {
      return createJsonResponse(deleteAndroidMasterItem(payload));
    }

    if (action === "addSwitchMasterItem") {
      return createJsonResponse(addSwitchMasterItem(payload));
    }

    if (action === "updateSwitchMasterItem") {
      return createJsonResponse(updateSwitchMasterItem(payload));
    }

    if (action === "deleteSwitchMasterItem") {
      return createJsonResponse(deleteSwitchMasterItem(payload));
    }

    if (action === "addRepairItem") {
      return createJsonResponse(addRepairItem(payload));
    }

    if (action === "updateRepairItem") {
      return createJsonResponse(updateRepairItem(payload));
    }

    if (action === "upsertAndroidModelRepairSettings") {
      return createJsonResponse(upsertAndroidModelRepairSettings(payload));
    }

    return createJsonResponse({
      success: false,
      ok: false,
      message: "Invalid action: " + action,
    });
  } catch (error) {
    return createJsonResponse(createErrorResponse_(error));
  }
}

function getInitialData() {
  const priceMasterResult = getPriceMaster();
  const switchEstimateMasterResult = getSwitchEstimateMaster();
  const dysonRoombaEstimateMasterResult = getDysonRoombaEstimateMaster();
  const optionMasterResult = getOptionMaster();
  const userMasterResult = getUserMaster();
  const repairItemMasterResult = getRepairItemMaster();
  const androidModelRepairSettingsResult = getAndroidModelRepairSettings();

  return {
    success: true,
    ok: true,
    data: {
      priceMaster: priceMasterResult.priceMaster || [],
      switchEstimateMaster: switchEstimateMasterResult.switchEstimateMaster || [],
      dysonRoombaEstimateMaster:
        dysonRoombaEstimateMasterResult.dysonRoombaEstimateMaster || [],
      repairItemMaster: repairItemMasterResult.repairItemMaster || [],
      androidModelRepairSettings:
        androidModelRepairSettingsResult.androidModelRepairSettings || [],
      staffList: getStaffList_().staffList || [],
      optionMaster: optionMasterResult.optionMaster || [],
      users: userMasterResult.users || [],
    },
  };
}

function getPriceMaster() {
  const sheet = getRequiredSheet_(ANDROID_MASTER_SHEET_NAME);
  const rows = getDataRows_(sheet);
  const priceMaster = rows.map(function(row) {
    return {
      rowNumber: row.rowNumber,
      sortOrder: row.value("並び順", 0),
      manufacturer: row.text("メーカー", 1),
      modelName: row.text("機種名", 2),
      modelNumber: row.text("型番", 3),
      screenPrice: row.value("画面修理価格", 4),
      screenStatus: row.text("画面修理対応区分", 5),
      batteryStatus: row.text("バッテリー対応区分", 6),
      chargePortStatus: row.text("充電口対応区分", 7),
      cameraLensStatus: row.text("カメラレンズ対応区分", 8),
      sleepButtonStatus: row.text("スリープボタン対応区分", 9),
      volumeButtonStatus: row.text("音量ボタン対応区分", 10),
      note: row.text("備考", 11),
      receptionStatus: row.text("受付状態", 12),
    };
  }).filter(function(item) {
    return item.manufacturer || item.modelName;
  });

  return {
    success: true,
    ok: true,
    priceMaster: priceMaster,
    items: priceMaster,
  };
}

function getSwitchEstimateMaster() {
  const sheet = getRequiredSheet_(SWITCH_MASTER_SHEET_NAME);
  const rows = getDataRows_(sheet);
  const switchEstimateMaster = rows.map(function(row) {
    return {
      rowNumber: row.rowNumber,
      sortOrder: row.value("並び順", 0),
      modelName: row.text("機種名", 1),
      modelNumber: row.text("型番", 2),
      symptom: row.text("症状", 3),
      estimatedRepairType: row.text("想定修理内容", 4),
      repairPrice: row.value("修理費用", 5),
      repairStatus: row.text("対応区分", 6),
      note: row.text("案内文補足", 7),
      receptionStatus: row.text("受付状態", 8),
    };
  }).filter(function(item) {
    return item.modelName || item.symptom || item.estimatedRepairType;
  });

  return {
    success: true,
    ok: true,
    switchEstimateMaster: switchEstimateMaster,
    items: switchEstimateMaster,
  };
}

function getDysonRoombaEstimateMaster() {
  const sheet = getOptionalSheet_(DYSON_ROOMBA_MASTER_SHEET_NAME);

  if (!sheet) {
    return {
      success: true,
      ok: true,
      dysonRoombaEstimateMaster: [],
      items: [],
    };
  }

  const rows = getDataRows_(sheet);
  const dysonRoombaEstimateMaster = rows.map(function(row) {
    return {
      rowNumber: row.rowNumber,
      category: row.text("カテゴリ", 0),
      manufacturer: row.text("メーカー", 1),
      modelName: row.text("機種名", 2),
      modelNumber: row.text("型番", 3),
      symptomSelectionType: row.text("症状選択種別", 4),
      symptom: row.text("症状", 5),
      candidateGroupId: row.text("候補グループID", 6),
      estimatedRepairType: row.text("想定修理内容", 7),
      price: row.value("価格", 8),
      leadTime: row.text("納期", 9),
      note: row.text("案内文補足", 10),
      receptionStatus: row.text("受付状態", 11),
      sortOrder: row.value("並び順", 12),
    };
  }).filter(function(item) {
    return item.category || item.modelName || item.symptom || item.estimatedRepairType;
  });

  return {
    success: true,
    ok: true,
    dysonRoombaEstimateMaster: dysonRoombaEstimateMaster,
    items: dysonRoombaEstimateMaster,
  };
}

function getOptionMaster() {
  const sheet = getOptionalSheet_(OPTION_MASTER_SHEET_NAME);

  if (!sheet) {
    return {
      success: true,
      ok: true,
      optionMaster: [],
      options: [],
    };
  }

  const rows = getDataRows_(sheet);
  const optionMaster = rows.map(function(row) {
    const rowObject = rowToObject_(row.headers, row.values);
    const optionName =
      row.text("オプション名", 0) ||
      row.text("optionName", 0) ||
      row.text("name", 0) ||
      row.text("label", 0);
    const optionPrice =
      row.value("価格", 1) ||
      row.value("オプション価格", 1) ||
      row.value("optionPrice", 1) ||
      row.value("price", 1);
    const status =
      row.text("ステータス", 2) ||
      row.text("受付状態", 2) ||
      row.text("status", 2);

    rowObject.optionName = rowObject.optionName || optionName;
    rowObject.name = rowObject.name || optionName;
    rowObject.label = rowObject.label || optionName;
    rowObject.optionPrice = rowObject.optionPrice || optionPrice;
    rowObject.price = rowObject.price || optionPrice;
    rowObject.status = rowObject.status || status;

    return rowObject;
  }).filter(function(item) {
    return item.optionName || item.name || item.label;
  });

  return {
    success: true,
    ok: true,
    optionMaster: optionMaster,
    options: optionMaster,
  };
}

function getUserMaster() {
  const sheet = getOptionalSheet_(USER_MASTER_SHEET_NAME);

  if (!sheet) {
    return {
      success: false,
      ok: false,
      message: USER_MASTER_SHEET_NAME + "シートが見つかりません。",
      error: USER_MASTER_SHEET_NAME + "シートが見つかりません。",
      users: [],
    };
  }

  const rows = getDataRows_(sheet);
  const users = rows.map(function(row) {
    return {
      email:
        row.text("メールアドレス", 0) ||
        row.text("メール", 0) ||
        row.text("email", 0),
      storeName:
        row.text("店舗名", 1) ||
        row.text("storeName", 1),
      role:
        row.text("権限", 2) ||
        row.text("role", 2) ||
        "staff",
    };
  }).filter(function(user) {
    return user.email;
  });

  return {
    success: true,
    ok: true,
    users: users,
    data: {
      users: users,
    },
  };
}

function saveInquiry(payload) {
  const sheet = getOrCreateSheetWithHeaders_(
    INQUIRY_HISTORY_SHEET_NAME,
    INQUIRY_HISTORY_HEADERS,
  );

  sheet.appendRow([
    new Date(),
    payload.storeName || "",
    payload.loginEmail || "",
    payload.role || "",
    payload.modelName || "",
    payload.repairType || "",
    payload.status || "",
    payload.category || "",
    payload.maker || "",
    payload.modelNumber || "",
    payload.symptom || "",
    payload.price || "",
    payload.supportStatus || "",
    payload.note || "",
    payload.customerMessage || "",
    payload.reservationCopy || "",
  ]);

  return {
    success: true,
    ok: true,
    message: "見積履歴を保存しました。",
  };
}

function sendAdminReport(payload) {
  const sheet = getOrCreateAdminReportSheet_();

  sheet.appendRow([
    payload.createdAt ? new Date(payload.createdAt) : new Date(),
    payload.storeName || "",
    payload.loginEmail || "",
    payload.role || "",
    payload.reportType || "",
    payload.category || "",
    payload.targetModel || "",
    payload.targetRepairOrSymptom || "",
    payload.message || "",
    payload.currentEstimateSummary || "",
    "未対応",
  ]);

  return {
    success: true,
    ok: true,
    message: "管理者へ報告しました。",
  };
}

function getRepairItemMaster() {
  const sheet = getOrCreateRepairItemMasterSheet_();
  const rows = getDataRows_(sheet);
  const repairItemMaster = rows.map(function(row) {
    return {
      rowNumber: row.rowNumber,
      sortOrder: row.value("並び順", 0),
      category: row.text("カテゴリ", 1),
      repairItemName: row.text("修理項目名", 2),
      displayName: row.text("表示名", 3),
      priceType: row.text("価格種別", 4),
      standardPrice: row.value("標準価格", 5),
      repairStatus: row.text("対応区分", 6),
      targetModelCategory: row.text("対象機種カテゴリ", 7),
      note: row.text("備考", 8),
      receptionStatus: row.text("受付状態", 9),
    };
  }).filter(function(item) {
    return item.repairItemName;
  });

  return {
    success: true,
    ok: true,
    repairItemMaster: repairItemMaster,
    items: repairItemMaster,
  };
}

function addAndroidMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(ANDROID_MASTER_SHEET_NAME);
  const rowNumber = Math.max(sheet.getLastRow() + 1, 2);
  const valuesByHeader = normalizeAndroidMasterItemForWrite_(
    payload.item || {},
    {},
  );
  writeRowByHeaders_(sheet, rowNumber, valuesByHeader);
  const afterValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    ANDROID_MASTER_HEADERS,
  );

  appendMasterChangeHistory_(payload, {
    operationType: "Android新規追加",
    category: "Android",
    targetSheet: ANDROID_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: "",
    afterValue: afterValue,
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "Androidマスターを追加しました。",
  };
}

function updateAndroidMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(ANDROID_MASTER_SHEET_NAME);
  const rowNumber = normalizeRowNumber_(payload.item && payload.item.rowNumber);
  const beforeValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    ANDROID_MASTER_HEADERS,
  );
  const valuesByHeader = normalizeAndroidMasterItemForWrite_(
    payload.item || {},
    beforeValue,
  );
  writeRowByHeaders_(sheet, rowNumber, valuesByHeader);
  const afterValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    ANDROID_MASTER_HEADERS,
  );

  appendMasterChangeHistory_(payload, {
    operationType: "Android既存変更",
    category: "Android",
    targetSheet: ANDROID_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: beforeValue,
    afterValue: afterValue,
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "Androidマスターを更新しました。",
  };
}

function deleteAndroidMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(ANDROID_MASTER_SHEET_NAME);
  const rowNumber = normalizeRowNumber_(payload.rowNumber);

  if (rowNumber > sheet.getLastRow()) {
    throw new Error("削除対象の行が見つかりません。");
  }

  const beforeValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    ANDROID_MASTER_HEADERS,
  );
  const headerIndexes = getHeaderIndexes_(sheet);
  const receptionStatusColumn = headerIndexes["受付状態"];

  if (receptionStatusColumn === undefined) {
    throw new Error("受付状態列が見つからないため削除できません。");
  }

  sheet.getRange(rowNumber, receptionStatusColumn + 1).setValue("受付停止中");

  const afterValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    ANDROID_MASTER_HEADERS,
  );

  appendMasterChangeHistory_(payload, {
    operationType: "Android機種削除",
    category: "Android",
    targetSheet: ANDROID_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: beforeValue,
    afterValue: afterValue,
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    message: "登録機種を削除しました。",
    rowNumber: rowNumber,
  };
}

function addSwitchMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(SWITCH_MASTER_SHEET_NAME);
  const values = switchMasterItemToRow_(payload.item || {});
  sheet.appendRow(values);
  const rowNumber = sheet.getLastRow();

  appendMasterChangeHistory_(payload, {
    operationType: "Switch新規追加",
    category: "Switch",
    targetSheet: SWITCH_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: "",
    afterValue: rowToObject_(SWITCH_MASTER_HEADERS, values),
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "Switchマスターを追加しました。",
  };
}

function updateSwitchMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(SWITCH_MASTER_SHEET_NAME);
  const rowNumber = normalizeRowNumber_(payload.item && payload.item.rowNumber);
  const beforeValues = sheet
    .getRange(rowNumber, 1, 1, SWITCH_MASTER_HEADERS.length)
    .getValues()[0];
  const values = switchMasterItemToRow_(payload.item || {});

  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);

  appendMasterChangeHistory_(payload, {
    operationType: "Switch既存変更",
    category: "Switch",
    targetSheet: SWITCH_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: rowToObject_(SWITCH_MASTER_HEADERS, beforeValues),
    afterValue: rowToObject_(SWITCH_MASTER_HEADERS, values),
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "Switchマスターを更新しました。",
  };
}

function deleteSwitchMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(SWITCH_MASTER_SHEET_NAME);
  const rowNumber = normalizeRowNumber_(payload.rowNumber);

  if (rowNumber > sheet.getLastRow()) {
    throw new Error("削除対象の行が見つかりません。");
  }

  const beforeValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    SWITCH_MASTER_HEADERS,
  );
  const headerIndexes = getHeaderIndexes_(sheet);
  const receptionStatusColumn = headerIndexes["受付状態"];

  if (receptionStatusColumn === undefined) {
    throw new Error("受付状態列が見つからないため削除できません。");
  }

  sheet.getRange(rowNumber, receptionStatusColumn + 1).setValue("受付停止中");

  const afterValue = getRowObjectByHeaders_(
    sheet,
    rowNumber,
    SWITCH_MASTER_HEADERS,
  );

  appendMasterChangeHistory_(payload, {
    operationType: "Switchメニュー削除",
    category: "Switch",
    targetSheet: SWITCH_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: beforeValue,
    afterValue: afterValue,
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    message: "Switchメニューを削除しました。",
    rowNumber: rowNumber,
  };
}

function addRepairItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getOrCreateRepairItemMasterSheet_();
  const values = repairItemToRow_(payload.item || {});
  sheet.appendRow(values);
  const rowNumber = sheet.getLastRow();

  appendMasterChangeHistory_(payload, {
    operationType: "修理項目追加",
    category: values[1],
    targetSheet: REPAIR_ITEM_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: "",
    afterValue: rowToObject_(REPAIR_ITEM_MASTER_HEADERS, values),
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "修理項目を追加しました。",
  };
}

function updateRepairItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getOrCreateRepairItemMasterSheet_();
  const rowNumber = normalizeRowNumber_(payload.item && payload.item.rowNumber);
  const beforeValues = sheet
    .getRange(rowNumber, 1, 1, REPAIR_ITEM_MASTER_HEADERS.length)
    .getValues()[0];
  const values = repairItemToRow_(payload.item || {});

  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);

  appendMasterChangeHistory_(payload, {
    operationType: "修理項目変更",
    category: values[1],
    targetSheet: REPAIR_ITEM_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: rowToObject_(REPAIR_ITEM_MASTER_HEADERS, beforeValues),
    afterValue: rowToObject_(REPAIR_ITEM_MASTER_HEADERS, values),
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "修理項目を更新しました。",
  };
}

function getAndroidModelRepairSettings() {
  const sheet = getOrCreateAndroidModelRepairSettingsSheet_();
  const rows = getDataRows_(sheet);
  const androidModelRepairSettings = rows.map(function(row) {
    return {
      rowNumber: row.rowNumber,
      createdAt: row.value("作成日時", 0),
      updatedAt: row.value("更新日時", 1),
      manufacturer: row.text("メーカー", 2),
      modelName: row.text("機種名", 3),
      modelNumber: row.text("型番", 4),
      repairItemName: row.text("修理メニュー名", 5),
      repairStatus: row.text("対応区分", 6),
      customPrice: row.value("個別価格", 7),
      note: row.text("備考", 8),
      receptionStatus: row.text("受付状態", 9),
    };
  }).filter(function(item) {
    return item.manufacturer && item.modelName && item.repairItemName;
  });

  return {
    success: true,
    ok: true,
    androidModelRepairSettings: androidModelRepairSettings,
    settings: androidModelRepairSettings,
  };
}

function upsertAndroidModelRepairSettings(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getOrCreateAndroidModelRepairSettingsSheet_();
  const settings = Array.isArray(payload && payload.settings) ? payload.settings : [];
  const now = new Date();
  const rows = getDataRows_(sheet);
  const rowByKey = {};

  rows.forEach(function(row) {
    const key = createAndroidModelRepairSettingKey_({
      manufacturer: row.value("メーカー", 2),
      modelName: row.value("機種名", 3),
      modelNumber: row.value("型番", 4),
      repairItemName: row.value("修理メニュー名", 5),
    });

    if (key) {
      rowByKey[key] = {
        rowNumber: row.rowNumber,
        values: row.values,
      };
    }
  });

  let savedCount = 0;

  settings.forEach(function(setting) {
    const normalizedSetting = normalizeAndroidModelRepairSetting_(setting);
    const key = createAndroidModelRepairSettingKey_(normalizedSetting);

    if (!key) {
      return;
    }

    const existing = rowByKey[key];

    if (existing) {
      const beforeValues = existing.values;
      const values = androidModelRepairSettingToRow_(
        normalizedSetting,
        beforeValues[0] || now,
        now,
      );

      sheet.getRange(existing.rowNumber, 1, 1, values.length).setValues([values]);
      existing.values = values;

      appendMasterChangeHistory_(payload, {
        operationType: "Android機種別修理メニュー設定変更",
        category: "Android",
        targetSheet: ANDROID_MODEL_REPAIR_SETTINGS_SHEET_NAME,
        rowNumber: existing.rowNumber,
        beforeValue: rowToObject_(ANDROID_MODEL_REPAIR_SETTINGS_HEADERS, beforeValues),
        afterValue: rowToObject_(ANDROID_MODEL_REPAIR_SETTINGS_HEADERS, values),
        result: "成功",
      });
    } else {
      const values = androidModelRepairSettingToRow_(normalizedSetting, now, now);
      sheet.appendRow(values);
      const rowNumber = sheet.getLastRow();

      rowByKey[key] = {
        rowNumber: rowNumber,
        values: values,
      };

      appendMasterChangeHistory_(payload, {
        operationType: "Android機種別修理メニュー設定追加",
        category: "Android",
        targetSheet: ANDROID_MODEL_REPAIR_SETTINGS_SHEET_NAME,
        rowNumber: rowNumber,
        beforeValue: "",
        afterValue: rowToObject_(ANDROID_MODEL_REPAIR_SETTINGS_HEADERS, values),
        result: "成功",
      });
    }

    savedCount += 1;
  });

  return {
    success: true,
    ok: true,
    savedCount: savedCount,
    message: "Android機種別修理メニュー設定を保存しました。",
  };
}

function getStaffList_() {
  const sheet = getOptionalSheet_(STAFF_MASTER_SHEET_NAME);

  if (!sheet) {
    return {
      success: true,
      ok: true,
      staffList: [],
    };
  }

  const rows = getDataRows_(sheet);
  const staffList = rows.map(function(row) {
    const rowObject = rowToObject_(row.headers, row.values);

    rowObject.name =
      rowObject.name ||
      rowObject.staffName ||
      row.text("スタッフ名", 0) ||
      row.text("氏名", 0);
    rowObject.storeName = rowObject.storeName || row.text("店舗名", 1);
    rowObject.email =
      rowObject.email ||
      row.text("メールアドレス", 2) ||
      row.text("メール", 2);

    return rowObject;
  }).filter(function(item) {
    return item.name || item.storeName || item.email;
  });

  return {
    success: true,
    ok: true,
    staffList: staffList,
  };
}

function androidMasterItemToRow_(item) {
  return [
    item.sortOrder || "",
    item.manufacturer || "",
    item.modelName || "",
    item.modelNumber || "",
    item.screenPrice || "",
    item.screenStatus || "",
    item.batteryStatus || "",
    item.chargePortStatus || "",
    item.cameraLensStatus || "",
    item.sleepButtonStatus || "",
    item.volumeButtonStatus || "",
    item.note || "",
    item.receptionStatus || "",
  ];
}

function androidMasterItemToObject_(item) {
  return rowToObject_(ANDROID_MASTER_HEADERS, androidMasterItemToRow_(item));
}

function normalizeAndroidMasterItemForWrite_(item, existingValues) {
  const result = androidMasterItemToObject_(item);

  ANDROID_SUPPORT_STATUS_HEADERS.forEach(function(header) {
    result[header] = normalizeAndroidSupportStatus_(
      result[header],
      existingValues[header],
    );
  });

  result["受付状態"] = normalizeAndroidReceptionStatus_(
    result["受付状態"],
    existingValues["受付状態"],
  );

  return result;
}

function normalizeAndroidReceptionStatus_(value, existingValue) {
  const normalized = extractAndroidReceptionStatus_(value);

  if (normalized) {
    return normalized;
  }

  return extractAndroidReceptionStatus_(existingValue) || "受付中";
}

function extractAndroidReceptionStatus_(value) {
  const status = String(value || "")
    .normalize("NFKC")
    .trim();

  if (
    status === "受付中" ||
    status === "受付可" ||
    status === "受付可能" ||
    status === "有効"
  ) {
    return "受付中";
  }

  if (
    status === "受付停止中" ||
    status === "受付停止" ||
    status === "停止" ||
    status === "削除済み" ||
    status === "非表示"
  ) {
    return "受付停止中";
  }

  return "";
}

function normalizeAndroidSupportStatus_(value, existingValue) {
  const normalized = extractAndroidSupportStatus_(value);

  if (normalized) {
    return normalized;
  }

  return extractAndroidSupportStatus_(existingValue) || "非対応";
}

function extractAndroidSupportStatus_(value) {
  const status = String(value || "")
    .normalize("NFKC")
    .trim()
    .split(":")[0]
    .trim();

  if (status === "店舗対応可" || status === "店頭対応可") {
    return "店舗対応可";
  }

  if (
    status === "外注必要" ||
    status === "委託対応" ||
    status === "外注対応"
  ) {
    return "外注必要";
  }

  if (status === "非対応") {
    return "非対応";
  }

  return "";
}

function switchMasterItemToRow_(item) {
  return [
    item.sortOrder || "",
    item.modelName || "",
    item.modelNumber || "",
    item.symptom || "",
    item.estimatedRepairType || "",
    item.repairPrice || "",
    item.repairStatus || "",
    item.note || "",
    item.receptionStatus || "",
  ];
}

function repairItemToRow_(item) {
  const repairItemName = item.repairItemName || "";

  return [
    item.sortOrder || "",
    item.category || "",
    repairItemName,
    item.displayName || repairItemName,
    item.priceType || "",
    item.standardPrice || "",
    item.repairStatus || "",
    item.targetModelCategory || "",
    item.note || "",
    item.receptionStatus || "",
  ];
}

function androidModelRepairSettingToRow_(setting, createdAt, updatedAt) {
  return [
    createdAt || "",
    updatedAt || "",
    setting.manufacturer || "",
    setting.modelName || "",
    setting.modelNumber || "",
    setting.repairItemName || "",
    setting.repairStatus || "",
    setting.customPrice || "",
    setting.note || "",
    setting.receptionStatus || "",
  ];
}

function normalizeAndroidModelRepairSetting_(setting) {
  return {
    manufacturer: String((setting && setting.manufacturer) || "").trim(),
    modelName: String((setting && setting.modelName) || "").trim(),
    modelNumber: String((setting && setting.modelNumber) || "").trim(),
    repairItemName: String((setting && setting.repairItemName) || "").trim(),
    repairStatus: String((setting && setting.repairStatus) || "").trim() || "要確認",
    customPrice:
      setting && setting.customPrice !== undefined ? setting.customPrice : "",
    note: String((setting && setting.note) || "").trim(),
    receptionStatus:
      String((setting && setting.receptionStatus) || "").trim() || "受付可",
  };
}

function createAndroidModelRepairSettingKey_(setting) {
  const manufacturer = normalizeAndroidModelRepairSettingText_(
    setting && setting.manufacturer,
  );
  const modelName = normalizeAndroidModelRepairSettingText_(
    setting && setting.modelName,
  );
  const modelNumber = normalizeAndroidModelRepairSettingText_(
    setting && setting.modelNumber,
  );
  const repairItemName = normalizeAndroidRepairItemSettingText_(
    setting && setting.repairItemName,
  );

  if (!manufacturer || !modelName || !repairItemName) {
    return "";
  }

  return [manufacturer, modelName, modelNumber, repairItemName].join("\t");
}

function getAdminRoleError_(payload) {
  if (!payload || payload.role !== "admin") {
    return {
      success: false,
      ok: false,
      message: "管理者権限が必要です。",
    };
  }

  return null;
}

function getAction_(e) {
  return String((e && e.parameter && e.parameter.action) || "").trim();
}

function parsePostBody_(e) {
  const contents = e && e.postData && e.postData.contents;

  if (!contents) {
    return {};
  }

  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error("POST body JSONの解析に失敗しました。");
  }
}

function createErrorResponse_(error) {
  return {
    success: false,
    ok: false,
    message: error && error.message ? error.message : String(error),
  };
}

function normalizeRowNumber_(rowNumber) {
  const normalized = Number(rowNumber);

  if (!Number.isFinite(normalized) || normalized < 2) {
    throw new Error("更新対象の行番号が不正です。");
  }

  return Math.floor(normalized);
}

function getRequiredSheet_(sheetName) {
  const sheet = getOptionalSheet_(sheetName);

  if (!sheet) {
    throw new Error(sheetName + "シートが見つかりません。");
  }

  return sheet;
}

function getOptionalSheet_(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

function getOrCreateAdminReportSheet_() {
  const sheet = getOrCreateSheetWithHeaders_(
    ADMIN_REPORT_SHEET_NAME,
    ADMIN_REPORT_HEADERS,
  );
  ensureHeaders_(sheet, ADMIN_REPORT_HEADERS);

  return sheet;
}

function getOrCreateRepairItemMasterSheet_() {
  return getOrCreateSheetWithHeaders_(
    REPAIR_ITEM_MASTER_SHEET_NAME,
    REPAIR_ITEM_MASTER_HEADERS,
  );
}

function getOrCreateAndroidModelRepairSettingsSheet_() {
  return getOrCreateSheetWithHeaders_(
    ANDROID_MODEL_REPAIR_SETTINGS_SHEET_NAME,
    ANDROID_MODEL_REPAIR_SETTINGS_HEADERS,
  );
}

function getOrCreateMasterChangeHistorySheet_() {
  return getOrCreateSheetWithHeaders_(
    MASTER_CHANGE_HISTORY_SHEET_NAME,
    MASTER_CHANGE_HISTORY_HEADERS,
  );
}

function getOrCreateSheetWithHeaders_(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    return sheet;
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return sheet;
  }

  ensureHeaders_(sheet, headers);

  return sheet;
}

function ensureHeaders_(sheet, headers) {
  const width = Math.max(sheet.getLastColumn(), headers.length, 1);
  const currentHeaders = sheet.getRange(1, 1, 1, width).getValues()[0];
  const currentHeaderMap = {};

  currentHeaders.forEach(function(header) {
    const text = String(header || "").trim();

    if (text) {
      currentHeaderMap[text] = true;
    }
  });

  headers.forEach(function(header, index) {
    if (!currentHeaders[index]) {
      sheet.getRange(1, index + 1).setValue(header);
      currentHeaderMap[header] = true;
    }
  });
}

function getDataRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = Math.max(sheet.getLastColumn(), 1);

  if (lastRow < 2) {
    return [];
  }

  const headers = sheet
    .getRange(1, 1, 1, lastColumn)
    .getValues()[0]
    .map(function(header) {
      return String(header || "").trim();
    });
  const values = sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues();
  const headerIndex = {};

  headers.forEach(function(header, index) {
    if (header && headerIndex[header] === undefined) {
      headerIndex[header] = index;
    }
  });

  return values.map(function(rowValues, index) {
    return {
      rowNumber: index + 2,
      headers: headers,
      values: rowValues,
      value: function(header, fallbackIndex) {
        const indexFromHeader = headerIndex[header];
        const indexToUse =
          indexFromHeader === undefined ? fallbackIndex : indexFromHeader;

        return rowValues[indexToUse] === undefined ? "" : rowValues[indexToUse];
      },
      text: function(header, fallbackIndex) {
        const value = this.value(header, fallbackIndex);

        return String(value || "").trim();
      },
    };
  });
}

function getHeaderIndexes_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const indexes = {};

  headers.forEach(function(header, index) {
    const text = String(header || "").trim();

    if (text && indexes[text] === undefined) {
      indexes[text] = index;
    }
  });

  return indexes;
}

function getRowObjectByHeaders_(sheet, rowNumber, headers) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const rowValues = sheet
    .getRange(rowNumber, 1, 1, lastColumn)
    .getValues()[0];
  const headerIndexes = getHeaderIndexes_(sheet);
  const result = {};

  headers.forEach(function(header) {
    const index = headerIndexes[header];
    result[header] =
      index === undefined || rowValues[index] === undefined
        ? ""
        : rowValues[index];
  });

  return result;
}

function writeRowByHeaders_(sheet, rowNumber, valuesByHeader) {
  const headerIndexes = getHeaderIndexes_(sheet);

  Object.keys(valuesByHeader).forEach(function(header) {
    const index = headerIndexes[header];

    if (index !== undefined) {
      sheet.getRange(rowNumber, index + 1).setValue(valuesByHeader[header]);
    }
  });
}

function appendMasterChangeHistory_(payload, detail) {
  const sheet = getOrCreateMasterChangeHistorySheet_();

  sheet.appendRow([
    new Date(),
    detail.operationType,
    detail.category,
    payload.storeName || "",
    payload.loginEmail || "",
    payload.role || "",
    detail.targetSheet,
    detail.rowNumber || "",
    detail.beforeValue ? JSON.stringify(detail.beforeValue) : "",
    detail.afterValue ? JSON.stringify(detail.afterValue) : "",
    detail.result,
  ]);
}

function rowToObject_(headers, values) {
  const result = {};

  headers.forEach(function(header, index) {
    result[header] = values[index] === undefined ? "" : values[index];
  });

  return result;
}

function normalizeAndroidModelRepairSettingText_(value) {
  return normalizeRomanNumeralsForGas_(
    String(value || "")
      .normalize("NFKC")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " "),
  ).replace(/[\s_\-‐‑‒–—ー]/g, "");
}

function normalizeAndroidRepairItemSettingText_(value) {
  return String(value || "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-‐‑‒–—ー]/g, "")
    .replace(/battery/g, "バッテリー")
    .replace(/screen/g, "画面")
    .replace(/display/g, "画面")
    .replace(/chargeport/g, "充電口")
    .replace(/chargingport/g, "充電口")
    .replace(/camera/g, "カメラ");
}

function normalizeRomanNumeralsForGas_(value) {
  return value
    .replace(
      /(\d+)(ix|viii|vii|vi|iv|v|iii|ii|i)\b/g,
      function(match, number, roman) {
        return number + romanNumeralToNumberForGas_(roman);
      },
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

function romanNumeralToNumberForGas_(value) {
  const values = {
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

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
