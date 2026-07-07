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
 * if (action === "addSwitchMasterItem") {
 *   return createJsonResponse(addSwitchMasterItem(payload));
 * }
 */

const MASTER_SHEET_NAMES = {
  PRICE_MASTER: "RepairQuote価格マスター",
  SWITCH_ESTIMATE_MASTER: "Switch症状見積もりマスター",
  OPTION_MASTER: "オプションマスター",
  USER_MASTER: "スタッフ管理",
  INQUIRY_HISTORY: "問い合わせ履歴",
  ADMIN_REPORT: "管理者報告",
  MASTER_ADD_HISTORY: "マスター追加履歴",
};

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

function addAndroidMasterItem(payload) {
  if (!isAdminPayload(payload)) {
    return createAdminRequiredResponse();
  }

  const requiredValues = [
    payload.manufacturer,
    payload.modelName,
    payload.receptionStatus,
  ];

  if (hasBlankRequiredValue(requiredValues)) {
    writeMasterAddHistory("Android", payload, "必須項目不足");

    return createRequiredMissingResponse();
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET_NAMES.PRICE_MASTER);

  if (!sheet) {
    writeMasterAddHistory("Android", payload, "シートなし");

    return {
      ok: false,
      success: false,
      message: "RepairQuote価格マスターシートが見つかりません。",
    };
  }

  const duplicated = hasAndroidMasterDuplicate(sheet, payload);

  sheet.appendRow([
    payload.sortOrder || "",
    payload.manufacturer || "",
    payload.modelName || "",
    payload.modelNumber || "",
    payload.screenPrice || "",
    payload.screenStatus || "",
    payload.batteryStatus || "",
    payload.chargePortStatus || "",
    payload.cameraLensStatus || "",
    payload.sleepButtonStatus || "",
    payload.volumeButtonStatus || "",
    payload.note || "",
    payload.receptionStatus || "",
  ]);

  writeMasterAddHistory(
    "Android",
    payload,
    duplicated ? "追加完了（重複候補あり）" : "追加完了",
  );

  return {
    ok: true,
    success: true,
    duplicated: duplicated,
    message: "Android価格マスターに追加しました。",
  };
}

function addSwitchMasterItem(payload) {
  if (!isAdminPayload(payload)) {
    return createAdminRequiredResponse();
  }

  const requiredValues = [
    payload.modelName,
    payload.symptom,
    payload.estimatedRepairType,
    payload.repairPrice,
    payload.repairStatus,
    payload.receptionStatus,
  ];

  if (hasBlankRequiredValue(requiredValues)) {
    writeMasterAddHistory("Switch", payload, "必須項目不足");

    return createRequiredMissingResponse();
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MASTER_SHEET_NAMES.SWITCH_ESTIMATE_MASTER);

  if (!sheet) {
    writeMasterAddHistory("Switch", payload, "シートなし");

    return {
      ok: false,
      success: false,
      message: "Switch症状見積もりマスターシートが見つかりません。",
    };
  }

  const duplicated = hasSwitchMasterDuplicate(sheet, payload);

  sheet.appendRow([
    payload.sortOrder || "",
    payload.modelName || "",
    payload.modelNumber || "",
    payload.symptom || "",
    payload.estimatedRepairType || "",
    payload.repairPrice || "",
    payload.repairStatus || "",
    payload.note || "",
    payload.receptionStatus || "",
  ]);

  writeMasterAddHistory(
    "Switch",
    payload,
    duplicated ? "追加完了（重複候補あり）" : "追加完了",
  );

  return {
    ok: true,
    success: true,
    duplicated: duplicated,
    message: "Switch症状見積もりマスターに追加しました。",
  };
}

function isAdminPayload(payload) {
  return String((payload && payload.role) || "").trim() === "admin";
}

function createAdminRequiredResponse() {
  return {
    ok: false,
    success: false,
    message: "管理者権限が必要です。",
  };
}

function createRequiredMissingResponse() {
  return {
    ok: false,
    success: false,
    message: "必須項目が不足しています。",
  };
}

function hasBlankRequiredValue(values) {
  return values.some(function(value) {
    return String(value || "").trim() === "";
  });
}

function hasAndroidMasterDuplicate(sheet, payload) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 13).getValues();
  const manufacturer = normalizeMasterValue(payload.manufacturer);
  const modelName = normalizeMasterValue(payload.modelName);
  const modelNumber = normalizeMasterValue(payload.modelNumber);

  return rows.some(function(row) {
    return (
      normalizeMasterValue(row[1]) === manufacturer &&
      normalizeMasterValue(row[2]) === modelName &&
      normalizeMasterValue(row[3]) === modelNumber
    );
  });
}

function hasSwitchMasterDuplicate(sheet, payload) {
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) {
    return false;
  }

  const rows = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  const modelName = normalizeMasterValue(payload.modelName);
  const symptom = normalizeMasterValue(payload.symptom);
  const estimatedRepairType = normalizeMasterValue(payload.estimatedRepairType);

  return rows.some(function(row) {
    return (
      normalizeMasterValue(row[1]) === modelName &&
      normalizeMasterValue(row[3]) === symptom &&
      normalizeMasterValue(row[4]) === estimatedRepairType
    );
  });
}

function normalizeMasterValue(value) {
  return String(value || "").trim();
}

function writeMasterAddHistory(category, payload, result) {
  const sheet = getOrCreateMasterAddHistorySheet();
  const target =
    category === "Android"
      ? "Android価格マスター"
      : "Switch症状見積もりマスター";

  sheet.appendRow([
    new Date(),
    category,
    payload.storeName || "",
    payload.loginEmail || "",
    payload.role || "",
    target,
    JSON.stringify(payload || {}),
    result,
  ]);
}

function getOrCreateMasterAddHistorySheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(MASTER_SHEET_NAMES.MASTER_ADD_HISTORY);

  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAMES.MASTER_ADD_HISTORY);
    sheet.appendRow([
      "日時",
      "カテゴリ",
      "店舗名",
      "ログインメール",
      "権限",
      "追加対象",
      "追加内容",
      "結果",
    ]);
  }

  return sheet;
}

function getOrCreateAdminReportSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = MASTER_SHEET_NAMES.ADMIN_REPORT;

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

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
