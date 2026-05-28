import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type RepairType =
  | '画面修理'
  | 'バッテリー交換'
  | '充電口修理'
  | 'カメラレンズ交換'
  | 'スリープボタン修理'
  | '音量ボタン修理'

type SupportType = '店舗対応可' | '外注必要' | '非対応'
type ReceptionStatus = '受付中' | '受付停止中'
type SaveStatus = '受注' | '検討' | 'その他'
type QuoteKind = 'normal' | 'outsourced' | 'unsupported' | 'suspended' | 'confirm'
type ViewMode = 'quote' | 'admin'
type AdminTab = 'edit' | 'add' | 'sort'
type ReportType = '価格マスター修正依頼' | 'アプリ不具合' | '機能・機種追加要望'

type RawRecord = Record<string, unknown>

type Staff = {
  email: string
  storeName: string
  name: string
  role: 'admin' | 'staff'
}

type PriceItem = {
  rowNumber: number | null
  sortOrder: number | null
  maker: string
  modelName: string
  modelNumber: string
  screenPrice: number | null
  screenStatus: SupportType
  batteryStatus: SupportType
  chargePortStatus: SupportType
  cameraLensStatus: SupportType
  sleepButtonStatus: SupportType
  volumeButtonStatus: SupportType
  supportType: SupportType
  receptionStatus: ReceptionStatus
  note: string
  raw: RawRecord
}

type OptionMasterItem = {
  rowNumber: number | null
  optionName: string
  price: number
  receptionStatus: ReceptionStatus
  note: string
}

type EditablePriceItem = {
  sortOrder: string
  manufacturer: string
  modelName: string
  modelNumber: string
  screenPrice: string
  screenStatus: SupportType
  batteryStatus: SupportType
  chargePortStatus: SupportType
  cameraLensStatus: SupportType
  sleepButtonStatus: SupportType
  volumeButtonStatus: SupportType
  note: string
  receptionStatus: ReceptionStatus
}

type ChangeItem = {
  key: keyof EditablePriceItem
  label: string
  before: string
  after: string
}

type AdminReportForm = {
  reportType: ReportType
  reporterName: string
  modelName: string
  repairType: string
  reportContent: string
}

type InitialData = {
  priceMaster: PriceItem[]
  optionMaster: OptionMasterItem[]
  staffList: Staff[]
}

type UserProfile = {
  email: string
  name: string
}

type QuoteResult = {
  kind: QuoteKind
  item: PriceItem
  repairType: RepairType
  amount: number | null
  baseAmount: number | null
  optionTotal: number
  totalAmount: number | null
  amountLabel: string
  leadTime: string
  workTime: string
  options: OptionMasterItem[]
  breakdown: { label: string; amount: number }[]
  customerMessage: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string
            callback: (response: { credential?: string }) => void
          }) => void
          renderButton: (
            parent: HTMLElement,
            options: {
              theme: string
              size: string
              text: string
              shape: string
              width?: number
            },
          ) => void
          disableAutoSelect: () => void
        }
      }
    }
  }
}

const API_URL = import.meta.env.VITE_APPS_SCRIPT_API_URL as string | undefined
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

const makers = ['Google Pixel', 'Xperia', 'Galaxy', 'AQUOS', 'OPPO', 'Xiaomi', 'HUAWEI']
const supportTypes: SupportType[] = ['店舗対応可', '外注必要', '非対応']
const receptionStatuses: ReceptionStatus[] = ['受付中', '受付停止中']
const reportTypes: ReportType[] = ['価格マスター修正依頼', 'アプリ不具合', '機能・機種追加要望']

const editableFields: { key: keyof EditablePriceItem; label: string }[] = [
  { key: 'manufacturer', label: 'メーカー' },
  { key: 'modelName', label: '機種名' },
  { key: 'modelNumber', label: '型番' },
  { key: 'screenPrice', label: '画面修理価格' },
  { key: 'screenStatus', label: '画面修理対応区分' },
  { key: 'batteryStatus', label: 'バッテリー対応区分' },
  { key: 'chargePortStatus', label: '充電口対応区分' },
  { key: 'cameraLensStatus', label: 'カメラレンズ対応区分' },
  { key: 'sleepButtonStatus', label: 'スリープボタン対応区分' },
  { key: 'volumeButtonStatus', label: '音量ボタン対応区分' },
  { key: 'note', label: '備考' },
  { key: 'receptionStatus', label: '受付状態' },
]

const repairTypes: RepairType[] = [
  '画面修理',
  'バッテリー交換',
  '充電口修理',
  'カメラレンズ交換',
  'スリープボタン修理',
  '音量ボタン修理',
]

const fixedPrices: Partial<Record<RepairType, number>> = {
  バッテリー交換: 11000,
  充電口修理: 13200,
  カメラレンズ交換: 11000,
  スリープボタン修理: 15000,
  音量ボタン修理: 15000,
}

const workTimes: Record<RepairType, string> = {
  画面修理: '60分〜120分',
  バッテリー交換: '60分〜90分',
  充電口修理: '60分〜90分',
  カメラレンズ交換: '30分〜60分',
  スリープボタン修理: '60分〜120分',
  音量ボタン修理: '60分〜120分',
}

const leadTimes: Record<RepairType, string> = {
  画面修理: '2日〜3日',
  バッテリー交換: '2日〜3日',
  充電口修理: '3日〜7日',
  カメラレンズ交換: '3日〜7日',
  スリープボタン修理: '3日〜7日',
  音量ボタン修理: '3日〜7日',
}

function textValue(record: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = record[key]
    if (value !== undefined && value !== null) {
      return String(value).trim()
    }
  }
  return ''
}

function normalizeInput(value: string) {
  return value.normalize('NFKC').trim()
}

function normalizeComparable(value: string) {
  return normalizeInput(value).toLowerCase()
}

