"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, AlertTriangle, Sparkles } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/ui/Field";
import { SelectedPatientBanner } from "@/components/clinical/SelectedPatientBanner";
import { useSelected } from "@/lib/hooks/useSelected";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { useSaveShortcut } from "@/lib/hooks/useSaveShortcut";
import { genId } from "@/lib/utils/id";
import { nowIso } from "@/lib/utils/format";
import { FREQUENCIES } from "@/lib/data/catalogs";
import type { Order, OrderCategory, OrderPriority } from "@/lib/types";

const CATEGORY_OPTIONS = [
  { value: "laboratory", label: "Laboratorio" }, { value: "imaging", label: "Imágenes" },
  { value: "medication", label: "Medicamento" }, { value: "nursing", label: "Cuidado de enfermería" },
  { value: "diet", label: "Dieta" }, { value: "procedure", label: "Procedimiento" },
  { value: "interconsultation", label: "Interconsulta" }, { value: "therapy", label: "Terapia" },
  { value: "blood-bank", label: "Banco de sangre" }, { value: "isolation", label: "Aislamiento" },
  { value: "monitoring", label: "Monitoreo" }, { value: "discharge", label: "Egreso" },
];

const ORDER_SETS: { name: string; orders: { name: string; category: OrderCategory }[] }[] = [
  { name: "Dolor torácico", orders: [
    { name: "Electrocardiograma", category: "procedure" }, { name: "Troponina seriada", category: "laboratory" },
    { name: "Hemograma", category: "laboratory" }, { name: "Radiografía de tórax", category: "imaging" },
    { name: "Monitoreo cardíaco continuo", category: "monitoring" },
  ] },
  { name: "Sepsis", orders: [
    { name: "Hemocultivos x2", category: "laboratory" }, { name: "Lactato sérico", category: "laboratory" },
    { name: "Líquidos IV 30 mL/kg", category: "medication" }, { name: "Antibiótico de amplio espectro", category: "medication" },
  ] },
  { name: "Ingreso hospitalario", orders: [
    { name: "Dieta blanda", category: "diet" }, { name: "Control de signos vitales c/8h", category: "nursing" },
    { name: "Hemograma + química", category: "laboratory" },
  ] },
];

