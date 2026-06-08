"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Scissors, FileSignature } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/app-shell/PageHeader";
import { Section } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TextField, TextAreaField, SelectField, CheckboxField } from "@/components/ui/Field";
import { useHospital } from "@/lib/store/useHospital";
import { useSession } from "@/lib/store/useSession";
import { useUI } from "@/lib/store/useUI";
import { genId } from "@/lib/utils/id";
import { nowIso, fullName } from "@/lib/utils/format";
import { surgeryStatusMeta } from "@/lib/utils/status";

export default function SurgeryCasePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const data = useHospital((s) => s.data);
  const addNote = useHospital((s) => s.addNote);
  const setSurgeryStatus = useHospital((s) => s.setSurgeryStatus);
  const { userName, roleId } = useSession();
  const selectPatient = useSession((s) => s.selectPatient);
  const addToast = useUI((s) => s.addToast);

  const sx = data.surgeries.find((s) => s.id === params.id);
  const patient = data.patients.find((p) => p.id === sx?.patientId);
  useEffect(() => { if (sx) selectPatient(sx.patientId); }, [sx, selectPatient]);

  const [f, setF] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState({ fasting: false, consent: sx?.consentSigned ?? false, site: false, prophylaxis: false, blood: false, signIn: false, timeOut: false, signOut: false });
  const upd = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => { if (sx) setF((s) => ({ ...s, preopDx: sx.preopDiagnosis ?? "", procedure: sx.procedure, surgeon: sx.surgeon, anesthesiaType: sx.anesthesia ?? "" })); }, [sx]);

  if (!sx || !patient) return <PageContainer><p className="text-sm text-ink-500">Caso quirúrgico no encontrado.</p></PageContainer>;

  const save = () => {
    addNote({
      id: genId("note"), encounterId: sx.encounterId ?? "sin-encuentro", patientId: patient.id, type: "procedure", title: "Nota operatoria",
      status: "signed", author: userName, authorRole: roleId, createdAt: nowIso(), signedAt: nowIso(),
      sections: {
        "Diagnóstico preoperatorio": f.preopDx ?? "", "Diagnóstico postoperatorio": f.postopDx ?? "", "Procedimiento realizado": f.procedure ?? "",
        Cirujano: f.surgeon ?? "", Ayudantes: f.assistants ?? "", "Tipo de anestesia": f.anesthesiaType ?? "",
        "Hora de incisión": f.incisionTime ?? "", "Hora de cierre": f.closingTime ?? "", Hallazgos: f.findings ?? "",
        Complicaciones: f.complications ?? "", "Sangrado estimado": f.bloodLoss ?? "", Especímenes: f.specimens ?? "",
        "Implantes / materiales": f.implants ?? "", "Plan postoperatorio": f.postopPlan ?? "",
      },
    });
    setSurgeryStatus(sx.id, "recovery");
    addToast({ title: "Nota operatoria firmada", variant: "success" });
    router.push("/surgery");
  };

  return (
    <PageContainer>
      <PageHeader title={`Caso quirúrgico · ${sx.procedure}`} description={`${fullName(patient)} · ${sx.room}`} icon={<Scissors className="h-5 w-5" />} badge={<Badge tone={surgeryStatusMeta(sx.status).tone}>{surgeryStatusMeta(sx.status).label}</Badge>} actions={<Button onClick={save} data-testid="button-sign-operative-note"><FileSignature className="h-4 w-4" /> Firmar nota</Button>} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Nota operatoria" testId="section-operative-note">
            <div className="grid gap-3 sm:grid-cols-2">
              <TextField id="op-predx" name="preopDx" testId="field-op-preop-diagnosis" label="Diagnóstico preoperatorio" section="Nota operatoria" value={f.preopDx ?? ""} onChange={(v) => upd("preopDx", v)} />
              <TextField id="op-postdx" name="postopDx" testId="field-op-postop-diagnosis" label="Diagnóstico postoperatorio" section="Nota operatoria" value={f.postopDx ?? ""} onChange={(v) => upd("postopDx", v)} />
              <TextField id="op-proc" name="procedure" testId="field-op-procedure" label="Procedimiento realizado" section="Nota operatoria" value={f.procedure ?? ""} onChange={(v) => upd("procedure", v)} />
              <TextField id="op-surgeon" name="surgeon" testId="field-op-surgeon" label="Cirujano" section="Nota operatoria" value={f.surgeon ?? ""} onChange={(v) => upd("surgeon", v)} />
              <TextField id="op-assist" name="assistants" testId="field-op-assistants" label="Ayudantes" section="Nota operatoria" value={f.assistants ?? ""} onChange={(v) => upd("assistants", v)} />
              <SelectField id="op-anes" name="anesthesiaType" testId="field-op-anesthesia" label="Tipo de anestesia" section="Nota operatoria" value={f.anesthesiaType ?? ""} onChange={(v) => upd("anesthesiaType", v)} options={["General", "Raquídea", "Epidural", "Local", "Sedación"]} placeholder="Seleccionar" />
              <TextField id="op-inc" name="incisionTime" testId="field-op-incision-time" label="Hora de incisión" section="Nota operatoria" type="time" value={f.incisionTime ?? ""} onChange={(v) => upd("incisionTime", v)} />
              <TextField id="op-close" name="closingTime" testId="field-op-closing-time" label="Hora de cierre" section="Nota operatoria" type="time" value={f.closingTime ?? ""} onChange={(v) => upd("closingTime", v)} />
              <TextAreaField id="op-find" name="findings" testId="field-op-findings" label="Hallazgos" section="Nota operatoria" rows={2} value={f.findings ?? ""} onChange={(v) => upd("findings", v)} containerClassName="sm:col-span-2" />
              <TextField id="op-comp" name="complications" testId="field-op-complications" label="Complicaciones" section="Nota operatoria" value={f.complications ?? ""} onChange={(v) => upd("complications", v)} />
              <TextField id="op-blood" name="bloodLoss" testId="field-op-blood-loss" label="Sangrado estimado (cc)" section="Nota operatoria" inputMode="numeric" value={f.bloodLoss ?? ""} onChange={(v) => upd("bloodLoss", v)} />
              <TextField id="op-spec" name="specimens" testId="field-op-specimens" label="Especímenes a patología" section="Nota operatoria" value={f.specimens ?? ""} onChange={(v) => upd("specimens", v)} />
              <TextField id="op-impl" name="implants" testId="field-op-implants" label="Implantes / materiales" section="Nota operatoria" value={f.implants ?? ""} onChange={(v) => upd("implants", v)} />
              <TextAreaField id="op-plan" name="postopPlan" testId="field-op-postop-plan" label="Plan postoperatorio" section="Nota operatoria" rows={2} value={f.postopPlan ?? ""} onChange={(v) => upd("postopPlan", v)} containerClassName="sm:col-span-2" />
            </div>
          </Section>
        </div>

        <div className="space-y-4">
          <Section title="Verificación preoperatoria" testId="section-preop-checklist">
            <div className="space-y-2">
              <CheckboxField id="ck-fast" name="fasting" testId="field-checklist-fasting" label="Ayuno confirmado" section="Preoperatorio" checked={checks.fasting} onChange={(v) => setChecks((c) => ({ ...c, fasting: v }))} />
              <CheckboxField id="ck-consent" name="consent" testId="field-checklist-surgery-consent" label="Consentimiento firmado" section="Preoperatorio" checked={checks.consent} onChange={(v) => setChecks((c) => ({ ...c, consent: v }))} />
              <CheckboxField id="ck-site" name="site" testId="field-checklist-site" label="Sitio quirúrgico marcado" section="Preoperatorio" checked={checks.site} onChange={(v) => setChecks((c) => ({ ...c, site: v }))} />
              <CheckboxField id="ck-prophy" name="prophylaxis" testId="field-checklist-prophylaxis" label="Profilaxis antibiótica" section="Preoperatorio" checked={checks.prophylaxis} onChange={(v) => setChecks((c) => ({ ...c, prophylaxis: v }))} />
              <CheckboxField id="ck-blood" name="blood" testId="field-checklist-blood" label="Disponibilidad de sangre" section="Preoperatorio" checked={checks.blood} onChange={(v) => setChecks((c) => ({ ...c, blood: v }))} />
            </div>
          </Section>
          <Section title="Lista de verificación de seguridad" testId="section-safety-checklist">
            <div className="space-y-2">
              <CheckboxField id="ck-in" name="signIn" testId="field-checklist-sign-in" label="Entrada (sign in)" section="Seguridad" checked={checks.signIn} onChange={(v) => setChecks((c) => ({ ...c, signIn: v }))} />
              <CheckboxField id="ck-timeout" name="timeOut" testId="field-checklist-time-out" label="Pausa quirúrgica (time out)" section="Seguridad" checked={checks.timeOut} onChange={(v) => setChecks((c) => ({ ...c, timeOut: v }))} />
              <CheckboxField id="ck-out" name="signOut" testId="field-checklist-sign-out" label="Salida (sign out)" section="Seguridad" checked={checks.signOut} onChange={(v) => setChecks((c) => ({ ...c, signOut: v }))} />
            </div>
          </Section>
        </div>
      </div>
    </PageContainer>
  );
}
