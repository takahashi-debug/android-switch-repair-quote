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

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