export default function NewOrderPage() {
  const { patient, encounter } = useSelected();
  const addOrder = useHospital((s) => s.addOrder);
  const orders = useHospital((s) => s.data.orders);
  const { userName, roleId } = useSession();
  const addToast = useUI((s) => s.addToast);
  const router = useRouter();

  const [category, setCategory] = useState<OrderCategory>("laboratory");
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<OrderPriority>("rutina");
  const [indication, setIndication] = useState("");
  const [frequency, setFrequency] = useState("");
  const [schedule, setSchedule] = useState("");
  const [startDate, setStartDate] = useState("");
  const [stopDate, setStopDate] = useState("");
  const [sign, setSign] = useState(false);
  const [labText, setLabText] = useState("");
  const [imgText, setImgText] = useState("");

  const duplicate = useMemo(
    () => patient && name.trim() ? orders.some((o) => o.patientId === patient.id && o.name.toLowerCase() === name.trim().toLowerCase() && o.status !== "cancelled") : false,
    [orders, patient, name],
  );
  const allergyAlert = category === "medication" && (patient?.allergies.length ?? 0) > 0;

  const make = (n: string, cat: OrderCategory): Order => ({
    id: genId("ord"), encounterId: encounter?.id ?? "sin-encuentro", patientId: patient!.id,
    category: cat, name: n, priority, indication: indication || undefined, frequency: frequency || undefined,
    schedule: schedule || undefined, startDate: startDate || undefined, stopDate: stopDate || undefined,
    status: sign ? "signed" : "draft", orderedBy: userName, orderedByRole: roleId, createdAt: nowIso(),
    signedAt: sign ? nowIso() : undefined,
    flags: [...(name && cat === category && duplicate ? ["Posible duplicado"] : []), ...(cat === "medication" && allergyAlert ? ["Alerta de alergia (demo)"] : [])],
  });

  const submit = () => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const created: Order[] = [];
    if (name.trim()) created.push(make(name.trim(), category));
    labText.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).forEach((n) => created.push(make(n, "laboratory")));
    imgText.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean).forEach((n) => created.push(make(n, "imaging")));
    if (created.length === 0) { addToast({ title: "Agregue al menos una orden", variant: "warning" }); return; }
    created.forEach(addOrder);
    addToast({ title: `${created.length} orden(es) creada(s)`, description: sign ? "Firmadas" : "En borrador", variant: "success" });
    router.push("/orders");
  };

  const addSet = (setName: string) => {
    if (!patient) { addToast({ title: "Seleccione un paciente", variant: "warning" }); return; }
    const set = ORDER_SETS.find((s) => s.name === setName)!;
    set.orders.forEach((o) => addOrder(make(o.name, o.category)));
    addToast({ title: `Set "${setName}" agregado`, description: `${set.orders.length} órdenes`, variant: "success" });
  };

  useSaveShortcut(submit);

  return (
    <PageContainer>
      <PageHeader title="Nueva orden médica" description="Entrada de órdenes (CPOE). Verifique alertas de duplicado y alergia." icon={<ClipboardList className="h-5 w-5" />} actions={<Button variant="ghost" onClick={() => router.push("/orders")}>Cancelar</Button>} />
      <SelectedPatientBanner requirement="crear órdenes" />

      {(duplicate || allergyAlert) && (
        <div className="space-y-2">
          {duplicate && <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800" data-testid="order-duplicate-alert"><AlertTriangle className="h-4 w-4" /> Posible orden duplicada para este paciente.</div>}
          {allergyAlert && <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-800" data-testid="order-allergy-alert"><AlertTriangle className="h-4 w-4" /> Alerta de alergia (demo): el paciente tiene alergias registradas ({patient?.allergies.map((a) => a.substance).join(", ")}).</div>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Orden estructurada" testId="section-order">
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField id="ord-category" name="category" testId="field-order-category" label="Categoría" section="Orden" value={category} onChange={(v) => setCategory(v as OrderCategory)} options={CATEGORY_OPTIONS} />
              <TextField id="ord-name" name="name" testId="field-order-name" label="Nombre de la orden" section="Orden" value={name} onChange={setName} placeholder="Ej: Hemograma, Radiografía de tórax…" />
              <SelectField id="ord-priority" name="priority" testId="field-order-priority" label="Prioridad" section="Orden" value={priority} onChange={(v) => setPriority(v as OrderPriority)} options={[{ value: "rutina", label: "Rutina" }, { value: "prioritario", label: "Prioritario" }, { value: "urgente", label: "Urgente" }, { value: "stat", label: "STAT" }]} />
              <SelectField id="ord-frequency" name="frequency" testId="field-order-frequency" label="Frecuencia" section="Orden" value={frequency} onChange={setFrequency} options={FREQUENCIES} placeholder="Seleccionar" />
              <TextField id="ord-start" name="startDate" testId="field-order-start-date" label="Fecha inicio" section="Orden" type="date" value={startDate} onChange={setStartDate} />
              <TextField id="ord-stop" name="stopDate" testId="field-order-stop-date" label="Fecha fin" section="Orden" type="date" value={stopDate} onChange={setStopDate} />
              <TextField id="ord-schedule" name="schedule" testId="field-order-schedule" label="Horario / programación" section="Orden" value={schedule} onChange={setSchedule} />
              <TextField id="ord-indication" name="indication" testId="field-order-indication" label="Indicación / razón clínica" section="Orden" value={indication} onChange={setIndication} />
            </div>
          </Section>

          <Section title="Órdenes rápidas (múltiples)" testId="section-quick-orders" actions={<Badge tone="blue">Separar por comas</Badge>}>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextAreaField id="ord-labs" name="labOrders" testId="field-lab-orders" label="Laboratorios" section="Órdenes rápidas" rows={3} value={labText} onChange={setLabText} placeholder="Hemograma, Química sanguínea, Troponina…" />
              <TextAreaField id="ord-imgs" name="imagingOrders" testId="field-imaging-orders" label="Imágenes" section="Órdenes rápidas" rows={3} value={imgText} onChange={setImgText} placeholder="Radiografía de tórax, Ecografía abdominal…" />
            </div>
          </Section>

          <Section title="Firma" testId="section-signature">
            <CheckboxField id="ord-sign" name="signature" testId="field-order-signature" label="Firmar al crear" section="Firma" description={`Responsable: ${userName}`} checked={sign} onChange={setSign} />
            <div className="mt-3 flex gap-2">
              <Button onClick={submit} data-testid="button-create-order"><Plus className="h-4 w-4" /> Crear orden(es)</Button>
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Conjuntos de órdenes (order sets)" testId="section-order-sets" actions={<Sparkles className="h-3.5 w-3.5 text-violet-500" />}>
            <div className="space-y-2">
              {ORDER_SETS.map((s) => (
                <div key={s.name} className="rounded-md border border-ink-200 p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink-800">{s.name}</span>
                    <Button size="sm" variant="subtle" onClick={() => addSet(s.name)} data-testid={`order-set-${s.name}`}>Agregar</Button>
                  </div>
                  <p className="mt-1 text-2xs text-ink-500">{s.orders.map((o) => o.name).join(" · ")}</p>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
