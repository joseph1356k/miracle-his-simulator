import {
  CIE10_CATALOG,
  EPS_LIST,
  LAB_CATALOG,
  MEDICATION_CATALOG,
  SPECIALTIES,
  WARDS,
} from "@/lib/data/catalogs";
import type {
  Allergy,
  Authorization,
  AuditEvent,
  BillingCase,
  ClinicalNote,
  Diagnosis,
  Encounter,
  HospitalDataset,
  ImagingOrder,
  InventoryItem,
  LabOrder,
  LabResultItem,
  MedicationOrder,
  NursingTask,
  Patient,
  Referral,
  RiskFlag,
  RoleId,
  SurgeryCase,
  VitalSigns,
} from "@/lib/types";

/* --------------------------------------------------------- deterministic RNG */

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------- name pools -- */

const FIRST_M = ["Juan", "Carlos", "Andrés", "Santiago", "Felipe", "Sebastián", "David", "Mateo", "Jorge", "Luis", "Camilo", "Daniel", "Julián", "Óscar", "Fernando", "Diego", "Alejandro", "Miguel", "Esteban", "Ricardo"];
const FIRST_F = ["María", "Luisa", "Valentina", "Sara", "Daniela", "Carolina", "Andrea", "Paula", "Laura", "Ana", "Catalina", "Juliana", "Manuela", "Isabella", "Gabriela", "Natalia", "Diana", "Sofía", "Camila", "Mariana"];
const LAST = ["Gómez", "Rodríguez", "Martínez", "García", "López", "Hernández", "Ramírez", "Torres", "Vargas", "Castro", "Ruiz", "Jiménez", "Moreno", "Rojas", "Álvarez", "Quintero", "Cardona", "Restrepo", "Ospina", "Zapata", "Mejía", "Arango", "Velásquez", "Henao", "Patiño"];

const CITIES: [string, string][] = [
  ["Medellín", "Antioquia"],
  ["Bogotá", "Cundinamarca"],
  ["Envigado", "Antioquia"],
  ["Bello", "Antioquia"],
  ["Itagüí", "Antioquia"],
  ["Rionegro", "Antioquia"],
  ["Cali", "Valle del Cauca"],
];
const NEIGHBORHOODS = ["Laureles", "El Poblado", "Belén", "Robledo", "Buenos Aires", "La América", "Castilla", "Aranjuez"];
const OCCUPATIONS = ["Docente", "Comerciante", "Ingeniero/a", "Ama de casa", "Estudiante", "Conductor", "Agricultor", "Pensionado/a", "Empleado/a", "Vendedor/a"];
const RELATIONSHIPS = ["Madre", "Padre", "Esposo/a", "Hijo/a", "Hermano/a", "Amigo/a"];
const BLOOD: Patient["bloodType"][] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const DOCTORS = ["Dr. Andrés Restrepo", "Dra. Catalina Mejía", "Dr. Felipe Arango", "Dra. Juliana Patiño", "Dr. Óscar Henao", "Dra. Sara Ospina", "Dr. Camilo Zapata", "Dra. Natalia Cardona", "Dr. Daniel Quintero", "Dra. Paula Velásquez"];
const NURSES = ["Enf. Laura Gómez", "Enf. Mariana Ruiz", "Enf. Diego Torres", "Aux. Sofía Rojas", "Aux. Esteban Vargas"];
const ALLERGY_SUBS = ["Penicilina", "Sulfas", "AINES", "Mariscos", "Látex", "Yodo", "Dipirona"];
const RISK_FLAGS: RiskFlag[] = ["caida", "infeccioso", "alergia", "anticoagulado", "sepsis", "cardiovascular", "ulcera-presion"];
const REASONS_EMERGENCY = ["Dolor torácico", "Disnea", "Dolor abdominal", "Cefalea intensa", "Trauma por accidente", "Fiebre", "Vómito y diarrea", "Crisis hipertensiva", "Convulsión", "Dificultad respiratoria"];
const REASONS_OUTPATIENT = ["Control de hipertensión", "Control de diabetes", "Dolor lumbar", "Control prenatal", "Cefalea recurrente", "Evaluación cardiológica", "Control pediátrico", "Ansiedad", "Dolor articular", "Control nutricional"];

