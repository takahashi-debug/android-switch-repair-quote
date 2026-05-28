/**
 * Repair Quote MVP 2 Apps Script追加実装メモ
 *
 * 既存のdoPostでJSONを受け取り、actionごとに以下を呼び分けてください。
 * 価格マスターの列名はプロジェクトのシートに合わせて調整してください。
 */

const PRICE_MASTER_SHEET_NAME = '価格マスター';

const PRICE_MASTER_COLUMNS = {
  sortOrder: '並び順',
  manufacturer: 'メーカー',
  modelName: '機種名',
  modelNumber: '型番',
  screenPrice: '画面修理価格',
  screenStatus: '画面修理対応区分',
  batteryStatus: 'バッテリー対応区分',
  chargePortStatus: '充電口対応区分',
  cameraLensStatus: 'カメラレンズ対応区分',
  sleepButtonStatus: 'スリープボタン対応区分',
  volumeButtonStatus: '音量ボタン対応区分',
  note: '備考',
  receptionStatus: '受付状態',
};

function handleMvp2PostAction_(action, payload) {
  if (action === 'updatePriceMasterItem') {
    return updatePriceMasterItem_(payload);
  }
  if (action === 'addPriceMasterItem') {
    return addPriceMasterItem_(payload);
  }
  if (action === 'updateSortOrder') {
    return updateSortOrder_(payload);
  }
  return null;
}

function updatePriceMasterItem_(payload) {
  const rowNumber = Number(payload.rowNumber);
  if (!rowNumber || rowNumber < 2) {
    throw new Error('rowNumber is required');
  }

  const sheet = SpreadsheetApp.getActive().getSheetByName(PRICE_MASTER_SHEET_NAME);
  const columnMap = getHeaderColumnMap_(sheet);
  writePriceMasterRow_(sheet, columnMap, rowNumber, payload.item);

  return { success: true };
}

function addPriceMasterItem_(payload) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(PRICE_MASTER_SHEET_NAME);
  const columnMap = getHeaderColumnMap_(sheet);
  const item = payload.item;
  const insertRow = findFirstManufacturerRow_(sheet, columnMap, item.manufacturer) || 2;

  sheet.insertRowBefore(insertRow);
  writePriceMasterRow_(sheet, columnMap, insertRow, item);
  renumberSortOrderForManufacturer_(sheet, columnMap, item.manufacturer);

  return { success: true };
}

function updateSortOrder_(payload) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(PRICE_MASTER_SHEET_NAME);
  const columnMap = getHeaderColumnMap_(sheet);
  const sortColumn = columnMap[PRICE_MASTER_COLUMNS.sortOrder];

  payload.items.forEach(function (item) {
    sheet.getRange(Number(item.rowNumber), sortColumn).setValue(Number(item.sortOrder));
  });

  return { success: true };
}

function writePriceMasterRow_(sheet, columnMap, rowNumber, item) {
  Object.keys(PRICE_MASTER_COLUMNS).forEach(function (key) {
    const headerName = PRICE_MASTER_COLUMNS[key];
    const column = columnMap[headerName];
    if (!column) return;
    sheet.getRange(rowNumber, column).setValue(item[key] == null ? '' : item[key]);
  });
}

function getHeaderColumnMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  return headers.reduce(function (map, header, index) {
    map[String(header).trim()] = index + 1;
    return map;
  }, {});
}

function findFirstManufacturerRow_(sheet, columnMap, manufacturer) {
  const manufacturerColumn = columnMap[PRICE_MASTER_COLUMNS.manufacturer];
  const lastRow = sheet.getLastRow();
  if (!manufacturerColumn || lastRow < 2) return null;

  const values = sheet.getRange(2, manufacturerColumn, lastRow - 1, 1).getValues();
  for (var index = 0; index < values.length; index += 1) {
    if (String(values[index][0]).trim() === manufacturer) {
      return index + 2;
    }
  }
  return null;
}

function renumberSortOrderForManufacturer_(sheet, columnMap, manufacturer) {
  const sortColumn = columnMap[PRICE_MASTER_COLUMNS.sortOrder];
  const manufacturerColumn = columnMap[PRICE_MASTER_COLUMNS.manufacturer];
  const lastRow = sheet.getLastRow();
  if (!sortColumn || !manufacturerColumn || lastRow < 2) return;

  const values = sheet.getRange(2, manufacturerColumn, lastRow - 1, 1).getValues();
  var order = 1;
  values.forEach(function (row, index) {
    if (String(row[0]).trim() === manufacturer) {
      sheet.getRange(index + 2, sortColumn).setValue(order);
      order += 1;
    }
  });
}
