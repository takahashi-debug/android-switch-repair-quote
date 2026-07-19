"use client";

import { useEffect, useRef, useState } from "react";

export type ReceptionDraft = {
  receptionType: ReceptionType;
  receptionDateTime: string;
  storeName: string;
  staffName: string;
  customerName: string;
  customerKana: string;
  phone: string;
  deviceCategory: string;
  manufacturer: string;
  modelName: string;
  modelNumber: string;
  symptom: string;
  repairDetails: string;
  estimateAmount: string;
  supportCategory: string;
  deliveryTime: string;
  workTime: string;
  options: string;
  customerGuidance: string;
  internalMemo: string;
  visitDateTime: string;
  inquiryChannel: InquiryChannel | "";
  inquiryChannelOther: string;
  fromEstimate: boolean;
  estimateFingerprint: string;
};

type ReceptionType = "店頭受付" | "電話・ネット・その他予約";
type InquiryChannel = "電話" | "ホームページ" | "Google" | "LINE" | "その他";
type TemporaryReception = ReceptionDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  storeKey: string;
};

const RETENTION_MS = 24 * 60 * 60 * 1000;
const channels: InquiryChannel[] = ["電話", "ホームページ", "Google", "LINE", "その他"];

export function createReceptionDraft(storeName: string, staffName = ""): ReceptionDraft {
  return {
    receptionType: "店頭受付",
    receptionDateTime: toDateTimeLocal(new Date()),
    storeName,
    staffName,
    customerName: "",
    customerKana: "",
    phone: "",
    deviceCategory: "",
    manufacturer: "",
    modelName: "",
    modelNumber: "",
    symptom: "",
    repairDetails: "",
    estimateAmount: "",
    supportCategory: "",
    deliveryTime: "",
    workTime: "",
    options: "",
    customerGuidance: "",
    internalMemo: "",
    visitDateTime: "",
    inquiryChannel: "",
    inquiryChannelOther: "",
    fromEstimate: false,
    estimateFingerprint: "",
  };
}

export function purgeExpiredReceptions(storeName: string) {
  return readActiveReceptions(normalizeStoreKey(storeName));
}