/* ----------------------------------------------------------------- helpers -- */

function pad(n: number, len = 3) {
  return String(n).padStart(len, "0");
}

export function buildSeed(now: number = Date.now()): HospitalDataset {
  const rng = mulberry32(20260607);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];
  const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const chance = (p: number) => rng() < p;
  const minsAgo = (m: number) => new Date(now - m * 60000).toISOString();
  const hoursAgo = (h: number) => minsAgo(h * 60);
  const daysAgo = (d: number) => minsAgo(d * 1440);
  const inHours = (h: number) => new Date(now + h * 3600000).toISOString();

  const patients: Patient[] = [];
  const encounters: Encounter[] = [];
  const vitals: VitalSigns[] = [];
  const diagnoses: Diagnosis[] = [];
  const notes: ClinicalNote[] = [];
  const orders: HospitalDataset["orders"] = [];
  const medications: MedicationOrder[] = [];
  const labs: LabOrder[] = [];
  const imaging: ImagingOrder[] = [];
  const nursingTasks: NursingTask[] = [];
  const surgeries: SurgeryCase[] = [];
  const referrals: Referral[] = [];
  const authorizations: Authorization[] = [];
  const billing: BillingCase[] = [];
  const inventory: InventoryItem[] = [];
  const audit: AuditEvent[] = [];

  /* ---- 50 patients ---- */
  for (let i = 1; i <= 50; i++) {
    const sex = chance(0.5) ? "M" : "F";
    const first = sex === "M" ? pick(FIRST_M) : pick(FIRST_F);
    const last = `${pick(LAST)} ${pick(LAST)}`;
    const age = int(1, 92);
    const birthDate = new Date(now - age * 365.25 * 86400000 - int(0, 364) * 86400000).toISOString().slice(0, 10);
    const [city, department] = pick(CITIES);
    const allergies: Allergy[] = [];
    const nAllergies = chance(0.4) ? int(1, 2) : 0;
    for (let a = 0; a < nAllergies; a++) {
      allergies.push({
        id: `alg-${pad(i)}-${a}`,
        substance: pick(ALLERGY_SUBS),
        type: pick(["medicamento", "alimento", "ambiental"] as const),
        reaction: pick(["Urticaria", "Anafilaxia", "Edema", "Broncoespasmo", "Rash cutáneo"]),
        severity: pick(["leve", "moderada", "severa"] as const),
      });
    }
    const riskFlags: RiskFlag[] = [];
    if (chance(0.35)) riskFlags.push(pick(RISK_FLAGS));
    if (chance(0.15)) riskFlags.push(pick(RISK_FLAGS));
    const docType = age < 7 ? "RC" : age < 18 ? "TI" : "CC";

    patients.push({
      id: `pat-${pad(i)}`,
      recordNumber: `HC-${pad(100000 + i * 37, 6)}`,
      documentType: docType,
      documentNumber: `${int(10000000, 1099999999)}`,
      firstName: first,
      lastName: last,
      birthDate,
      sex,
      gender: sex === "M" ? "Masculino" : "Femenino",
      bloodType: pick(BLOOD),
      allergies,
      eps: pick(EPS_LIST),
      plan: chance(0.3) ? "Plan Complementario Andino" : "Plan básico",
      phone: `3${int(0, 2)}${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      email: chance(0.6) ? `${first.toLowerCase()}.${pick(LAST).toLowerCase()}@correo.demo` : undefined,
      address: `Cra ${int(1, 90)} # ${int(1, 90)}-${int(1, 99)}`,
      neighborhood: pick(NEIGHBORHOODS),
      city,
      department,
      country: "Colombia",
      occupation: pick(OCCUPATIONS),
      emergencyContact: {
        name: `${pick(FIRST_F)} ${pick(LAST)}`,
        relationship: pick(RELATIONSHIPS),
        phone: `31${int(0, 9)} ${int(100, 999)} ${int(1000, 9999)}`,
      },
      consent: { informedConsent: chance(0.85), habeasData: chance(0.9) },
      privacyFlags: chance(0.1) ? ["Paciente con restricción de visibilidad"] : [],
      riskFlags: Array.from(new Set(riskFlags)),
      codeStatus: chance(0.08) ? "dnr" : "full",
      isolation: chance(0.12) ? pick(["contacto", "gotas", "aereo"] as const) : "none",
      createdAt: daysAgo(int(1, 1200)),
    });
  }

  const physicianRole: RoleId = "emergency-physician";

  /* helper to register diagnoses on an encounter */
  function addDiagnoses(enc: Encounter, count: number, kindFirst: Diagnosis["kind"] = "principal") {
    const ids: string[] = [];
    for (let d = 0; d < count; d++) {
      const c = pick(CIE10_CATALOG);
      const id = `dx-${enc.id}-${d}`;
      diagnoses.push({
        id,
        encounterId: enc.id,
        patientId: enc.patientId,
        code: c.code,
        label: c.label,
        kind: d === 0 ? kindFirst : pick(["relacionado", "complicacion"] as const),
        status: pick(["presuntivo", "confirmado"] as const),
        recordedAt: enc.startedAt,
        recordedBy: enc.attendingPhysician,
      });
      ids.push(id);
    }
    enc.diagnoses = ids;
  }

  function addVitals(enc: Encounter, count: number) {
    for (let v = 0; v < count; v++) {
      const weight = int(45, 105);
      const heightCm = int(150, 188);
      vitals.push({
        id: `vit-${enc.id}-${v}`,
        encounterId: enc.id,
        patientId: enc.patientId,
        recordedAt: minsAgo(int(5, 60) + v * 240),
        recordedBy: pick(NURSES),
        recordedByRole: "nurse",
        temperature: Number((36 + rng() * 3).toFixed(1)),
        heartRate: int(55, 130),
        respiratoryRate: int(12, 30),
        systolic: int(95, 175),
        diastolic: int(55, 105),
        spo2: int(86, 100),
        oxygenSupport: chance(0.3) ? pick(["Cánula nasal 2L", "Venturi 35%", "Máscara reservorio"]) : "Ambiente",
        painScale: int(0, 10),
        glucose: int(70, 240),
        weight,
        height: heightCm,
        bmi: Number((weight / Math.pow(heightCm / 100, 2)).toFixed(1)),
        glasgow: chance(0.2) ? int(8, 15) : 15,
        neuroStatus: pick(["Alerta", "Somnoliento", "Orientado", "Confuso"]),
        comments: chance(0.3) ? "Paciente estable, sin signos de alarma." : undefined,
      });
    }
  }

  /* ---- emergency encounters (15 active) ---- */
  for (let i = 1; i <= 15; i++) {
    const p = patients[(i * 3) % patients.length];
    const enc: Encounter = {
      id: `enc-emg-${pad(i)}`,
      patientId: p.id,
      type: "emergency",
      status: pick(["waiting", "in-progress", "observation"] as const),
      reason: pick(REASONS_EMERGENCY),
      startedAt: minsAgo(int(10, 600)),
      attendingPhysician: pick(DOCTORS),
      eps: p.eps,
      diagnoses: [],
      triage: {
        level: pick([1, 2, 3, 4, 5] as const),
        arrivalTime: minsAgo(int(10, 600)),
        waitMinutes: int(5, 180),
        assignedBox: `Box ${int(1, 12)}`,
        painScale: int(0, 10),
        consciousness: pick(["Alerta", "Somnoliento", "Estuporoso"]),
        nurse: pick(NURSES),
      },
    };
    encounters.push(enc);
    addDiagnoses(enc, int(1, 2), "sospecha");
    addVitals(enc, int(1, 3));
  }

  /* ---- outpatient encounters (20) ---- */
  for (let i = 1; i <= 20; i++) {
    const p = patients[(i * 5 + 2) % patients.length];
    const enc: Encounter = {
      id: `enc-out-${pad(i)}`,
      patientId: p.id,
      type: "outpatient",
      status: pick(["scheduled", "in-progress"] as const),
      reason: pick(REASONS_OUTPATIENT),
      startedAt: chance(0.5) ? inHours(int(1, 72)) : hoursAgo(int(1, 6)),
      attendingPhysician: pick(DOCTORS),
      specialty: pick(SPECIALTIES),
      eps: p.eps,
      diagnoses: [],
    };
    encounters.push(enc);
    addDiagnoses(enc, 1, "principal");
  }

  /* ---- inpatient encounters (25) ---- */
  for (let i = 1; i <= 25; i++) {
    const p = patients[(i * 7 + 1) % patients.length];
    const ward = pick(WARDS.filter((w) => !w.includes("UCI")));
    const enc: Encounter = {
      id: `enc-inp-${pad(i)}`,
      patientId: p.id,
      type: "inpatient",
      status: "admitted",
      reason: pick(REASONS_EMERGENCY),
      startedAt: daysAgo(int(1, 14)),
      ward,
      bed: `${ward.split(" ")[0].slice(0, 3).toUpperCase()}-${int(101, 540)}`,
      location: ward,
      attendingPhysician: pick(DOCTORS),
      eps: p.eps,
      admissionDiagnosis: pick(CIE10_CATALOG).label,
      diagnoses: [],
    };
    encounters.push(enc);
    addDiagnoses(enc, int(1, 3), "principal");
    addVitals(enc, int(1, 2));
  }

  /* ---- ICU encounters (8) ---- */
  for (let i = 1; i <= 8; i++) {
    const p = patients[(i * 11 + 4) % patients.length];
    const enc: Encounter = {
      id: `enc-icu-${pad(i)}`,
      patientId: p.id,
      type: "icu",
      status: "admitted",
      reason: pick(["Choque séptico", "Insuficiencia respiratoria", "Post-operatorio complejo", "Trauma severo"]),
      startedAt: daysAgo(int(1, 10)),
      ward: "UCI Adultos",
      bed: `UCI-${int(1, 14)}`,
      location: "UCI Adultos",
      attendingPhysician: pick(DOCTORS),
      eps: p.eps,
      admissionDiagnosis: pick(CIE10_CATALOG).label,
      diagnoses: [],
    };
    encounters.push(enc);
    addDiagnoses(enc, int(2, 3), "principal");
    addVitals(enc, int(2, 3));
  }

  const clinicalEncounters = encounters.filter(
    (e) => e.type === "emergency" || e.type === "inpatient" || e.type === "icu",
  );

  /* ---- 60 orders ---- */
  const orderCats = ["laboratory", "imaging", "medication", "nursing", "diet", "procedure", "monitoring", "interconsultation"] as const;
  for (let i = 1; i <= 60; i++) {
    const enc = clinicalEncounters[i % clinicalEncounters.length];
    const cat = pick(orderCats);
    const names: Record<string, string[]> = {
      laboratory: ["Hemograma", "Química sanguínea", "Troponina seriada", "PCR cuantitativa"],
      imaging: ["Radiografía de tórax", "TAC de cráneo simple", "Ecografía abdominal", "Resonancia de columna"],
      medication: ["Acetaminofén 1 g IV", "Dipirona 1 g IV", "Solución salina 0.9% 1000 mL", "Ceftriaxona 1 g IV"],
      nursing: ["Control de signos vitales c/4h", "Curación de herida", "Balance de líquidos", "Oxígeno por cánula 2L"],
      diet: ["Dieta blanda hiposódica", "Nada vía oral (NVO)", "Dieta para diabético"],
      procedure: ["Toma de gases arteriales", "Sondaje vesical", "Acceso venoso central"],
      monitoring: ["Monitoreo cardíaco continuo", "Saturometría continua", "Glucometría c/6h"],
      interconsultation: ["Interconsulta a Cardiología", "Interconsulta a Cirugía general", "Interconsulta a Nutrición"],
    };
    orders.push({
      id: `ord-${pad(i)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      category: cat,
      name: pick(names[cat]),
      detail: chance(0.4) ? "Según protocolo institucional." : undefined,
      priority: pick(["rutina", "prioritario", "urgente", "stat"] as const),
      indication: pick(["Dolor torácico", "Sospecha de infección", "Control evolutivo", "Estudio de extensión"]),
      frequency: chance(0.5) ? pick(["Cada 8 horas", "Dosis única", "Cada 12 horas"]) : undefined,
      startDate: minsAgo(int(10, 1440)),
      status: pick(["draft", "signed", "sent", "in-progress", "completed"] as const),
      orderedBy: enc.attendingPhysician,
      orderedByRole: physicianRole,
      createdAt: minsAgo(int(10, 1440)),
      signedAt: chance(0.7) ? minsAgo(int(5, 1400)) : undefined,
      flags: chance(0.15) ? [pick(["Posible duplicado", "Alerta de alergia (demo)"])] : [],
    });
  }

  /* ---- 40 medications with MAR ---- */
  for (let i = 1; i <= 40; i++) {
    const enc = clinicalEncounters[(i * 2) % clinicalEncounters.length];
    const med = pick(MEDICATION_CATALOG);
    const schedule = Array.from({ length: int(2, 4) }).map((_, k) => ({
      id: `mar-${pad(i)}-${k}`,
      time: minsAgo(int(0, 720) - k * 360 + 360),
      status: pick(["pending", "administered", "administered", "omitted"] as const),
      administeredBy: chance(0.6) ? pick(NURSES) : undefined,
      omittedReason: chance(0.15) ? pick(["Paciente en ayuno", "No disponible en piso", "Rechazo del paciente"]) : undefined,
    }));
    medications.push({
      id: `med-${pad(i)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      medicationName: med.name,
      genericName: med.generic,
      dose: pick(["500", "1", "40", "20", "100", "1000"]),
      unit: pick(["mg", "g", "mL", "UI"]),
      route: pick(med.routes),
      frequency: pick(["Cada 6 horas", "Cada 8 horas", "Cada 12 horas", "Cada 24 horas", "Dosis única"]),
      duration: pick(["3 días", "5 días", "7 días", "Mientras dure hospitalización"]),
      indication: pick(["Analgesia", "Antibioticoterapia", "Profilaxis", "Manejo de base"]),
      startDate: daysAgo(int(0, 5)),
      source: pick(["home", "active", "active", "discharge"] as const),
      prescriber: enc.attendingPhysician,
      validationStatus: pick(["pending", "validated", "validated"] as const),
      flags: chance(0.12) ? [pick(["Interacción potencial (demo)", "Verificar alergia (demo)"])] : [],
      schedule,
    });
  }

  /* ---- labs (40, mostly resulted) ---- */
  function genResult(panel: string): LabResultItem[] {
    const cat = LAB_CATALOG.find((c) => c.panel === panel);
    if (!cat) return [];
    return cat.tests.map((t) => {
      const range = t.referenceRange;
      let value = "";
      let flag: LabResultItem["flag"] = "normal";
      const numMatch = range.match(/([\d.]+)\s*-\s*([\d.]+)/);
      if (range.includes("Negativo")) {
        const positive = chance(0.2);
        value = positive ? "Positivo" : "Negativo";
        flag = positive ? "alto" : "normal";
      } else if (numMatch) {
        const lo = parseFloat(numMatch[1]);
        const hi = parseFloat(numMatch[2]);
        const roll = rng();
        if (roll < 0.7) value = (lo + rng() * (hi - lo)).toFixed(1);
        else if (roll < 0.85) {
          value = (hi + rng() * hi * 0.3).toFixed(1);
          flag = roll < 0.78 ? "alto" : "critico";
        } else {
          value = (Math.max(0, lo - rng() * lo * 0.3)).toFixed(1);
          flag = "bajo";
        }
      } else if (range.startsWith("<")) {
        const th = parseFloat(range.replace(/[^\d.]/g, "")) || 1;
        const high = chance(0.25);
        value = high ? (th * (1 + rng())).toFixed(2) : (th * rng() * 0.8).toFixed(2);
        flag = high ? "alto" : "normal";
      } else if (range.startsWith(">")) {
        const th = parseFloat(range.replace(/[^\d.]/g, "")) || 1;
        const low = chance(0.25);
        value = low ? (th * rng() * 0.8).toFixed(1) : (th * (1 + rng())).toFixed(1);
        flag = low ? "bajo" : "normal";
      } else {
        value = (rng() * 10).toFixed(1);
      }
      return { test: t.test, value, unit: t.unit, referenceRange: range, flag };
    });
  }
  for (let i = 1; i <= 40; i++) {
    const enc = clinicalEncounters[(i * 3) % clinicalEncounters.length];
    const panel = pick(LAB_CATALOG).panel;
    const status = pick(["ordered", "collected", "processing", "resulted", "resulted", "acknowledged"] as const);
    const resulted = status === "resulted" || status === "acknowledged";
    labs.push({
      id: `lab-${pad(i)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      panel,
      priority: pick(["rutina", "prioritario", "urgente", "stat"] as const),
      status,
      orderedBy: enc.attendingPhysician,
      orderedAt: hoursAgo(int(1, 48)),
      sampleId: `M${int(100000, 999999)}`,
      sampleTime: resulted ? hoursAgo(int(1, 24)) : undefined,
      resultTime: resulted ? hoursAgo(int(0, 12)) : undefined,
      responsible: resulted ? "Bact. Lina Gómez" : undefined,
      results: resulted ? genResult(panel) : undefined,
      acknowledgedBy: status === "acknowledged" ? enc.attendingPhysician : undefined,
    });
  }

  /* ---- imaging (25 with reports) ---- */
  const studies: Record<string, string[]> = {
    "Rayos X": ["Radiografía de tórax PA", "Radiografía de abdomen", "Radiografía de fémur"],
    Ecografía: ["Ecografía abdominal total", "Ecografía obstétrica", "Ecografía renal"],
    TAC: ["TAC de cráneo simple", "TAC de tórax contrastado", "TAC de abdomen"],
    "Resonancia magnética": ["RM de columna lumbar", "RM cerebral", "RM de rodilla"],
    "Medicina nuclear": ["Gammagrafía ósea", "Perfusión miocárdica"],
    Mamografía: ["Mamografía bilateral"],
    Fluoroscopia: ["Estudio fluoroscópico de deglución"],
  };
  const modalityKeys = Object.keys(studies) as (keyof typeof studies)[];
  for (let i = 1; i <= 25; i++) {
    const enc = clinicalEncounters[(i * 4) % clinicalEncounters.length];
    const modality = pick(modalityKeys);
    const study = pick(studies[modality]);
    const status = pick(["ordered", "scheduled", "acquired", "preliminary", "final", "final"] as const);
    const hasReport = status === "preliminary" || status === "final";
    const critical = chance(0.12);
    imaging.push({
      id: `img-${pad(i)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      modality: modality as ImagingOrder["modality"],
      study,
      bodyPart: study.split(" ").slice(-1)[0],
      priority: pick(["rutina", "prioritario", "urgente"] as const),
      status,
      orderedBy: enc.attendingPhysician,
      orderedAt: hoursAgo(int(1, 72)),
      criticalFinding: critical,
      report: hasReport
        ? {
            indication: pick(["Dolor torácico", "Trauma", "Sospecha de neumonía", "Estudio de extensión"]),
            technique: "Adquisición estándar según protocolo institucional.",
            findings: "Estructuras evaluadas sin alteraciones agudas significativas para este estudio demo.",
            impression: critical ? "Hallazgo crítico simulado: requiere comunicación urgente." : "Estudio dentro de límites normales (demo).",
            recommendations: "Correlacionar con la clínica. Documento demostrativo.",
            criticalCommunication: critical ? `Comunicado a ${enc.attendingPhysician} a las ${new Date(now).getHours()}:00.` : undefined,
            radiologist: pick(DOCTORS),
            status: status === "final" ? "final" : "preliminary",
            reportedAt: hoursAgo(int(0, 24)),
          }
        : undefined,
    });
  }

  /* ---- nursing tasks (30) ---- */
  const inpatientEnc = encounters.filter((e) => e.type === "inpatient" || e.type === "icu");
  for (let i = 1; i <= 30; i++) {
    const enc = inpatientEnc[i % inpatientEnc.length];
    nursingTasks.push({
      id: `ntask-${pad(i)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      type: pick(["Signos vitales", "Administración de medicamento", "Curación", "Toma de muestra", "Movilización", "Educación al paciente"]),
      description: pick(["Tomar signos vitales completos", "Administrar antibiótico programado", "Realizar curación de herida quirúrgica", "Recolectar muestra de laboratorio", "Cambio de posición", "Reforzar signos de alarma"]),
      due: chance(0.4) ? minsAgo(int(5, 90)) : inHours(int(1, 6)),
      priority: pick(["rutina", "prioritario", "urgente"] as const),
      status: pick(["pending", "in-progress", "done", "overdue"] as const),
      assignedTo: pick(NURSES),
    });
  }

  /* ---- surgeries (10) ---- */
  for (let i = 1; i <= 10; i++) {
    const enc = inpatientEnc[(i * 2) % inpatientEnc.length];
    surgeries.push({
      id: `sx-${pad(i)}`,
      patientId: enc.patientId,
      encounterId: enc.id,
      procedure: pick(["Apendicectomía", "Colecistectomía laparoscópica", "Osteosíntesis de fémur", "Cesárea", "Herniorrafia inguinal", "Drenaje de absceso"]),
      surgeon: pick(DOCTORS),
      room: `Quirófano ${int(1, 6)}`,
      scheduledAt: chance(0.5) ? inHours(int(1, 48)) : hoursAgo(int(1, 24)),
      durationMin: int(45, 240),
      status: pick(["scheduled", "pre-op", "in-progress", "recovery", "completed"] as const),
      anesthesia: pick(["General", "Raquídea", "Local", "Sedación"]),
      preopDiagnosis: pick(CIE10_CATALOG).label,
      postopDiagnosis: chance(0.5) ? pick(CIE10_CATALOG).label : undefined,
      consentSigned: chance(0.85),
      safetyChecklistDone: chance(0.7),
    });
  }

  /* ---- referrals (15) ---- */
  for (let i = 1; i <= 15; i++) {
    const enc = clinicalEncounters[(i * 5) % clinicalEncounters.length];
    referrals.push({
      id: `ref-${pad(i)}`,
      patientId: enc.patientId,
      encounterId: enc.id,
      kind: pick(["interconsulta", "remision"] as const),
      specialty: pick(SPECIALTIES),
      reason: pick(["Valoración por especialista", "Manejo conjunto", "Continuidad de atención", "Procedimiento no disponible"]),
      priority: pick(["rutina", "prioritario", "urgente"] as const),
      status: pick(["requested", "accepted", "answered", "rejected"] as const),
      requestedBy: enc.attendingPhysician,
      requestedAt: hoursAgo(int(1, 96)),
      response: chance(0.4) ? "Aceptado. Se programa valoración." : undefined,
    });
  }

  /* ---- authorizations (20) ---- */
  for (let i = 1; i <= 20; i++) {
    const enc = clinicalEncounters[(i * 6) % clinicalEncounters.length];
    authorizations.push({
      id: `auth-${pad(i)}`,
      patientId: enc.patientId,
      encounterId: enc.id,
      eps: enc.eps,
      service: pick(["Resonancia magnética", "Hospitalización", "Procedimiento quirúrgico", "Medicamento no POS", "TAC contrastado", "Interconsulta especializada"]),
      status: pick(["pending", "approved", "denied", "docs-required"] as const),
      requestedAt: hoursAgo(int(2, 120)),
      number: chance(0.5) ? `AUT-${int(100000, 999999)}` : undefined,
      delayHours: int(0, 96),
      notes: chance(0.3) ? "Pendiente soporte clínico adicional." : undefined,
    });
  }

  /* ---- billing cases (15) ---- */
  for (let i = 1; i <= 15; i++) {
    const enc = clinicalEncounters[(i * 8) % clinicalEncounters.length];
    const items = Array.from({ length: int(2, 5) }).map((_, k) => ({
      code: `SOAT-${int(1000, 9999)}`,
      description: pick(["Estancia hospitalaria día", "Consulta urgencias", "Laboratorio clínico", "Imagenología", "Medicamentos", "Insumos"]),
      qty: int(1, 4),
      unitPrice: int(20000, 480000),
    }));
    billing.push({
      id: `bill-${pad(i)}`,
      patientId: enc.patientId,
      encounterId: enc.id,
      eps: enc.eps,
      status: pick(["open", "submitted", "glossed", "paid"] as const),
      items,
      copay: chance(0.5) ? int(5000, 60000) : 0,
      authorizations: authorizations.filter((a) => a.encounterId === enc.id).map((a) => a.id),
    });
  }

  /* ---- inventory (30) ---- */
  const invNames: Record<InventoryItem["category"], string[]> = {
    medicamento: ["Acetaminofén 500 mg", "Dipirona 1 g amp", "Ceftriaxona 1 g vial", "Omeprazol 40 mg vial", "Enoxaparina 40 mg", "Solución salina 0.9% 500 mL"],
    "insumo-quirurgico": ["Sutura Vicryl 2-0", "Guantes estériles 7.5", "Compresas estériles", "Bisturí #11", "Malla de polipropileno"],
    "insumo-lab": ["Tubo tapa morada", "Tubo tapa roja", "Lanceta", "Tira de glucometría", "Frasco hemocultivo"],
    "stock-piso": ["Jeringa 5 mL", "Catéter #18", "Equipo de venoclisis", "Gasas no estériles", "Esparadrapo"],
  };
  const invCats = Object.keys(invNames) as InventoryItem["category"][];
  let invIdx = 1;
  for (const cat of invCats) {
    for (const name of invNames[cat]) {
      const stock = int(0, 400);
      const min = int(20, 80);
      inventory.push({
        id: `inv-${pad(invIdx++)}`,
        name,
        category: cat,
        stock,
        min,
        unit: pick(["unidad", "caja", "vial", "ampolla", "bolsa"]),
        lot: `L${int(10000, 99999)}`,
        expiry: new Date(now + int(15, 720) * 86400000).toISOString().slice(0, 10),
        supplier: pick(["Distribuidora Andina", "Farma Demo S.A.", "Insumos Médicos del Valle"]),
        location: pick(["Farmacia central", "Bodega quirúrgica", "Laboratorio", "Almacén general"]),
      });
    }
  }

  /* ---- a few seed clinical notes ---- */
  clinicalEncounters.slice(0, 12).forEach((enc, idx) => {
    notes.push({
      id: `note-${pad(idx + 1)}`,
      encounterId: enc.id,
      patientId: enc.patientId,
      type: enc.type === "emergency" ? "emergency" : "progress",
      title: enc.type === "emergency" ? "Nota de urgencias" : "Evolución médica",
      status: chance(0.6) ? "signed" : "draft",
      author: enc.attendingPhysician,
      authorRole: physicianRole,
      createdAt: minsAgo(int(30, 600)),
      signedAt: chance(0.6) ? minsAgo(int(10, 200)) : undefined,
      sections: {
        "Motivo de consulta": enc.reason,
        "Enfermedad actual": "Cuadro clínico de evolución descrita por el paciente. Texto demostrativo.",
        Análisis: "Paciente estable, se continúa manejo según evolución.",
        Plan: "Continuar tratamiento, solicitar paraclínicos y reevaluar.",
      },
    });
  });

  /* ---- 100 audit events ---- */
  const actions = ["create", "update", "sign", "administer", "acknowledge", "cancel", "validate", "export"];
  const entities = ["ClinicalNote", "Order", "MedicationOrder", "VitalSigns", "LabOrder", "ImagingOrder", "Diagnosis", "Authorization"];
  const roles: RoleId[] = ["emergency-physician", "inpatient-physician", "nurse", "lab", "radiology", "pharmacy", "billing"];
  for (let i = 1; i <= 100; i++) {
    const enc = clinicalEncounters[i % clinicalEncounters.length];
    const action = pick(actions);
    audit.push({
      id: `aud-${pad(i)}`,
      timestamp: minsAgo(int(1, 4320)),
      actor: pick([...DOCTORS, ...NURSES]),
      actorRole: pick(roles),
      action,
      module: pick(["emergency", "inpatient", "orders", "medications", "lab", "imaging", "nursing", "billing"]),
      entity: pick(entities),
      patientId: enc.patientId,
      encounterId: enc.id,
      field: chance(0.5) ? pick(["chiefComplaint", "diagnosis", "dose", "status", "vitalSigns"]) : undefined,
      previousValue: chance(0.4) ? "—" : undefined,
      newValue: chance(0.6) ? "Valor actualizado (demo)" : undefined,
      session: `sess-${int(1000, 9999)}`,
      device: pick(["Estación 12 - Urgencias", "Laptop hospitalización", "Tablet enfermería", "PC Laboratorio"]),
    });
  }
  audit.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));

  return {
    patients,
    encounters,
    vitals,
    diagnoses,
    notes,
    orders,
    medications,
    labs,
    imaging,
    nursingTasks,
    surgeries,
    referrals,
    authorizations,
    billing,
    inventory,
    audit,
  };
}
