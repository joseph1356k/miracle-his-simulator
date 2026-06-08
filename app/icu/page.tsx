"use client";

import { useEffect, useState } from "react";
import { HeartPulse, FileSignature } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section, Stat } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField } from "@/components/ui/Field";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, ageFromBirthDate, fullName } from "@/lib/utils/format";

const EMPTY = {
  ventMode: "Asistido controlado", fio2: "", peep: "", tidalVolume: "", respRate: "", plateau: "",
  rass: "0", glasgow: "15", diuresis: "", fluidBalance: "", cvc: "No", urinaryCatheter: "No", ett: "No",
  vasopressors: "", antibiotics: "", dailyGoals: "",
};

export default function IcuPage() {
  const data = useHospital((s) => s.data);
  const addNote = useHospital((s) => s.addNote);
  const { userName, roleId } = useSession();
  const selectPatient = useSession((s) => s.selectPatient);
  const selectEncounter = useSession((s) => s.selectEncounter);
  const selectedEncounterId = useSession((s) => s.selectedEncounterId);
  const addToast = useUI((s) => s.addToast);

  const icu = data.encounters.filter((e) => e.type === "icu");
  const [activeId, setActiveId] = useState<string | undefined>(selectedEncounterId);
  const active = icu.find((e) => e.id === activeId) ?? icu[0];
  useEffect(() => { if (active) { selectPatient(active.patientId); selectEncounter(active.id); } }, [active, selectPatient, selectEncounter]);

  const [f, setF] = useState({ ...EMPTY });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  const patient = data.patients.find((p) => p.id === active?.patientId);

  const save = () => {
    if (!active || !patient) return;
    addNote({
      id: genId("note"), encounterId: active.id, patientId: patient.id, type: "progress", title: "Evolución UCI", status: "signed",
      author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: {
        "Modo ventilatorio": f.ventMode, FiO2: f.fio2, PEEP: f.peep, "Volumen tidal": f.tidalVolume, "Frecuencia respiratoria": f.respRate,
        "Presión plateau": f.plateau, RASS: f.rass, Glasgow: f.glasgow, Diuresis: f.diuresis, "Balance hídrico": f.fluidBalance,
        "Catéter venoso central": f.cvc, "Sonda vesical": f.urinaryCatheter, "Tubo orotraqueal": f.ett,
        Vasopresores: f.vasopressors, Antibióticos: f.antibiotics, "Objetivos del día": f.dailyGoals,
      },
    });
    addToast({ title: "Evolución UCI firmada", variant: "success" });
  };

  return (
    <PageContainer>
      <PageHeader title="Unidad de Cuidados Intensivos" description="Tablero de UCI y hoja de evolución de cuidado crítico." icon={<HeartPulse className="h-5 w-5" />} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Pacientes en UCI" value={icu.length} tone="red" />
        <Stat label="En ventilación" value={icu.length} tone="amber" />
        <Stat label="Camas UCI" value={14} />
        <Stat label="Ocupación" value={`${Math.round((icu.length / 14) * 100)}%`} tone="purple" />
      </div>

      <Section title="Camas UCI" testId="section-icu-board">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {icu.map((e) => { const p = data.patients.find((x) => x.id === e.patientId); return (
            <button key={e.id} onClick={() => setActiveId(e.id)} data-testid={`icu-bed-${e.id}`} className={`flex flex-col gap-0.5 rounded-md border p-2 text-left ${active?.id === e.id ? "border-clinical-500 bg-clinical-50" : "border-ink-200 hover:border-clinical-300"}`}>
              <span className="text-2xs font-semibold text-clinical-700">{e.bed}</span>
              <span className="truncate text-xs font-medium text-ink-800">{p ? fullName(p) : ""}</span>
              <span className="truncate text-2xs text-ink-400">{e.admissionDiagnosis ?? e.reason}</span>
            </button>
          ); })}
        </div>
      </Section>

      {active && patient && (
        <Section title={`Hoja de UCI · ${fullName(patient)} (${ageFromBirthDate(patient.birthDate)}a) · ${active.bed}`} testId="section-icu-sheet" actions={<Button size="sm" onClick={save} data-testid="button-sign-icu"><FileSignature className="h-4 w-4" /> Firmar evolución</Button>}>
          <div className="space-y-4">
            <div>
              <h5 className="mb-2 text-2xs font-semibold uppercase text-ink-400">Ventilación mecánica</h5>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <SelectField id="icu-mode" name="ventMode" testId="field-icu-vent-mode" label="Modo ventilatorio" section="Ventilación" value={f.ventMode} onChange={(v) => upd("ventMode", v)} options={["Asistido controlado", "SIMV", "Presión soporte", "VC", "PC", "Tubo en T"]} />
                <TextField id="icu-fio2" name="fio2" testId="field-icu-fio2" label="FiO2 (%)" section="Ventilación" inputMode="numeric" value={f.fio2} onChange={(v) => upd("fio2", v)} />
                <TextField id="icu-peep" name="peep" testId="field-icu-peep" label="PEEP" section="Ventilación" inputMode="numeric" value={f.peep} onChange={(v) => upd("peep", v)} />
                <TextField id="icu-tv" name="tidalVolume" testId="field-icu-tidal-volume" label="Volumen tidal" section="Ventilación" inputMode="numeric" value={f.tidalVolume} onChange={(v) => upd("tidalVolume", v)} />
                <TextField id="icu-rr" name="respRate" testId="field-icu-resp-rate" label="Frec. respiratoria" section="Ventilación" inputMode="numeric" value={f.respRate} onChange={(v) => upd("respRate", v)} />
                <TextField id="icu-plat" name="plateau" testId="field-icu-plateau" label="Presión plateau" section="Ventilación" inputMode="numeric" value={f.plateau} onChange={(v) => upd("plateau", v)} />
              </div>
            </div>
            <div>
              <h5 className="mb-2 text-2xs font-semibold uppercase text-ink-400">Neurológico y balance</h5>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SelectField id="icu-rass" name="rass" testId="field-icu-rass" label="RASS" section="Neuro" value={f.rass} onChange={(v) => upd("rass", v)} options={["+4", "+3", "+2", "+1", "0", "-1", "-2", "-3", "-4", "-5"]} />
                <TextField id="icu-gcs" name="glasgow" testId="field-icu-glasgow" label="Glasgow" section="Neuro" inputMode="numeric" value={f.glasgow} onChange={(v) => upd("glasgow", v)} />
                <TextField id="icu-diur" name="diuresis" testId="field-icu-diuresis" label="Diuresis (cc)" section="Neuro" inputMode="numeric" value={f.diuresis} onChange={(v) => upd("diuresis", v)} />
                <TextField id="icu-bal" name="fluidBalance" testId="field-icu-fluid-balance" label="Balance hídrico (cc)" section="Neuro" value={f.fluidBalance} onChange={(v) => upd("fluidBalance", v)} />
              </div>
            </div>
            <div>
              <h5 className="mb-2 text-2xs font-semibold uppercase text-ink-400">Dispositivos invasivos</h5>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <SelectField id="icu-cvc" name="cvc" testId="field-icu-cvc" label="Catéter venoso central" section="Dispositivos" value={f.cvc} onChange={(v) => upd("cvc", v)} options={["No", "Sí - yugular", "Sí - subclavia", "Sí - femoral"]} />
                <SelectField id="icu-foley" name="urinaryCatheter" testId="field-icu-urinary-catheter" label="Sonda vesical" section="Dispositivos" value={f.urinaryCatheter} onChange={(v) => upd("urinaryCatheter", v)} options={["No", "Sí"]} />
                <SelectField id="icu-ett" name="ett" testId="field-icu-ett" label="Tubo orotraqueal" section="Dispositivos" value={f.ett} onChange={(v) => upd("ett", v)} options={["No", "Sí"]} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="icu-vaso" name="vasopressors" testId="field-icu-vasopressors" label="Vasopresores / infusiones" section="Tratamiento" value={f.vasopressors} onChange={(v) => upd("vasopressors", v)} placeholder="Ej: Norepinefrina 0.08 mcg/kg/min" />
              <TextField id="icu-atb" name="antibiotics" testId="field-icu-antibiotics" label="Antibióticos" section="Tratamiento" value={f.antibiotics} onChange={(v) => upd("antibiotics", v)} />
              <TextAreaField id="icu-goals" name="dailyGoals" testId="field-icu-daily-goals" label="Objetivos del día" section="Tratamiento" rows={3} value={f.dailyGoals} onChange={(v) => upd("dailyGoals", v)} containerClassName="sm:col-span-2" />
            </div>
          </div>
        </Section>
      )}
    </PageContainer>
  );
}
