import { useMemo, useState } from "react";

import {
  MACBOOK_REPAIR_PRICES,
  MACBOOK_REPAIR_TYPES,
  formatMacBookModel,
} from "../data/macbookRepairPrices";
import {
  WINDOWS_PC_DEVICE_TYPES,
  WINDOWS_PC_MANUFACTURERS,
  WINDOWS_PC_REPAIR_PRICES,
} from "../data/windowsPcRepairPrices";

export type PcEstimateFormValue = {
  category: "Windows PC" | "MacBook";
  maker: string;
  customMaker: string;
  modelName: string;
  modelNumber: string;
  repairType: string;
};

export function PcEstimateFields({
  form,
  onChange,
}: {
  form: PcEstimateFormValue;
  onChange: (values: Partial<PcEstimateFormValue>) => void;
}) {
  return form.category === "Windows PC"
    ? <WindowsPcFields form={form} onChange={onChange} />
    : <MacBookFields form={form} onChange={onChange} />;
}

function WindowsPcFields({ form, onChange }: { form: PcEstimateFormValue; onChange: (values: Partial<PcEstimateFormValue>) => void }) {
  return (
    <>
      <PcField label="メーカーを選択" step="STEP 1" completed={Boolean(form.maker && (form.maker !== "その他" || form.customMaker.trim()))}>
        <ChoiceGrid options={[...WINDOWS_PC_MANUFACTURERS]} value={form.maker} onChange={(maker) => onChange({ maker, customMaker: "", modelName: "", repairType: "" })} />
        {form.maker === "その他" ? (
          <input value={form.customMaker} onChange={(event) => onChange({ customMaker: event.target.value })} placeholder="メーカー名を入力" className="mt-3 min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        ) : null}
      </PcField>
      <PcField label="端末タイプを選択" step="STEP 2" completed={Boolean(form.modelName)}>
        <ChoiceGrid options={[...WINDOWS_PC_DEVICE_TYPES]} value={form.modelName} onChange={(modelName) => onChange({ modelName, modelNumber: "", repairType: "" })} />
      </PcField>
      <PcField label="修理内容を選択" step="STEP 3" completed={Boolean(form.repairType)}>
        <ChoiceGrid options={WINDOWS_PC_REPAIR_PRICES.map((item) => item.label)} value={form.repairType} onChange={(repairType) => onChange({ repairType })} />
      </PcField>
    </>
  );
}

function MacBookFields({ form, onChange }: { form: PcEstimateFormValue; onChange: (values: Partial<PcEstimateFormValue>) => void }) {
  const [search, setSearch] = useState("");
  const models = useMemo(() => {
    const query = search.trim().normalize("NFKC").toLowerCase();
    return [...MACBOOK_REPAIR_PRICES]
      .sort((left, right) => right.year - left.year || right.size - left.size || left.family.localeCompare(right.family))
      .filter((model) =>
        !query || formatMacBookModel(model).normalize("NFKC").toLowerCase().includes(query),
      );
  }, [search]);

  return (
    <>
      <PcField label="MacBook機種を選択" step="STEP 1" completed={Boolean(form.modelName)}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="年式・サイズ・Air／Pro・モデル番号で検索" className="min-h-12 w-full rounded-lg border border-slate-300 bg-white px-4 text-base outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
        <p className="mt-3 text-sm font-semibold text-slate-600">{models.length}件</p>
        <div className="mt-2 grid max-h-96 gap-2 overflow-y-auto pr-1">
          {models.map((model) => {
            const label = formatMacBookModel(model);
            const selected = form.modelName === label && form.modelNumber === model.modelNumber;
            return (
              <button key={`${label}-${model.modelNumber}`} type="button" aria-pressed={selected} onClick={() => onChange({ maker: "Apple", modelName: label, modelNumber: model.modelNumber, repairType: "" })} className={`min-h-14 rounded-lg border p-3 text-left text-sm font-bold transition ${selected ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </PcField>
      <PcField label="修理内容を選択" step="STEP 2" completed={Boolean(form.repairType)}>
        <ChoiceGrid options={[...MACBOOK_REPAIR_TYPES]} value={form.repairType} onChange={(repairType) => onChange({ repairType })} />
      </PcField>
    </>
  );
}

function PcField({ label, step, completed, children }: { label: string; step: string; completed: boolean; children: React.ReactNode }) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">{step}</span>
        <h3 className="text-sm font-bold text-slate-950">{label}</h3>
        <span className={`text-xs font-bold ${completed ? "text-emerald-700" : "text-amber-700"}`}>{completed ? "入力済み" : "必須"}</span>
      </div>
      {children}
    </section>
  );
}

function ChoiceGrid({ options, value, onChange }: { options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
      {options.map((option) => (
        <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`min-h-14 rounded-lg border px-4 py-2.5 text-left text-sm font-bold transition ${value === option ? "border-blue-700 bg-blue-700 text-white" : "border-slate-300 bg-white text-slate-800 hover:border-blue-400 hover:bg-blue-50"}`}>
          {option}
        </button>
      ))}
    </div>
  );
}