export function ReceptionPanel({
  storeName,
  staffName,
  isAdmin,
  initialDraft,
  onDraftConsumed,
}: {
  storeName: string;
  staffName: string;
  isAdmin: boolean;
  initialDraft: ReceptionDraft | null;
  onDraftConsumed: () => void;
}) {
  const storeKey = normalizeStoreKey(storeName);
  const [form, setForm] = useState(() => initialDraft || createReceptionDraft(storeName, staffName));
  const autoReceptionDateTimeRef = useRef(form.receptionType === "店頭受付" ? form.receptionDateTime : "");
  const [items, setItems] = useState<TemporaryReception[]>([]);
  const [editingId, setEditingId] = useState("");
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function refresh() {
    if (!isAdmin) return;
    setItems(readActiveReceptions(storeKey));
  }

  useEffect(() => {
    if (!isAdmin) return;
    refresh();
    const interval = window.setInterval(refresh, 60_000);
    return () => window.clearInterval(interval);
  }, [isAdmin, storeKey]);

  useEffect(() => {
    if (!initialDraft || !isAdmin) return;
    setEditingId("");
    setForm(initialDraft);
    autoReceptionDateTimeRef.current = initialDraft.receptionType === "店頭受付" ? initialDraft.receptionDateTime : "";
    setFeedback(null);
    onDraftConsumed();
  }, [initialDraft, isAdmin, onDraftConsumed]);

  if (!isAdmin) return null;

  function update<K extends keyof ReceptionDraft>(key: K, value: ReceptionDraft[K]) {
    if (key === "receptionDateTime") autoReceptionDateTimeRef.current = "";
    setForm((current) => ({ ...current, [key]: value }));
    setFeedback(null);
  }

  function updateReceptionType(receptionType: ReceptionType) {
    setForm((current) => {
      if (receptionType === current.receptionType) return current;
      if (receptionType === "店頭受付") {
        if (current.receptionDateTime) return { ...current, receptionType };
        const receptionDateTime = toDateTimeLocal(new Date());
        autoReceptionDateTimeRef.current = receptionDateTime;
        return { ...current, receptionType, receptionDateTime };
      }
      const shouldClear = Boolean(autoReceptionDateTimeRef.current)
        && current.receptionDateTime === autoReceptionDateTimeRef.current;
      autoReceptionDateTimeRef.current = "";
      return {
        ...current,
        receptionType,
        receptionDateTime: shouldClear ? "" : current.receptionDateTime,
      };
    });
    setFeedback(null);
  }

  function reset() {
    setEditingId("");
    const draft = createReceptionDraft(storeName, staffName);
    autoReceptionDateTimeRef.current = draft.receptionDateTime;
    setForm(draft);
    setFeedback(null);
  }

  function save() {
    if (!isAdmin || form.storeName !== storeName) {
      setFeedback({ tone: "error", message: "この店舗の受付情報は操作できません。" });
      return;
    }
    const error = validate(form);
    if (error) {
      setFeedback({ tone: "error", message: error });
      return;
    }
    const now = new Date();
    const current = readActiveReceptions(storeKey);
    let next: TemporaryReception[];
    if (editingId) {
      const target = current.find((item) => item.id === editingId);
      if (!target || target.storeKey !== storeKey) {
        setFeedback({ tone: "error", message: "編集対象の受付情報を確認できませんでした。" });
        return;
      }
      const updated: TemporaryReception = {
        ...target,
        ...form,
        id: target.id,
        createdAt: target.createdAt,
        expiresAt: target.expiresAt,
        storeKey: target.storeKey,
        storeName: target.storeName,
        updatedAt: now.toISOString(),
      };
      next = current.map((item) => (item.id === editingId ? updated : item));
    } else {
      next = [{
        ...form,
        id: createId(),
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + RETENTION_MS).toISOString(),
        storeKey,
        storeName,
      }, ...current];
    }
    writeReceptions(storeKey, next);
    setItems(sortNewest(next));
    setEditingId("");
    const draft = createReceptionDraft(storeName, staffName);
    autoReceptionDateTimeRef.current = draft.receptionDateTime;
    setForm(draft);
    setFeedback({ tone: "success", message: "受付情報を保存しました。登録から24時間後に自動で削除されます。" });
  }

  function edit(item: TemporaryReception) {
    if (!isAdmin || item.storeKey !== storeKey) return;
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, expiresAt: _expiresAt, storeKey: _storeKey, ...draft } = item;
    setEditingId(item.id);
    setForm(draft);
    autoReceptionDateTimeRef.current = "";
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(item: TemporaryReception) {
    if (!isAdmin || item.storeKey !== storeKey || !window.confirm("この受付情報を削除しますか？")) return;
    const next = readActiveReceptions(storeKey).filter((entry) => entry.id !== item.id);
    writeReceptions(storeKey, next);
    setItems(next);
    if (editingId === item.id) reset();
  }

  async function copy(item: TemporaryReception) {
    if (!isAdmin || item.storeKey !== storeKey) return;
    try {
      await copyToClipboard(formatReception(item));
      setFeedback({ tone: "success", message: "受付内容をコピーしました。" });
    } catch {
      setFeedback({ tone: "error", message: "受付内容をコピーできませんでした。" });
    }
  }

  return (
    <section className="grid gap-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-950">{editingId ? "受付情報を編集" : "新しい受付を作成"}</h2>
          <p className="mt-1 text-sm text-slate-500">保存した受付は、このブラウザ内で24時間だけ保持されます。</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <SelectField label="受付種別（必須）" value={form.receptionType} onChange={(value) => updateReceptionType(value as ReceptionType)} options={["店頭受付", "電話・ネット・その他予約"]} />
          <InputField label={form.receptionType === "店頭受付" ? "受付日時" : "ご来店日時（必須）"} type="datetime-local" value={form.receptionDateTime} required={form.receptionType === "電話・ネット・その他予約"} onChange={(value) => update("receptionDateTime", value)} />
          <InputField label="受付店舗" value={storeName} readOnly onChange={() => {}} />
          <InputField label="受付担当者" value={form.staffName} onChange={(value) => update("staffName", value)} />
          <InputField label="お客様氏名（必須）" value={form.customerName} onChange={(value) => update("customerName", value)} />
          <InputField label="フリガナ" value={form.customerKana} onChange={(value) => update("customerKana", value)} />
          <InputField label="電話番号（必須）" type="tel" value={form.phone} onChange={(value) => update("phone", value)} />
          <InputField label="端末カテゴリ" value={form.deviceCategory} onChange={(value) => update("deviceCategory", value)} />
          <InputField label="メーカー" value={form.manufacturer} onChange={(value) => update("manufacturer", value)} />
          <InputField label="機種名（機種名または型番は必須）" value={form.modelName} onChange={(value) => update("modelName", value)} />
          <InputField label="型番（機種名または型番は必須）" value={form.modelNumber} onChange={(value) => update("modelNumber", value)} />
          <TextAreaField label="症状（症状または修理内容は必須）" value={form.symptom} onChange={(value) => update("symptom", value)} />
          <TextAreaField label="修理内容（症状または修理内容は必須）" value={form.repairDetails} onChange={(value) => update("repairDetails", value)} />
          <InputField label="見積金額" value={form.estimateAmount} onChange={(value) => update("estimateAmount", value)} />
          <InputField label="対応区分" value={form.supportCategory} onChange={(value) => update("supportCategory", value)} />
          <InputField label="納期" value={form.deliveryTime} onChange={(value) => update("deliveryTime", value)} />
          <InputField label="作業時間" value={form.workTime} onChange={(value) => update("workTime", value)} />
          <TextAreaField label="オプション" value={form.options} onChange={(value) => update("options", value)} />
          <TextAreaField label="お客様向け案内文" value={form.customerGuidance} onChange={(value) => update("customerGuidance", value)} />
          <TextAreaField label="店舗内メモ" value={form.internalMemo} onChange={(value) => update("internalMemo", value)} />
          {form.receptionType === "電話・ネット・その他予約" ? <>
            <SelectField label="問い合わせ経路" value={form.inquiryChannel} onChange={(value) => update("inquiryChannel", value as InquiryChannel | "")} options={["", ...channels]} />
            {form.inquiryChannel === "その他" ? <InputField label="問い合わせ経路の詳細" value={form.inquiryChannelOther} onChange={(value) => update("inquiryChannelOther", value)} /> : null}
          </> : null}
        </div>
        {feedback ? <p className={`mt-5 rounded-md px-4 py-3 text-sm font-semibold ${feedback.tone === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{feedback.message}</p> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <button type="button" onClick={save} className="min-h-11 rounded-md bg-blue-700 px-5 text-sm font-bold text-white hover:bg-blue-800">{editingId ? "変更を保存" : "受付を保存"}</button>
          {editingId ? <button type="button" onClick={reset} className="min-h-11 rounded-md border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700">編集をキャンセル</button> : null}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-lg font-bold text-slate-950">直近24時間の受付一覧</h2><p className="mt-1 text-sm text-slate-500">{storeName}の受付のみ表示しています。</p></div>
          <button type="button" onClick={refresh} className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">再表示</button>
        </div>
        <div className="mt-5 grid gap-4">
          {items.length ? items.map((item) => <article key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <dl className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Summary label={dateTimeLabel(item.receptionType)} value={formatDateTime(item.receptionDateTime)} />
              <Summary label="受付種別" value={item.receptionType} />
              <Summary label="お客様氏名" value={item.customerName} />
              <Summary label="電話番号" value={item.phone} />
              <Summary label="機種" value={[item.modelName, item.modelNumber].filter(Boolean).join(" / ")} />
              <Summary label="症状・修理内容" value={[item.symptom, item.repairDetails].filter(Boolean).join(" / ")} />
              <Summary label="受付担当者" value={item.staffName} />
              <Summary label="保存期限" value={remainingTime(item.expiresAt)} />
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => copy(item)} className="min-h-10 rounded-md border border-blue-300 bg-white px-4 text-sm font-semibold text-blue-700">内容をコピー</button>
              <button type="button" onClick={() => edit(item)} className="min-h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">編集</button>
              <button type="button" onClick={() => remove(item)} className="min-h-10 rounded-md border border-red-300 bg-white px-4 text-sm font-semibold text-red-700">削除</button>
            </div>
          </article>) : <p className="rounded-lg bg-slate-50 p-5 text-sm text-slate-500">保存中の受付はありません。</p>}
        </div>
      </section>
    </section>
  );
}

function InputField({ label, value, onChange, type = "text", readOnly = false, required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; readOnly?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-700"><span>{label}</span><input type={type} value={value} readOnly={readOnly} required={required} onChange={(event) => onChange(event.target.value)} className={`min-h-11 rounded-md border border-slate-300 px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 ${readOnly ? "bg-slate-100 text-slate-500" : "bg-white"}`} /></label>;
}
function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-700"><span>{label}</span><textarea value={value} onChange={(event) => onChange(event.target.value)} rows={3} className="rounded-md border border-slate-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" /></label>;
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) {
  return <label className="grid gap-2 text-sm font-semibold text-slate-700"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-11 rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">{options.map((option) => <option key={option || "empty"} value={option}>{option || "選択してください"}</option>)}</select></label>;
}
function Summary({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs font-semibold text-slate-500">{label}</dt><dd className="mt-1 break-words font-semibold text-slate-900">{value || "-"}</dd></div>; }

function validate(form: ReceptionDraft) {
  const missing: string[] = [];
  if (!form.receptionType) missing.push("受付種別");
  if (!form.customerName.trim()) missing.push("お客様氏名");
  if (!form.phone.trim()) missing.push("電話番号");
  if (!form.modelName.trim() && !form.modelNumber.trim()) missing.push("機種名または型番");
  if (!form.symptom.trim() && !form.repairDetails.trim()) missing.push("症状または修理内容");
  if (form.receptionType === "電話・ネット・その他予約" && !form.receptionDateTime) missing.push("ご来店日時");
  return missing.length ? `次の必須項目を入力してください：${missing.join("、")}` : "";
}
function storageKey(storeKey: string) { return `repair-quote:temporary-receptions:${storeKey}`; }
function normalizeStoreKey(storeName: string) { return encodeURIComponent(storeName.trim().normalize("NFKC")); }
function readActiveReceptions(storeKey: string) {
  if (typeof window === "undefined") return [];
  let parsed: TemporaryReception[] = [];
  try { const value = window.localStorage.getItem(storageKey(storeKey)); parsed = value ? JSON.parse(value) : []; } catch { parsed = []; }
  parsed = Array.isArray(parsed) ? parsed.map(normalizeStoredReception) : [];
  const now = Date.now();
  const active = Array.isArray(parsed) ? parsed.filter((item) => item && item.storeKey === storeKey && Date.parse(item.expiresAt) > now) : [];
  if (active.length !== parsed.length) writeReceptions(storeKey, active);
  return sortNewest(active);
}
function writeReceptions(storeKey: string, items: TemporaryReception[]) {
  if (typeof window === "undefined") return;
  if (items.length === 0) {
    window.localStorage.removeItem(storageKey(storeKey));
    return;
  }
  window.localStorage.setItem(storageKey(storeKey), JSON.stringify(items));
}
function sortNewest(items: TemporaryReception[]) { return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)); }
function normalizeStoredReception(item: TemporaryReception) {
  if (item?.receptionType !== "電話・ネット・その他予約" || !item.visitDateTime) return item;
  return { ...item, receptionDateTime: item.visitDateTime, visitDateTime: "" };
}
function createId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `reception-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function toDateTimeLocal(date: Date) { const offset = date.getTimezoneOffset() * 60_000; return new Date(date.getTime() - offset).toISOString().slice(0, 16); }
function formatDateTime(value: string) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(date); }
function remainingTime(expiresAt: string) { const minutes = Math.max(0, Math.ceil((Date.parse(expiresAt) - Date.now()) / 60_000)); if (minutes < 30) return "残り30分未満"; if (minutes < 60) return `残り${minutes}分`; return `残り${Math.ceil(minutes / 60)}時間`; }
function dateTimeLabel(receptionType: ReceptionType) { return receptionType === "店頭受付" ? "受付日時" : "ご来店日時"; }
function formatReception(item: TemporaryReception) {
  const channel = item.inquiryChannel === "その他" ? [item.inquiryChannel, item.inquiryChannelOther].filter(Boolean).join("：") : item.inquiryChannel;
  const lines: [string, string][] = [[dateTimeLabel(item.receptionType), formatDateTime(item.receptionDateTime)], ["受付種別", item.receptionType], ["受付店舗", item.storeName], ["受付担当", item.staffName], ["お客様氏名", item.customerName], ["フリガナ", item.customerKana], ["電話番号", item.phone], ["端末カテゴリ", item.deviceCategory], ["メーカー", item.manufacturer], ["機種名", item.modelName], ["型番", item.modelNumber], ["症状", item.symptom], ["修理内容", item.repairDetails], ["見積金額", item.estimateAmount], ["対応区分", item.supportCategory], ["納期", item.deliveryTime], ["作業時間", item.workTime], ["オプション", item.options], ["問い合わせ経路", channel], ["お客様向け案内文", item.customerGuidance], ["店舗内メモ", item.internalMemo]];
  return lines.filter(([, value]) => value.trim()).map(([label, value]) => `${label}：${value}`).join("\n");
}
async function copyToClipboard(text: string) {
  if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return; }
  const textarea = document.createElement("textarea"); textarea.value = text; textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.appendChild(textarea); textarea.select(); const copied = document.execCommand("copy"); textarea.remove(); if (!copied) throw new Error("copy failed");
}
