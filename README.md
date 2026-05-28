# Repair Quote

Androidスマホ修理の見積もり作成、お客様向け案内文コピー、問い合わせ履歴保存を行う社内用Webアプリです。

## セットアップ

```bash
npm install
cp .env.example .env
```

`.env`を作成し、次の値を設定してください。

```bash
VITE_APPS_SCRIPT_API_URL=https://script.google.com/macros/s/your-deployment-id/exec
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

## Google Apps Script API

初期データ取得:

```text
GET ?action=getInitialData
```

返却形式:

```json
{
  "success": true,
  "data": {
    "priceMaster": [],
    "optionMaster": [
      {
        "rowNumber": 2,
        "optionName": "ガラスコーティング",
        "price": 3300,
        "receptionStatus": "受付中",
        "note": ""
      }
    ],
    "staffList": []
  }
}
```

`optionMaster`が未返却の場合、フロント側では空配列として扱います。`receptionStatus`が`受付中`のオプションだけ見積もり画面に表示されます。

問い合わせ履歴保存:

```json
{
  "action": "saveInquiry",
  "payload": {
    "storeName": "盛岡店",
    "modelName": "Galaxy S23",
    "repairType": "画面修理",
    "status": "受注"
  }
}
```

MVP 2 管理者編集で追加利用するPOST:

```json
{
  "action": "updatePriceMasterItem",
  "payload": {
    "rowNumber": 2,
    "item": {
      "sortOrder": "",
      "manufacturer": "Galaxy",
      "modelName": "Galaxy S23",
      "modelNumber": "SC-51D / SCG19 / SM-S911系",
      "screenPrice": 38500,
      "screenStatus": "店舗対応可",
      "batteryStatus": "店舗対応可",
      "chargePortStatus": "外注必要",
      "cameraLensStatus": "店舗対応可",
      "sleepButtonStatus": "店舗対応可",
      "volumeButtonStatus": "店舗対応可",
      "note": "国内版・海外版のパーツ違いに注意",
      "receptionStatus": "受付中"
    }
  }
}
```

```json
{
  "action": "addPriceMasterItem",
  "payload": {
    "item": {
      "manufacturer": "Galaxy",
      "modelName": "Galaxy S24",
      "modelNumber": "SC-51E / SCG25 / SM-S921系",
      "screenPrice": 49800,
      "screenStatus": "店舗対応可",
      "batteryStatus": "店舗対応可",
      "chargePortStatus": "店舗対応可",
      "cameraLensStatus": "店舗対応可",
      "sleepButtonStatus": "店舗対応可",
      "volumeButtonStatus": "店舗対応可",
      "note": "",
      "receptionStatus": "受付中"
    }
  }
}
```

```json
{
  "action": "updateSortOrder",
  "payload": {
    "manufacturer": "Galaxy",
    "items": [
      { "rowNumber": 5, "sortOrder": 1 },
      { "rowNumber": 2, "sortOrder": 2 }
    ]
  }
}
```

`getInitialData`の`priceMaster`各行には、管理者編集用に`rowNumber`（シート行番号）と任意で`sortOrder`（並び順）を含めてください。スタッフ管理シートの各行には、`role`または`権限`として`admin`を返すと管理者編集ボタンが表示されます。Apps Script側の実装メモは`docs/apps-script-mvp2.js`にあります。

## 起動方法

```bash
npm run dev
```

ビルド確認:

```bash
npm run build
```