function parsePrice(value: string) {
  const normalized = normalizeInput(value).replace(/[^\d]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

function numberValue(record: RawRecord, keys: string[]) {
  return parsePrice(textValue(record, keys))
}

function rawNumberValue(record: RawRecord, keys: string[]) {
  const parsed = parsePrice(textValue(record, keys))
  return parsed === null ? null : parsed
}

function normalizeSupportType(value: string): SupportType {
  if (value.includes('外注')) return '外注必要'
  if (value.includes('非対応')) return '非対応'
  return '店舗対応可'
}

function repairStatus(item: PriceItem, repairType: RepairType): SupportType {
  const statusMap: Record<RepairType, SupportType> = {
    画面修理: item.screenStatus,
    バッテリー交換: item.batteryStatus,
    充電口修理: item.chargePortStatus,
    カメラレンズ交換: item.cameraLensStatus,
    スリープボタン修理: item.sleepButtonStatus,
    音量ボタン修理: item.volumeButtonStatus,
  }
  return statusMap[repairType]
}

function normalizeReceptionStatus(value: string): ReceptionStatus {
  return value.includes('停止') ? '受付停止中' : '受付中'
}

function normalizePriceItem(record: RawRecord): PriceItem {
  const supportType = normalizeSupportType(
    textValue(record, ['supportType', 'supportStatus', '対応区分', '対応']),
  )

  return {
    rowNumber: rawNumberValue(record, ['rowNumber', '_rowNumber', 'row', 'rowIndex', '行番号']),
    sortOrder: rawNumberValue(record, ['sortOrder', '並び順', '表示順']),
    maker: textValue(record, ['maker', 'manufacturer', 'brand', 'メーカー', '対応メーカー']),
    modelName: textValue(record, ['modelName', 'model', '機種名', '機種']),
    modelNumber: textValue(record, ['modelNumber', 'modelNo', '型番', '型式']),
    screenPrice: numberValue(record, ['screenPrice', '画面修理価格', '画面価格', '画面修理']),
    screenStatus: normalizeSupportType(textValue(record, ['screenStatus', '画面修理対応区分', '画面対応区分', '画面修理ステータス']) || supportType),
    batteryStatus: normalizeSupportType(textValue(record, ['batteryStatus', 'バッテリー交換対応区分', 'バッテリー対応区分', 'バッテリーステータス']) || supportType),
    chargePortStatus: normalizeSupportType(textValue(record, ['chargePortStatus', '充電口修理対応区分', '充電口対応区分', '充電口ステータス']) || supportType),
    cameraLensStatus: normalizeSupportType(textValue(record, ['cameraLensStatus', 'カメラレンズ交換対応区分', 'カメラレンズ対応区分', 'カメラレンズステータス']) || supportType),
    sleepButtonStatus: normalizeSupportType(textValue(record, ['sleepButtonStatus', 'スリープボタン修理対応区分', 'スリープボタン対応区分', 'スリープボタンステータス']) || supportType),
    volumeButtonStatus: normalizeSupportType(textValue(record, ['volumeButtonStatus', '音量ボタン修理対応区分', '音量ボタン対応区分', '音量ボタンステータス']) || supportType),
    supportType,
    receptionStatus: normalizeReceptionStatus(
      textValue(record, ['receptionStatus', '受付状態', '受付']),
    ),
    note: textValue(record, ['note', 'remarks', 'memo', '備考', 'スタッフ向け注意']),
    raw: record,
  }
}

function normalizeOptionItem(record: RawRecord): OptionMasterItem {
  return {
    rowNumber: rawNumberValue(record, ['rowNumber', '_rowNumber', 'row', 'rowIndex', '行番号']),
    optionName: textValue(record, ['optionName', 'name', 'オプション名', 'オプション']),
    price: numberValue(record, ['price', 'optionPrice', '価格', '料金']) ?? 0,
    receptionStatus: normalizeReceptionStatus(textValue(record, ['receptionStatus', '受付状態', '受付'])),
    note: textValue(record, ['note', 'remarks', 'memo', '備考']),
  }
}

function normalizeStaff(record: RawRecord): Staff {
  const role = normalizeComparable(textValue(record, ['role', 'permission', '権限', '管理権限']))
  return {
    email: textValue(record, ['email', 'mail', 'メール', 'メールアドレス', 'Googleアカウント']).toLowerCase(),
    storeName: textValue(record, ['storeName', 'store', '店舗名', '店舗']) || '未設定店舗',
    name: textValue(record, ['name', 'staffName', '氏名', 'スタッフ名']),
    role: role === 'admin' || role === '管理者' ? 'admin' : 'staff',
  }
}

function decodeCredential(credential: string): UserProfile {
  const payload = credential.split('.')[1]
  const decoded = JSON.parse(decodeURIComponent(escape(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))))
  return {
    email: String(decoded.email ?? '').toLowerCase(),
    name: String(decoded.name ?? ''),
  }
}

function formatYen(amount: number) {
  return amount.toLocaleString('ja-JP')
}

function optionKey(item: OptionMasterItem) {
  return `${item.rowNumber ?? ''}|${item.optionName}`
}

function formatPriceInput(value: string) {
  const parsed = parsePrice(value)
  return parsed === null ? '' : formatYen(parsed)
}

function displayPrice(value: string) {
  const parsed = parsePrice(value)
  return parsed === null ? value : `${formatYen(parsed)}円`
}

function modelKey(item: PriceItem) {
  return `${item.rowNumber ?? ''}|${item.maker}|${item.modelName}|${item.modelNumber}`
}

function toEditableItem(item?: PriceItem): EditablePriceItem {
  return {
    sortOrder: item?.sortOrder === null || item?.sortOrder === undefined ? '' : String(item.sortOrder),
    manufacturer: item?.maker ?? makers[0],
    modelName: item?.modelName ?? '',
    modelNumber: item?.modelNumber ?? '',
    screenPrice: item?.screenPrice === null || item?.screenPrice === undefined ? '' : formatYen(item.screenPrice),
    screenStatus: item?.screenStatus ?? '店舗対応可',
    batteryStatus: item?.batteryStatus ?? '店舗対応可',
    chargePortStatus: item?.chargePortStatus ?? '店舗対応可',
    cameraLensStatus: item?.cameraLensStatus ?? '店舗対応可',
    sleepButtonStatus: item?.sleepButtonStatus ?? '店舗対応可',
    volumeButtonStatus: item?.volumeButtonStatus ?? '店舗対応可',
    note: item?.note ?? '',
    receptionStatus: item?.receptionStatus ?? '受付中',
  }
}

function toApiItem(form: EditablePriceItem) {
  return {
    sortOrder: form.sortOrder.trim(),
    manufacturer: form.manufacturer,
    modelName: form.modelName.trim(),
    modelNumber: form.modelNumber.trim(),
    screenPrice: parsePrice(form.screenPrice),
    screenStatus: form.screenStatus,
    batteryStatus: form.batteryStatus,
    chargePortStatus: form.chargePortStatus,
    cameraLensStatus: form.cameraLensStatus,
    sleepButtonStatus: form.sleepButtonStatus,
    volumeButtonStatus: form.volumeButtonStatus,
    note: form.note.trim(),
    receptionStatus: form.receptionStatus,
  }
}

function changedFields(before: EditablePriceItem, after: EditablePriceItem): ChangeItem[] {
  return editableFields
    .filter(({ key }) => {
      if (key === 'screenPrice') return parsePrice(before.screenPrice) !== parsePrice(after.screenPrice)
      return before[key].trim() !== after[key].trim()
    })
    .map(({ key, label }) => ({
      key,
      label,
      before: key === 'screenPrice' ? displayPrice(before[key]) : before[key],
      after: key === 'screenPrice' ? displayPrice(after[key]) : after[key],
    }))
}

function isDuplicateItem(items: PriceItem[], form: EditablePriceItem) {
  const manufacturer = normalizeComparable(form.manufacturer)
  const modelName = normalizeComparable(form.modelName)
  const modelNumber = normalizeComparable(form.modelNumber)
  return items.some((item) => (
    normalizeComparable(item.maker) === manufacturer &&
    normalizeComparable(item.modelName) === modelName &&
    normalizeComparable(item.modelNumber) === modelNumber
  ))
}

function optionSummary(options: OptionMasterItem[]) {
  return options.map((option) => `${option.optionName}${formatYen(option.price)}円`).join('、')
}

function quoteSupportLabel(quote: QuoteResult) {
  if (quote.kind === 'suspended') return '受付停止中'
  if (quote.kind === 'unsupported') return '非対応'
  if (quote.kind === 'confirm') return '要確認'
  if (quote.kind === 'outsourced') return '外注必要'
  return repairStatus(quote.item, quote.repairType)
}

function quoteAmountForCopy(quote: QuoteResult) {
  if (quote.totalAmount !== null) return `${formatYen(quote.totalAmount)}円（税込）`
  return quote.kind === 'confirm' ? '要確認' : '-'
}

function quoteLeadTimeForCopy(quote: QuoteResult) {
  if (quote.kind === 'outsourced') return '1週間〜2週間'
  return quote.leadTime || '-'
}

function buildReservationCopyText(quote: QuoteResult) {
  return [
    quote.item.modelName,
    quote.item.modelNumber || '-',
    quote.repairType,
    quote.options.length > 0 ? quote.options.map((option) => option.optionName).join('、') : 'なし',
    quoteAmountForCopy(quote),
    quote.workTime || '-',
    quoteLeadTimeForCopy(quote),
    quoteSupportLabel(quote),
  ].join('\t')
}

function addMinutesToWorkTime(workTime: string, minutes: number) {
  const matches = [...workTime.matchAll(/(\d+)分/g)].map((match) => Number(match[1]))
  if (matches.length < 2) return workTime
  return `${matches[0] + minutes}分〜${matches[1] + minutes}分`
}

function buildQuote(item: PriceItem, repairType: RepairType, options: OptionMasterItem[]): QuoteResult {
  const optionTotal = options.reduce((total, option) => total + option.price, 0)
  const hasOptions = options.length > 0

  if (item.receptionStatus === '受付停止中') {
    return {
      kind: 'suspended',
      item,
      repairType,
      amount: null,
      baseAmount: null,
      optionTotal: 0,
      totalAmount: null,
      amountLabel: '表示なし',
      leadTime: '',
      workTime: '',
      options: [],
      breakdown: [],
      customerMessage: `${item.modelName}につきましては、現在受付を停止しております。\nご希望に添えず申し訳ございません。`,
    }
  }

  const supportType = repairStatus(item, repairType)

  if (supportType === '外注必要') {
    const baseAmount = 33000
    const totalAmount = baseAmount + optionTotal
    const breakdown = [{ label: '外注修理', amount: baseAmount }, ...options.map((option) => ({ label: option.optionName, amount: option.price }))]
    return {
      kind: 'outsourced',
      item,
      repairType,
      amount: totalAmount,
      baseAmount,
      optionTotal,
      totalAmount,
      amountLabel: `${formatYen(totalAmount)}円（税込）`,
      leadTime: '1週間〜2週間',
      workTime: '',
      options,
      breakdown,
      customerMessage: hasOptions
        ? `${item.modelName}の${repairType}は、店舗内での作業ではなく外注修理での対応となります。\nお見積もり金額は${formatYen(totalAmount)}円（税込）です。\n内訳は、外注修理${formatYen(baseAmount)}円、${optionSummary(options)}です。\nお預かり期間は通常1週間〜2週間ほどとなります。\n\nデータは基本そのままで作業できますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。\n端末の状態によっては、作業内容やお時間が変動する場合がございます。`
        : `${item.modelName}の${repairType}は、店舗内での作業ではなく外注修理での対応となります。\nお見積もり金額は33,000円（税込）です。\nお預かり期間は通常1週間〜2週間ほどとなります。\n\nデータは基本そのままで作業できますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。\n端末の状態によっては、作業内容やお時間が変動する場合がございます。`,
    }
  }

  if (supportType === '非対応') {
    return {
      kind: 'unsupported',
      item,
      repairType,
      amount: null,
      baseAmount: null,
      optionTotal: 0,
      totalAmount: null,
      amountLabel: '表示なし',
      leadTime: '',
      workTime: '',
      options: [],
      breakdown: [],
      customerMessage: `${item.modelName}の${repairType}につきましては、現在対応が難しい修理内容となっております。\nご希望に添えず申し訳ございません。`,
    }
  }

  if (repairType === '画面修理' && item.screenPrice === null) {
    return {
      kind: 'confirm',
      item,
      repairType,
      amount: null,
      baseAmount: null,
      optionTotal,
      totalAmount: null,
      amountLabel: '要確認',
      leadTime: leadTimes[repairType],
      workTime: workTimes[repairType],
      options,
      breakdown: options.map((option) => ({ label: option.optionName, amount: option.price })),
      customerMessage: `${item.modelName}の画面修理につきましては、現在価格確認が必要な機種となっております。\n確認後、改めてお見積もりをご案内いたします。`,
    }
  }

  const baseAmount = repairType === '画面修理' ? item.screenPrice ?? 0 : fixedPrices[repairType] ?? 0
  const totalAmount = baseAmount + optionTotal
  const workTime = options.some((option) => option.optionName === 'バッテリー交換')
    ? addMinutesToWorkTime(workTimes[repairType], 30)
    : workTimes[repairType]
  const breakdown = [{ label: repairType, amount: baseAmount }, ...options.map((option) => ({ label: option.optionName, amount: option.price }))]

  return {
    kind: 'normal',
    item,
    repairType,
    amount: totalAmount,
    baseAmount,
    optionTotal,
    totalAmount,
    amountLabel: `${formatYen(totalAmount)}円（税込）`,
    leadTime: leadTimes[repairType],
    workTime,
    options,
    breakdown,
    customerMessage: hasOptions
      ? `${item.modelName}の${repairType}は、お見積もり金額${formatYen(totalAmount)}円（税込）です。\n内訳は、${repairType}${formatYen(baseAmount)}円、${optionSummary(options)}です。\nパーツの取り寄せは通常${leadTimes[repairType]}ほど、入荷後の作業時間は${workTime}ほどとなります。\nパーツ入荷後に改めてご連絡いたしますので、その後ご来店をお願いいたします。\n\nデータは基本そのままで作業できますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。\n端末の状態によっては、作業内容やお時間が変動する場合がございます。`
      : `${item.modelName}の${repairType}は、お見積もり金額${formatYen(baseAmount)}円（税込）です。\nパーツの取り寄せは通常${leadTimes[repairType]}ほど、入荷後の作業時間は${workTimes[repairType]}ほどとなります。\nパーツ入荷後に改めてご連絡いたしますので、その後ご来店をお願いいたします。\n\nデータは基本そのままで作業できますが、データ保証はできかねるため、可能であれば事前のバックアップをおすすめしております。\n端末の状態によっては、作業内容やお時間が変動する場合がございます。`,
  }
}

function isSuccessResponse(data: unknown): data is { success: true; data: { priceMaster: RawRecord[]; optionMaster?: RawRecord[]; staffList: RawRecord[] } } {
  if (!data || typeof data !== 'object') return false
  const response = data as { success?: unknown; data?: unknown }
  if (response.success !== true || !response.data || typeof response.data !== 'object') return false
  const body = response.data as { priceMaster?: unknown; staffList?: unknown }
  return Array.isArray(body.priceMaster) && Array.isArray(body.staffList)
}

function AdminForm({
  form,
  onChange,
  requiredMode = false,
}: {
  form: EditablePriceItem
  onChange: (key: keyof EditablePriceItem, value: string) => void
  requiredMode?: boolean
}) {
  const inputClass = 'w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100'
  const selectClass = 'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100'

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        メーカー{requiredMode && <span className="text-xs text-red-700">必須</span>}
        <select className={selectClass} value={form.manufacturer} onChange={(event) => onChange('manufacturer', event.target.value)}>
          {makers.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        機種名{requiredMode && <span className="text-xs text-red-700">必須</span>}
        <input className={inputClass} value={form.modelName} onChange={(event) => onChange('modelName', event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        型番{requiredMode && <span className="text-xs text-red-700">必須</span>}
        <input className={inputClass} value={form.modelNumber} onChange={(event) => onChange('modelNumber', event.target.value)} />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        画面修理価格{requiredMode && <span className="text-xs text-red-700">必須</span>}
        <input
          className={inputClass}
          value={form.screenPrice}
          onBlur={() => onChange('screenPrice', formatPriceInput(form.screenPrice))}
          onChange={(event) => onChange('screenPrice', event.target.value)}
          placeholder="38,500"
        />
      </label>
      {[
        ['screenStatus', '画面修理対応区分'],
        ['batteryStatus', 'バッテリー対応区分'],
        ['chargePortStatus', '充電口対応区分'],
        ['cameraLensStatus', 'カメラレンズ対応区分'],
        ['sleepButtonStatus', 'スリープボタン対応区分'],
        ['volumeButtonStatus', '音量ボタン対応区分'],
      ].map(([key, label]) => (
        <label key={key} className="grid gap-1 text-sm font-semibold text-slate-700">
          {label}
          <select className={selectClass} value={form[key as keyof EditablePriceItem]} onChange={(event) => onChange(key as keyof EditablePriceItem, event.target.value)}>
            {supportTypes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      ))}
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        受付状態
        <select className={selectClass} value={form.receptionStatus} onChange={(event) => onChange('receptionStatus', event.target.value)}>
          {receptionStatuses.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700 sm:col-span-2">
        備考
        <textarea className={`${inputClass} min-h-24 resize-y`} value={form.note} onChange={(event) => onChange('note', event.target.value)} />
      </label>
    </div>
  )
}

function App() {
  const googleButtonRef = useRef<HTMLDivElement>(null)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [data, setData] = useState<InitialData | null>(null)
  const [staff, setStaff] = useState<Staff | null>(null)
  const [authError, setAuthError] = useState('')
  const [dataError, setDataError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [maker, setMaker] = useState('')
  const [query, setQuery] = useState('')
  const [selectedModelKey, setSelectedModelKey] = useState('')
  const [repairType, setRepairType] = useState<RepairType | ''>('')
  const [selectedOptionKeys, setSelectedOptionKeys] = useState<string[]>([])
  const [quote, setQuote] = useState<QuoteResult | null>(null)
  const [quoteSignature, setQuoteSignature] = useState('')
  const [isStaffNoteOpen, setIsStaffNoteOpen] = useState(true)
  const [isCustomerMessageOpen, setIsCustomerMessageOpen] = useState(true)
  const [confirmStatus, setConfirmStatus] = useState<SaveStatus | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveFailure, setSaveFailure] = useState<SaveStatus | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [reportForm, setReportForm] = useState<AdminReportForm>({
    reportType: '価格マスター修正依頼',
    reporterName: '',
    modelName: '',
    repairType: '',
    reportContent: '',
  })
  const [reportErrors, setReportErrors] = useState<Partial<Record<keyof AdminReportForm, string>>>({})
  const [reportFailure, setReportFailure] = useState(false)
  const [toast, setToast] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('quote')
  const [adminTab, setAdminTab] = useState<AdminTab>('edit')
  const [adminSearch, setAdminSearch] = useState('')
  const [adminSelectedKey, setAdminSelectedKey] = useState('')
  const [editForm, setEditForm] = useState<EditablePriceItem | null>(null)
  const [editOriginal, setEditOriginal] = useState<EditablePriceItem | null>(null)
  const [addForm, setAddForm] = useState<EditablePriceItem>(() => toEditableItem())
  const [adminMessage, setAdminMessage] = useState('')
  const [adminConfirm, setAdminConfirm] = useState<{ mode: 'edit' | 'add'; changes: ChangeItem[] } | null>(null)
  const [adminFailure, setAdminFailure] = useState(false)
  const [isRefreshingMaster, setIsRefreshingMaster] = useState(false)
  const [sortMaker, setSortMaker] = useState(makers[0])
  const [sortFilter, setSortFilter] = useState<ReceptionStatus | 'すべて'>('受付中')
  const retryAdminSaveRef = useRef<(() => Promise<void>) | null>(null)
  const retryReportRef = useRef<(() => Promise<void>) | null>(null)

  const optionSignature = selectedOptionKeys.slice().sort().join(',')
  const currentSignature = `${maker}|${selectedModelKey}|${repairType}|${optionSignature}`
  const isChangedAfterQuote = Boolean(quote && quoteSignature !== currentSignature)
  const isAdmin = staff?.role === 'admin'

  const filteredModels = useMemo(() => {
    if (!data || !maker) return []
    const needle = query.trim().toLowerCase()
    return data.priceMaster
      .filter((item) => item.maker === maker)
      .filter((item) => {
        if (!needle) return true
        return `${item.modelName} ${item.modelNumber}`.toLowerCase().includes(needle)
      })
  }, [data, maker, query])

  const selectedItem = useMemo(() => {
    return data?.priceMaster.find((item) => modelKey(item) === selectedModelKey) ?? null
  }, [data, selectedModelKey])

  const canCreateQuote = Boolean(selectedItem && repairType)

  const selectedSupportType = selectedItem && repairType ? repairStatus(selectedItem, repairType) : null
  const canShowOptions = Boolean(
    selectedItem &&
    repairType &&
    selectedItem.receptionStatus !== '受付停止中' &&
    selectedSupportType !== '非対応',
  )

  const visibleOptions = useMemo(() => {
    if (!data || !canShowOptions) return []
    return data.optionMaster.filter((option) => (
      option.receptionStatus === '受付中' &&
      !(repairType === 'バッテリー交換' && option.optionName === 'バッテリー交換')
    ))
  }, [canShowOptions, data, repairType])

  const selectedOptions = useMemo(() => {
    const selectedKeys = new Set(selectedOptionKeys)
    return visibleOptions.filter((option) => selectedKeys.has(optionKey(option)))
  }, [selectedOptionKeys, visibleOptions])

  const adminSearchResults = useMemo(() => {
    if (!data) return []
    const needle = normalizeComparable(adminSearch)
    return data.priceMaster.filter((item) => {
      if (!needle) return true
      return normalizeComparable(`${item.maker} ${item.modelName} ${item.modelNumber}`).includes(needle)
    })
  }, [adminSearch, data])

  const adminSelectedItem = useMemo(() => {
    return data?.priceMaster.find((item) => modelKey(item) === adminSelectedKey) ?? null
  }, [adminSelectedKey, data])

  const sortableItems = useMemo(() => {
    if (!data) return []
    return data.priceMaster
      .filter((item) => item.maker === sortMaker)
      .filter((item) => sortFilter === 'すべて' || item.receptionStatus === sortFilter)
      .slice()
      .sort((a, b) => (a.sortOrder ?? 999999) - (b.sortOrder ?? 999999))
  }, [data, sortFilter, sortMaker])

  const loadInitialData = useCallback(async (profile: UserProfile) => {
    if (!API_URL) {
      setDataError('データの取得に失敗しました。時間をおいて再度お試しください。')
      return null
    }

    setIsLoading(true)
    setDataError('')
    setAuthError('')

    try {
      const response = await fetch(`${API_URL}?action=getInitialData`)
      const body: unknown = await response.json()
      if (!response.ok || !isSuccessResponse(body)) {
        throw new Error('Invalid initial data response')
      }

      const initialData = {
        priceMaster: body.data.priceMaster.map(normalizePriceItem).filter((item) => item.maker && item.modelName),
        optionMaster: (body.data.optionMaster ?? []).map(normalizeOptionItem).filter((item) => item.optionName),
        staffList: body.data.staffList.map(normalizeStaff).filter((item) => item.email),
      }
      const matchedStaff = initialData.staffList.find((item) => item.email === profile.email) ?? null

      setData(initialData)
      setStaff(matchedStaff)
      if (!matchedStaff) {
        setAuthError('このGoogleアカウントは登録されていません。アプリを利用する場合は、管理者に連絡してください。')
      }
      return initialData
    } catch {
      setData(null)
      setStaff(null)
      setDataError('データの取得に失敗しました。時間をおいて再度お試しください。')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !googleButtonRef.current || user) return

    const renderButton = () => {
      if (!window.google || !googleButtonRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response.credential) return
          try {
            const profile = decodeCredential(response.credential)
            setUser(profile)
            void loadInitialData(profile)
          } catch {
            setAuthError('Googleログインに失敗しました。時間をおいて再度お試しください。')
          }
        },
      })
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: 260,
      })
    }

    if (window.google) {
      renderButton()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = renderButton
    script.onerror = () => setAuthError('Googleログインに失敗しました。時間をおいて再度お試しください。')
    document.head.appendChild(script)
  }, [loadInitialData, user])

  function showToast(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2000)
  }

  async function postApi(action: string, payload: unknown) {
    if (!API_URL) throw new Error('API URL is not configured')
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, payload }),
    })
    const body = await response.json().catch(() => ({ success: response.ok }))
    if (!response.ok || body.success === false) throw new Error('API request failed')
  }

  async function refreshPriceMaster() {
    if (!user) return null
    setIsRefreshingMaster(true)
    const nextData = await loadInitialData(user)
    setIsRefreshingMaster(false)
    return nextData
  }

  function handleLogout() {
    window.google?.accounts.id.disableAutoSelect()
    setUser(null)
    setData(null)
    setStaff(null)
    setAuthError('')
    setViewMode('quote')
    setAdminSelectedKey('')
    setEditForm(null)
    setEditOriginal(null)
    setIsReportOpen(false)
    setReportFailure(false)
    resetInputs()
  }

  function resetInputs() {
    setMaker('')
    setQuery('')
    setSelectedModelKey('')
    setRepairType('')
    setSelectedOptionKeys([])
    setQuote(null)
    setQuoteSignature('')
  }

  function handleMakerChange(nextMaker: string) {
    setMaker(nextMaker)
    setQuery('')
    setSelectedModelKey('')
    setSelectedOptionKeys([])
  }

  function handleRepairTypeChange(nextRepairType: RepairType) {
    setRepairType(nextRepairType)
    if (nextRepairType === 'バッテリー交換') {
      setSelectedOptionKeys((current) => current.filter((key) => {
        const option = data?.optionMaster.find((item) => optionKey(item) === key)
        return option?.optionName !== 'バッテリー交換'
      }))
    }
  }

  function toggleOption(option: OptionMasterItem) {
    const key = optionKey(option)
    setSelectedOptionKeys((current) => (
      current.includes(key)
        ? current.filter((item) => item !== key)
        : [...current, key]
    ))
  }

  function createQuote() {
    if (!selectedItem || !repairType) return
    setQuote(buildQuote(selectedItem, repairType, selectedOptions))
    setQuoteSignature(currentSignature)
  }

  function selectAdminItem(item: PriceItem) {
    const form = toEditableItem(item)
    setAdminSelectedKey(modelKey(item))
    setEditForm(form)
    setEditOriginal(form)
  }

  function updateEditField(key: keyof EditablePriceItem, value: string) {
    setEditForm((current) => (current ? { ...current, [key]: value } : current))
  }

  function updateAddField(key: keyof EditablePriceItem, value: string) {
    setAddForm((current) => ({ ...current, [key]: value }))
  }

  function prepareEditSave() {
    if (!editForm || !editOriginal) return
    const changes = changedFields(editOriginal, editForm)
    if (changes.length === 0) {
      setAdminMessage('変更された項目がありません')
      return
    }
    setAdminMessage('')
    setAdminConfirm({ mode: 'edit', changes })
  }

  function prepareAddSave() {
    if (!data) return
    if (!addForm.manufacturer.trim() || !addForm.modelName.trim() || !addForm.modelNumber.trim()) {
      setAdminMessage('メーカー・機種名・型番を入力してください。')
      return
    }
    if (parsePrice(addForm.screenPrice) === null) {
      setAdminMessage('画面修理価格を入力してください。')
      return
    }
    if (isDuplicateItem(data.priceMaster, addForm)) {
      setAdminMessage('同じメーカー・機種名・型番のデータがすでに登録されています。\n既存データを確認してください。')
      return
    }
    const changes = editableFields.map(({ key, label }) => ({
      key,
      label,
      before: '',
      after: key === 'screenPrice' ? displayPrice(addForm[key]) : addForm[key],
    }))
    setAdminMessage('')
    setAdminConfirm({ mode: 'add', changes })
  }

  async function runAdminSave(mode: 'edit' | 'add') {
    const execute = async () => {
      setIsSaving(true)
      setAdminFailure(false)
      try {
        if (mode === 'edit') {
          if (!editForm || !adminSelectedItem?.rowNumber) throw new Error('Missing selected item')
          await postApi('updatePriceMasterItem', {
            rowNumber: adminSelectedItem.rowNumber,
            item: toApiItem(editForm),
          })
        } else {
          await postApi('addPriceMasterItem', {
            item: toApiItem(addForm),
          })
        }
        setAdminConfirm(null)
        setIsSaving(false)
        const nextData = await refreshPriceMaster()
        if (mode === 'add') {
          const addedSignature = `${normalizeComparable(addForm.manufacturer)}|${normalizeComparable(addForm.modelName)}|${normalizeComparable(addForm.modelNumber)}`
          const added = nextData?.priceMaster.find((item) => `${normalizeComparable(item.maker)}|${normalizeComparable(item.modelName)}|${normalizeComparable(item.modelNumber)}` === addedSignature)
          if (added) selectAdminItem(added)
          setAdminTab('edit')
          setAddForm(toEditableItem())
        } else if (editForm) {
          setEditOriginal(editForm)
        }
        showToast('変更内容を保存し、価格マスターを更新しました')
      } catch {
        setAdminConfirm(null)
        setAdminFailure(true)
        setIsSaving(false)
      }
    }
    retryAdminSaveRef.current = execute
    await execute()
  }

  async function copyMessage() {
    if (!quote) return
    await navigator.clipboard.writeText(quote.customerMessage)
    showToast('案内文をコピーしました')
  }

  async function copyReservationSummary() {
    if (!quote) return
    await navigator.clipboard.writeText(buildReservationCopyText(quote))
    showToast('予約管理用の内容をコピーしました')
  }

  function openReportModal() {
    setReportForm({
      reportType: '価格マスター修正依頼',
      reporterName: staff?.name || user?.name || '',
      modelName: selectedItem?.modelName ?? '',
      repairType: repairType || '',
      reportContent: '',
    })
    setReportErrors({})
    setReportFailure(false)
    setIsReportOpen(true)
  }

  function updateReportField<K extends keyof AdminReportForm>(key: K, value: AdminReportForm[K]) {
    setReportForm((current) => ({ ...current, [key]: value }))
    setReportErrors((current) => ({ ...current, [key]: undefined }))
  }

  function validateReportForm() {
    const errors: Partial<Record<keyof AdminReportForm, string>> = {}
    if (!reportForm.reporterName.trim()) errors.reporterName = '報告者名を入力してください。'
    if (!reportForm.reportContent.trim()) errors.reportContent = '報告内容を入力してください。'
    setReportErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function submitAdminReport() {
    if (!staff || !validateReportForm()) return
    const payload = {
      storeName: staff.storeName,
      reporterName: reportForm.reporterName.trim(),
      reportType: reportForm.reportType,
      modelName: reportForm.modelName.trim(),
      repairType: reportForm.repairType.trim(),
      reportContent: reportForm.reportContent.trim(),
    }
    const execute = async () => {
      setIsSaving(true)
      setReportFailure(false)
      try {
        await postApi('saveAdminReport', payload)
        setIsReportOpen(false)
        showToast('管理者へ報告しました')
      } catch {
        setReportFailure(true)
      } finally {
        setIsSaving(false)
      }
    }
    retryReportRef.current = execute
    await execute()
  }

  async function saveInquiry(status: SaveStatus) {
    if (!quote || !staff || !API_URL) return
    setIsSaving(true)
    setSaveFailure(null)
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveInquiry',
          payload: {
            storeName: staff.storeName,
            modelName: quote.item.modelName,
            repairType: quote.repairType,
            status,
          },
        }),
      })
      const body = await response.json().catch(() => ({ success: response.ok }))
      if (!response.ok || body.success === false) throw new Error('Save failed')
      setConfirmStatus(null)
      showToast(`${staff.storeName}の問い合わせ履歴に保存しました`)
    } catch {
      setConfirmStatus(null)
      setSaveFailure(status)
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Repair Quote</h1>
          <p className="mt-4 text-sm text-slate-600">このアプリを利用するにはログインが必要です</p>
          <div className="mt-7 flex justify-center" ref={googleButtonRef} />
          {!GOOGLE_CLIENT_ID && (
            <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              VITE_GOOGLE_CLIENT_IDが設定されていません。
            </p>
          )}
          {authError && <p className="mt-5 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{authError}</p>}
        </section>
      </main>
    )
  }

  if (authError && !staff) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5">
        <section className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-950">利用できません</h1>
          <p className="mt-4 text-sm leading-6 text-slate-700">{authError}</p>
          <button className="mt-7 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white" onClick={handleLogout}>
            ログアウト
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {(isLoading || isSaving || isRefreshingMaster) && (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/35">
          <div className="rounded-lg bg-white px-6 py-4 text-sm font-semibold shadow-lg">
            {isRefreshingMaster ? '変更内容を反映しています' : isLoading ? 'データを読み込んでいます' : '保存しています'}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-slate-950 px-6 py-4 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Repair Quote</p>
            <h1 className="text-xl font-semibold text-slate-950">Android修理見積もり</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span>{staff?.storeName}</span>
            <span>{user.email}</span>
            {isAdmin && viewMode === 'quote' && (
              <button className="rounded-md bg-slate-950 px-3 py-2 font-semibold text-white hover:bg-slate-800" onClick={() => setViewMode('admin')}>
                管理者編集
              </button>
            )}
            <button className="rounded-md border border-sky-700 bg-white px-3 py-2 font-semibold text-sky-800 hover:bg-sky-50" onClick={openReportModal}>
              管理者へ報告
            </button>
            <button className="rounded-md border border-slate-300 bg-white px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50" onClick={handleLogout}>
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {viewMode === 'admin' ? (
        <div className="mx-auto max-w-7xl px-5 py-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Admin</p>
                <h2 className="text-xl font-semibold text-slate-950">管理者編集</h2>
              </div>
              <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setViewMode('quote')}>
                見積もり画面へ戻る
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {[
                { key: 'edit', label: '価格マスター編集' },
                { key: 'add', label: '新規機種追加' },
                { key: 'sort', label: '並び順変更' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  className={`rounded-md px-4 py-2 text-sm font-semibold ${
                    adminTab === tab.key ? 'bg-slate-950 text-white' : 'border border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => {
                    setAdminTab(tab.key as AdminTab)
                    setAdminMessage('')
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {adminMessage && (
              <div className="mt-4 whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
                {adminMessage}
              </div>
            )}

            {adminTab === 'edit' && (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-base font-semibold">検索</h3>
                  <input
                    className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                    placeholder="メーカー・機種名・型番で検索"
                    value={adminSearch}
                    onChange={(event) => setAdminSearch(event.target.value)}
                  />
                  <div className="mt-4 max-h-[520px] overflow-auto rounded-lg border border-slate-200">
                    <table className="w-full min-w-[680px] border-collapse text-left text-sm">
                      <thead className="sticky top-0 bg-slate-50 text-xs font-semibold text-slate-500">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-2">メーカー</th>
                          <th className="border-b border-slate-200 px-3 py-2">機種名</th>
                          <th className="border-b border-slate-200 px-3 py-2">型番</th>
                          <th className="border-b border-slate-200 px-3 py-2">画面修理価格</th>
                          <th className="border-b border-slate-200 px-3 py-2">受付状態</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminSearchResults.map((item) => (
                          <tr
                            key={modelKey(item)}
                            className={`cursor-pointer hover:bg-sky-50 ${adminSelectedKey === modelKey(item) ? 'bg-sky-100' : ''}`}
                            onClick={() => selectAdminItem(item)}
                          >
                            <td className="border-b border-slate-100 px-3 py-2">{item.maker}</td>
                            <td className="border-b border-slate-100 px-3 py-2 font-semibold text-slate-950">{item.modelName}</td>
                            <td className="border-b border-slate-100 px-3 py-2">{item.modelNumber}</td>
                            <td className="border-b border-slate-100 px-3 py-2">{item.screenPrice === null ? '—' : `${formatYen(item.screenPrice)}円`}</td>
                            <td className="border-b border-slate-100 px-3 py-2">{item.receptionStatus}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-base font-semibold">編集フォーム</h3>
                  {!editForm ? (
                    <p className="mt-4 rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-600">対象機種を選択してください</p>
                  ) : (
                    <div className="mt-4 grid gap-4">
                      <AdminForm form={editForm} onChange={updateEditField} />
                      <button className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={prepareEditSave}>
                        保存
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {adminTab === 'add' && (
              <div className="mt-5 max-w-3xl rounded-lg border border-slate-200 p-4">
                <h3 className="text-base font-semibold">新規機種追加</h3>
                <div className="mt-4 grid gap-4">
                  <AdminForm form={addForm} onChange={updateAddField} requiredMode />
                  <button className="rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white" onClick={prepareAddSave}>
                    追加内容を確認
                  </button>
                </div>
              </div>
            )}

            {adminTab === 'sort' && (
              <div className="mt-5 rounded-lg border border-slate-200 p-4">
                <div className="flex flex-wrap gap-3">
                  <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={sortMaker} onChange={(event) => setSortMaker(event.target.value)}>
                    {makers.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                  <select className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" value={sortFilter} onChange={(event) => setSortFilter(event.target.value as ReceptionStatus | 'すべて')}>
                    <option value="受付中">受付中</option>
                    <option value="受付停止中">受付停止中</option>
                    <option value="すべて">すべて</option>
                  </select>
                </div>
                <p className="mt-4 rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-600">ドラッグ＆ドロップでの並び替えは次フェーズで実装予定です。</p>
                <div className="mt-4 grid gap-2">
                  {sortableItems.map((item, index) => (
                    <div key={modelKey(item)} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 px-3 py-2 text-sm">
                      <span className="font-semibold text-slate-500">{index + 1}</span>
                      <span className="min-w-0 flex-1 font-semibold text-slate-950">{item.modelName} / {item.modelNumber || '-'}</span>
                      <span className="text-slate-500">{item.receptionStatus}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : (
      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">見積もり条件</h2>
              <p className="mt-1 text-sm text-slate-500">メーカー、機種、修理内容を選択してください。</p>
            </div>
            <button className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={resetInputs}>
              リセット
            </button>
          </div>

          {dataError && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <p>{dataError}</p>
              <button className="mt-3 rounded-md bg-red-700 px-3 py-2 font-semibold text-white" onClick={() => loadInitialData(user)}>
                再読み込み
              </button>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">メーカー</h3>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {makers.map((item) => (
                <button
                  key={item}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    maker === item
                      ? 'border-sky-700 bg-sky-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleMakerChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">機種</h3>
            {!maker ? (
              <p className="mt-3 rounded-md bg-slate-100 px-3 py-3 text-sm text-slate-600">先にメーカーを選択してください</p>
            ) : (
              <div className="mt-3 grid gap-3">
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  placeholder="機種名または型番で検索"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  value={selectedModelKey}
                  onChange={(event) => setSelectedModelKey(event.target.value)}
                >
                  <option value="">機種を選択してください</option>
                  {filteredModels.map((item) => (
                    <option key={modelKey(item)} value={modelKey(item)}>
                      {item.modelName}
                      {item.modelNumber ? ` / ${item.modelNumber}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-slate-700">修理内容</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {repairTypes.map((item) => (
                <button
                  key={item}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold ${
                    repairType === item
                      ? 'border-emerald-700 bg-emerald-700 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                  onClick={() => handleRepairTypeChange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {canShowOptions && visibleOptions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-700">オプション追加</h3>
              <div className="mt-3 grid gap-2">
                {visibleOptions.map((option) => {
                  const key = optionKey(option)
                  return (
                    <label key={key} className="flex cursor-pointer items-start justify-between gap-3 rounded-md border border-slate-300 bg-white px-3 py-3 text-sm hover:bg-slate-50">
                      <span className="flex min-w-0 items-start gap-3">
                        <input
                          className="mt-1 h-4 w-4"
                          type="checkbox"
                          checked={selectedOptionKeys.includes(key)}
                          onChange={() => toggleOption(option)}
                        />
                        <span>
                          <span className="block font-semibold text-slate-950">{option.optionName}</span>
                          {option.note && <span className="mt-1 block text-xs leading-5 text-slate-500">{option.note}</span>}
                        </span>
                      </span>
                      <span className="shrink-0 font-semibold text-slate-700">+{formatYen(option.price)}円</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            {!canCreateQuote && (
              <p className="mb-3 text-sm text-slate-500">メーカー・機種・修理内容を選択してください</p>
            )}
            <button
              className="w-full rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={!canCreateQuote}
              onClick={createQuote}
            >
              見積もり作成
            </button>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">見積もり結果</h2>
          {!quote ? (
            <div className="mt-5 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              見積もり作成ボタンを押すと結果を表示します。
            </div>
          ) : (
            <div className="mt-5 space-y-5">
              {isChangedAfterQuote && (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  選択内容が変更されています。再度見積もり作成を押してください。
                </p>
              )}
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">機種名</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{quote.item.modelName}</dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">型番</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{quote.item.modelNumber || '-'}</dd>
                </div>
                <div className="rounded-md bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">修理内容</dt>
                  <dd className="mt-1 font-semibold text-slate-950">{quote.repairType}</dd>
                </div>
                {quote.options.length > 0 && quote.baseAmount !== null && (
                  <>
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-xs font-semibold text-slate-500">基本修理金額</dt>
                      <dd className="mt-1 font-semibold text-slate-950">{formatYen(quote.baseAmount)}円（税込）</dd>
                    </div>
                    <div className="rounded-md bg-slate-50 p-3">
                      <dt className="text-xs font-semibold text-slate-500">オプション合計</dt>
                      <dd className="mt-1 font-semibold text-slate-950">{formatYen(quote.optionTotal)}円（税込）</dd>
                    </div>
                  </>
                )}
                {(quote.amount !== null || quote.kind === 'confirm') && (
                  <div className="rounded-md bg-slate-50 p-3">
                    <dt className="text-xs font-semibold text-slate-500">お見積もり金額</dt>
                    <dd className="mt-1 font-semibold text-slate-950">{quote.amountLabel}</dd>
                  </div>
                )}
              </dl>

              {quote.options.length > 0 && quote.totalAmount !== null && (
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold text-slate-700">内訳</h3>
                  <dl className="mt-3 grid gap-2 text-sm">
                    {quote.breakdown.map((item) => (
                      <div key={item.label} className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                        <dt className="text-slate-600">{item.label}</dt>
                        <dd className="font-semibold text-slate-950">{formatYen(item.amount)}円</dd>
                      </div>
                    ))}
                    <div className="flex justify-between gap-4 pt-1">
                      <dt className="font-semibold text-slate-700">合計</dt>
                      <dd className="font-semibold text-slate-950">{formatYen(quote.totalAmount)}円（税込）</dd>
                    </div>
                  </dl>
                </div>
              )}

              {quote.item.note && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <button
                    className="text-left text-sm font-semibold text-amber-900"
                    onClick={() => setIsStaffNoteOpen((current) => !current)}
                  >
                    {isStaffNoteOpen ? '▼' : '▶'} スタッフ向け注意
                  </button>
                  {isStaffNoteOpen && <p className="mt-2 whitespace-pre-wrap text-sm text-amber-900">{quote.item.note}</p>}
                </div>
              )}

              <div>
                <button
                  className="text-left text-sm font-semibold text-slate-700"
                  onClick={() => setIsCustomerMessageOpen((current) => !current)}
                >
                  {isCustomerMessageOpen ? '▼' : '▶'} お客様向け案内文
                </button>
                {isCustomerMessageOpen && (
                  <div className="mt-2 min-h-48 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-800">
                    <p className="whitespace-pre-wrap">{quote.customerMessage}</p>
                  </div>
                )}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50" onClick={copyMessage}>
                  案内文コピー
                </button>
                <button className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50" onClick={copyReservationSummary}>
                  予約管理用コピー
                </button>
                <button className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold hover:bg-slate-50" onClick={resetInputs}>
                  入力内容リセット
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {quote.kind === 'unsupported' || quote.kind === 'suspended' ? (
                  <button className="rounded-md bg-slate-800 px-4 py-3 text-sm font-semibold text-white" onClick={() => setConfirmStatus('その他')}>
                    その他として保存
                  </button>
                ) : (
                  <>
                    <button className="rounded-md bg-sky-700 px-4 py-3 text-sm font-semibold text-white" onClick={() => setConfirmStatus('受注')}>
                      受注
                    </button>
                    <button className="rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white" onClick={() => setConfirmStatus('検討')}>
                      検討
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
      )}

      {confirmStatus && quote && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">問い合わせ履歴に保存しますか</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">問い合わせ日</dt>
                <dd className="font-semibold">{new Date().toLocaleDateString('ja-JP')}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">機種名</dt>
                <dd className="font-semibold">{quote.item.modelName}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-slate-100 pb-2">
                <dt className="text-slate-500">修理内容</dt>
                <dd className="font-semibold">{quote.repairType}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">ステータス</dt>
                <dd className="font-semibold">{confirmStatus}</dd>
              </div>
            </dl>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setConfirmStatus(null)}>
                キャンセル
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => saveInquiry(confirmStatus)}>
                保存
              </button>
            </div>
          </section>
        </div>
      )}

      {isReportOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="max-h-[86vh] w-full max-w-xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">管理者へ報告</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                報告種別
                <select
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  value={reportForm.reportType}
                  onChange={(event) => updateReportField('reportType', event.target.value as ReportType)}
                >
                  {reportTypes.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                報告者名
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  value={reportForm.reporterName}
                  onChange={(event) => updateReportField('reporterName', event.target.value)}
                />
                {reportErrors.reporterName && <span className="text-sm font-semibold text-red-700">{reportErrors.reporterName}</span>}
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                機種名
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  value={reportForm.modelName}
                  onChange={(event) => updateReportField('modelName', event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                修理内容
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  value={reportForm.repairType}
                  onChange={(event) => updateReportField('repairType', event.target.value)}
                />
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                報告内容
                <textarea
                  className="min-h-32 w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                  placeholder="例：画面修理価格が実際の案内価格と違うため確認をお願いします。"
                  value={reportForm.reportContent}
                  onChange={(event) => updateReportField('reportContent', event.target.value)}
                />
                {reportErrors.reportContent && <span className="text-sm font-semibold text-red-700">{reportErrors.reportContent}</span>}
              </label>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setIsReportOpen(false)}>
                キャンセル
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={submitAdminReport}>
                送信
              </button>
            </div>
          </section>
        </div>
      )}

      {reportFailure && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">報告できませんでした</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              管理者への報告に失敗しました。通信環境を確認してください。
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setReportFailure(false)}>
                閉じる
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => retryReportRef.current?.()}>
                再試行
              </button>
            </div>
          </section>
        </div>
      )}

      {adminConfirm && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{adminConfirm.mode === 'edit' ? '変更内容を保存しますか' : '新規機種を追加しますか'}</h2>
            <div className="mt-4 grid gap-3 text-sm">
              {adminConfirm.changes.map((change) => (
                <div key={change.key} className="rounded-md border border-slate-200 p-3">
                  <p className="font-semibold text-slate-950">{change.label}</p>
                  {adminConfirm.mode === 'edit' ? (
                    <dl className="mt-2 grid gap-2">
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">変更前</dt>
                        <dd className="whitespace-pre-wrap text-slate-800">{change.before}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold text-slate-500">変更後</dt>
                        <dd className="whitespace-pre-wrap text-slate-950">{change.after}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="mt-2 whitespace-pre-wrap text-slate-950">{change.after}</p>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setAdminConfirm(null)}>
                キャンセル
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => runAdminSave(adminConfirm.mode)}>
                保存
              </button>
            </div>
          </section>
        </div>
      )}

      {adminFailure && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">保存できませんでした</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              変更内容を保存できませんでした。通信環境を確認してください。
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setAdminFailure(false)}>
                閉じる
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => retryAdminSaveRef.current?.()}>
                再試行
              </button>
            </div>
          </section>
        </div>
      )}

      {saveFailure && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
          <section className="w-full max-w-md rounded-lg bg-white p-6 text-center shadow-xl">
            <h2 className="text-lg font-semibold text-slate-950">保存できませんでした</h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              問い合わせ履歴を保存できませんでした。通信環境を確認してください。
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold" onClick={() => setSaveFailure(null)}>
                閉じる
              </button>
              <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={() => saveInquiry(saveFailure)}>
                再試行
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default App
