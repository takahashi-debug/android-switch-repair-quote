/**
 * Existing doPost must route this action before returning Invalid action.
 *
 * Add this branch to the current action dispatch:
 *
 * if (action === "sendAdminReport") {
 *   return createJsonResponse(sendAdminReport(payload));
 * }
 *
 * if (action === "getUserMaster") {
 *   return createJsonResponse(getUserMaster());
 * }
 *
 * if (action === "addAndroidMasterItem") {
 *   return createJsonResponse(addAndroidMasterItem(payload));
 * }
 *
 * if (action === "updateAndroidMasterItem") {
 *   return createJsonResponse(updateAndroidMasterItem(payload));
 * }
 *
 * if (action === "addSwitchMasterItem") {
 *   return createJsonResponse(addSwitchMasterItem(payload));
 * }
 *
 * if (action === "updateSwitchMasterItem") {
 *   return createJsonResponse(updateSwitchMasterItem(payload));
 * }
 *
 * if (action === "addRepairItem") {
 *   return createJsonResponse(addRepairItem(payload));
 * }
 *
 * if (action === "updateRepairItem") {
 *   return createJsonResponse(updateRepairItem(payload));
 * }
 *
 * Add this branch to doGet:
 *
 * if (action === "getRepairItemMaster") {
 *   return createJsonResponse(getRepairItemMaster());
 * }
 *
 * Add repairItemMaster to the existing getInitialData response data:
 *
 * repairItemMaster: getRepairItemMaster().repairItemMaster
 */

function sendAdminReport(payload) {
  const sheet = getOrCreateAdminReportSheet();

  sheet.appendRow([
    new Date(),
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

function getUserMaster() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("ユーザーマスター");

  if (!sheet) {
    return {
      ok: false,
      error: "ユーザーマスターシートが見つかりません。",
    };
  }

  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      ok: true,
      users: [],
    };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const users = rows
    .map(function(row) {
      return {
        email: String(row[0] || "").trim(),
        storeName: String(row[1] || "").trim(),
        role: String(row[2] || "").trim(),
      };
    })
    .filter(function(user) {
      return user.email;
    });

  return {
    ok: true,
    users: users,
  };
}

function getOrCreateAdminReportSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = "管理者報告";

  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow([
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
    ]);
  } else {
    ensureAdminReportRoleHeader(sheet);
  }

  return sheet;
}

function ensureAdminReportRoleHeader(sheet) {
  const header = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const hasRoleHeader = header.some(function(value) {
    return String(value || "").trim() === "権限";
  });

  if (hasRoleHeader) {
    return;
  }

  sheet.insertColumnAfter(3);
  sheet.getRange(1, 4).setValue("権限");
}

const ANDROID_MASTER_SHEET_NAME = "RepairQuote価格マスター";
const SWITCH_MASTER_SHEET_NAME = "Switch症状見積もりマスター";
const REPAIR_ITEM_MASTER_SHEET_NAME = "修理項目マスター";
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

function addAndroidMasterItem(payload) {
  const adminError = getAdminRoleError_(payload);
  if (adminError) return adminError;

  const sheet = getRequiredSheet_(ANDROID_MASTER_SHEET_NAME);
  const values = androidMasterItemToRow_(payload.item || {});
  sheet.appendRow(values);
  const rowNumber = sheet.getLastRow();

  appendMasterChangeHistory_(payload, {
    operationType: "Android新規追加",
    category: "Android",
    targetSheet: ANDROID_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: "",
    afterValue: rowToObject_(ANDROID_MASTER_HEADERS, values),
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
  const beforeValues = sheet.getRange(rowNumber, 1, 1, ANDROID_MASTER_HEADERS.length).getValues()[0];
  const values = androidMasterItemToRow_(payload.item || {});

  sheet.getRange(rowNumber, 1, 1, values.length).setValues([values]);

  appendMasterChangeHistory_(payload, {
    operationType: "Android既存変更",
    category: "Android",
    targetSheet: ANDROID_MASTER_SHEET_NAME,
    rowNumber: rowNumber,
    beforeValue: rowToObject_(ANDROID_MASTER_HEADERS, beforeValues),
    afterValue: rowToObject_(ANDROID_MASTER_HEADERS, values),
    result: "成功",
  });

  return {
    success: true,
    ok: true,
    rowNumber: rowNumber,
    message: "Androidマスターを更新しました。",
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
  const beforeValues = sheet.getRange(rowNumber, 1, 1, SWITCH_MASTER_HEADERS.length).getValues()[0];
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

function getRepairItemMaster() {
  const sheet = getOrCreateRepairItemMasterSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return {
      success: true,
      ok: true,
      repairItemMaster: [],
      items: [],
    };
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, REPAIR_ITEM_MASTER_HEADERS.length).getValues();
  const repairItemMaster = rows
    .map(function(row, index) {
      return {
        rowNumber: index + 2,
        sortOrder: row[0],
        category: String(row[1] || "").trim(),
        repairItemName: String(row[2] || "").trim(),
        displayName: String(row[3] || "").trim(),
        priceType: String(row[4] || "").trim(),
        standardPrice: row[5],
        repairStatus: String(row[6] || "").trim(),
        targetModelCategory: String(row[7] || "").trim(),
        note: String(row[8] || "").trim(),
        receptionStatus: String(row[9] || "").trim(),
      };
    })
    .filter(function(item) {
      return item.repairItemName;
    });

  return {
    success: true,
    ok: true,
    repairItemMaster: repairItemMaster,
    items: repairItemMaster,
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
  const beforeValues = sheet.getRange(rowNumber, 1, 1, REPAIR_ITEM_MASTER_HEADERS.length).getValues()[0];
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

function normalizeRowNumber_(rowNumber) {
  const normalized = Number(rowNumber);

  if (!Number.isFinite(normalized) || normalized < 2) {
    throw new Error("更新対象の行番号が不正です。");
  }

  return Math.floor(normalized);
}

function getRequiredSheet_(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    throw new Error(sheetName + "シートが見つかりません。");
  }

  return sheet;
}

function getOrCreateRepairItemMasterSheet_() {
  return getOrCreateSheetWithHeaders_(REPAIR_ITEM_MASTER_SHEET_NAME, REPAIR_ITEM_MASTER_HEADERS);
}

function getOrCreateMasterChangeHistorySheet_() {
  return getOrCreateSheetWithHeaders_(MASTER_CHANGE_HISTORY_SHEET_NAME, MASTER_CHANGE_HISTORY_HEADERS);
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
  }

  return sheet;
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

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
