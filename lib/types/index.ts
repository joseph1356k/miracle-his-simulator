/**
 * Domain model for the Miracle Hospital HIS Simulator.
 *
 * This is a synthetic, test-only simulator. None of these structures represent
 * real patients or a certified clinical system. They are FHIR-inspired only as
 * a technical convenience for automation testing.
 */

export type ID = string;

/* ------------------------------------------------------------------ Roles - */

export type RoleId =
  | "emergency-physician"
  | "inpatient-physician"
  | "specialist"
  | "nurse"
  | "nurse-aide"
  | "admissions"
  | "lab"
  | "radiology"
  | "pharmacy"
  | "surgery"
  | "billing"
  | "clinical-auditor"
  | "it-admin"
  | "miracle-qa";

export interface Role {
  id: RoleId;
  label: string; // Spanish UI label
  shortLabel: string;
  description: string;
  /** Module keys this role can open, or "*" for everything. */
  modules: ModuleKey[] | "*";
  canSignNotes: boolean;
  canPrescribe: boolean;
  canAdminister: boolean;
  canBill: boolean;
}

/* -------------------------------------------------------------- Modules --- */

export type ModuleKey =
  | "dashboard"
  | "clinical-inbox"
  | "patients"
  | "patient-registration"
  | "admissions"
  | "emergency"
  | "outpatient"
  | "inpatient"
  | "icu"
  | "nursing"
  | "documentation"
  | "orders"
  | "lab"
  | "imaging"
  | "pharmacy"
  | "medications"
  | "surgery"
  | "referrals"
  | "discharge"
  | "billing"
  | "inventory"
  | "reports"
  | "audit"
  | "interoperability"
  | "settings"
  | "miracle-test-lab";

/* ------------------------------------------------------------- Patients --- */

export type Sex = "M" | "F" | "Other";
export type BloodType =
  | "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
export type DocumentType = "CC" | "TI" | "CE" | "RC" | "PA" | "MS";
export type IsolationStatus =
  | "none" | "contacto" | "gotas" | "aereo" | "protector";
export type CodeStatus = "full" | "dnr" | "limitado";

export type RiskFlag =
  | "caida"
  | "infeccioso"
  | "alergia"
  | "anticoagulado"
  | "sepsis"
  | "cardiovascular"
  | "ulcera-presion"
  | "suicida"
  | "broncoaspiracion";

export interface Allergy {
  id: ID;
  substance: string;
  type: "medicamento" | "alimento" | "ambiental" | "otro";
  reaction: string;
  severity: "leve" | "moderada" | "severa";
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Patient {
  id: ID;
  recordNumber: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string;
  sex: Sex;
  gender?: string;
  bloodType?: BloodType;
  allergies: Allergy[];
  eps: string;
  plan?: string;
  phone: string;
  email?: string;
  address: string;
  neighborhood?: string;
  city: string;
  department: string;
  country: string;
  occupation?: string;
  emergencyContact: EmergencyContact;
  consent: { informedConsent: boolean; habeasData: boolean };
  privacyFlags: string[];
  riskFlags: RiskFlag[];
  codeStatus: CodeStatus;
  isolation: IsolationStatus;
  createdAt: string;
}

/* ----------------------------------------------------------- Encounters --- */

export type EncounterType =
  | "emergency" | "outpatient" | "inpatient" | "icu" | "surgery";
export type EncounterStatus =
  | "waiting"
  | "in-progress"
  | "observation"
  | "admitted"
  | "scheduled"
  | "discharged"
  | "closed";

export interface TriageRecord {
  level: 1 | 2 | 3 | 4 | 5;
  arrivalTime: string;
  waitMinutes: number;
  assignedBox?: string;
  painScale?: number;
  consciousness?: string;
  nurse?: string;
}

export interface Encounter {
  id: ID;
  patientId: ID;
  type: EncounterType;
  status: EncounterStatus;
  reason: string;
  startedAt: string;
  endedAt?: string;
  ward?: string;
  bed?: string;
  location?: string;
  attendingPhysician: string;
  specialty?: string;
  eps: string;
  triage?: TriageRecord;
  admissionDiagnosis?: string;
  diagnoses: ID[];
}

/* ---------------------------------------------------------- VitalSigns ---- */

export interface VitalSigns {
  id: ID;
  encounterId: ID;
  patientId: ID;
  recordedAt: string;
  recordedBy: string;
  recordedByRole: RoleId;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  systolic?: number;
  diastolic?: number;
  spo2?: number;
  oxygenSupport?: string;
  painScale?: number;
  glucose?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  glasgow?: number;
  neuroStatus?: string;
  comments?: string;
}

/* ---------------------------------------------------------- Diagnoses ----- */

export type DiagnosisKind =
  | "principal" | "relacionado" | "complicacion" | "sospecha";
export type DiagnosisStatus = "presuntivo" | "confirmado" | "descartado";

export interface Diagnosis {
  id: ID;
  encounterId: ID;
  patientId: ID;
  code: string;
  label: string;
  kind: DiagnosisKind;
  status: DiagnosisStatus;
  recordedAt: string;
  recordedBy: string;
}

/* ------------------------------------------------------- Clinical notes --- */

export type NoteType =
  | "initial"
  | "progress"
  | "emergency"
  | "nursing"
  | "interconsult"
  | "procedure"
  | "epicrisis"
  | "certificate"
  | "incapacity"
  | "structured";

export interface ClinicalNote {
  id: ID;
  encounterId: ID;
  patientId: ID;
  type: NoteType;
  title: string;
  status: "draft" | "signed";
  author: string;
  authorRole: RoleId;
  createdAt: string;
  signedAt?: string;
  sections?: Record<string, string>;
  body?: string;
}

/* -------------------------------------------------------------- Orders ---- */

export type OrderCategory =
  | "laboratory"
  | "imaging"
  | "medication"
  | "nursing"
  | "diet"
  | "procedure"
  | "interconsultation"
  | "therapy"
  | "blood-bank"
  | "isolation"
  | "monitoring"
  | "discharge";

export type OrderStatus =
  | "draft" | "signed" | "sent" | "in-progress" | "completed" | "cancelled" | "rejected";
export type OrderPriority = "rutina" | "prioritario" | "urgente" | "stat";

export interface Order {
  id: ID;
  encounterId: ID;
  patientId: ID;
  category: OrderCategory;
  name: string;
  detail?: string;
  priority: OrderPriority;
  indication?: string;
  frequency?: string;
  schedule?: string;
  startDate?: string;
  stopDate?: string;
  status: OrderStatus;
  orderedBy: string;
  orderedByRole: RoleId;
  createdAt: string;
  signedAt?: string;
  flags: string[];
}

/* --------------------------------------------------------- Medications ---- */

export type MedicationSource = "home" | "active" | "discharge";

export interface MarEntry {
  id: ID;
  time: string;
  status: "pending" | "administered" | "omitted" | "held";
  administeredBy?: string;
  omittedReason?: string;
}

export interface MedicationOrder {
  id: ID;
  encounterId: ID;
  patientId: ID;
  medicationName: string;
  genericName?: string;
  dose: string;
  unit: string;
  route: string;
  frequency: string;
  duration?: string;
  indication?: string;
  startDate?: string;
  stopDate?: string;
  source: MedicationSource;
  prescriber: string;
  validationStatus: "pending" | "validated" | "rejected";
  flags: string[];
  schedule: MarEntry[];
  /** Cuándo farmacia lo dispensó (ISO). Sin dispensar: undefined. */
  dispensedAt?: string;
  /** Quién lo dispensó. */
  dispensedBy?: string;
}

/* -------------------------------------------------------- Laboratory ------ */

export type LabFlag = "normal" | "alto" | "bajo" | "critico";

export interface LabResultItem {
  test: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag: LabFlag;
}

export type LabStatus =
  | "ordered" | "collected" | "processing" | "resulted" | "acknowledged" | "cancelled";

export interface LabOrder {
  id: ID;
  encounterId: ID;
  patientId: ID;
  panel: string;
  priority: OrderPriority;
  status: LabStatus;
  orderedBy: string;
  orderedAt: string;
  sampleId?: string;
  sampleTime?: string;
  resultTime?: string;
  responsible?: string;
  results?: LabResultItem[];
  acknowledgedBy?: string;
}

/* ----------------------------------------------------------- Imaging ------ */

export type Modality =
  | "Rayos X"
  | "Ecografía"
  | "TAC"
  | "Resonancia magnética"
  | "Medicina nuclear"
  | "Mamografía"
  | "Fluoroscopia";

export type ImagingStatus =
  | "ordered" | "scheduled" | "acquired" | "preliminary" | "final" | "cancelled";

export interface ImagingReport {
  indication: string;
  technique: string;
  findings: string;
  impression: string;
  recommendations?: string;
  criticalCommunication?: string;
  radiologist: string;
  status: "preliminary" | "final";
  reportedAt: string;
}

export interface ImagingOrder {
  id: ID;
  encounterId: ID;
  patientId: ID;
  modality: Modality;
  study: string;
  bodyPart?: string;
  priority: OrderPriority;
  status: ImagingStatus;
  orderedBy: string;
  orderedAt: string;
  criticalFinding: boolean;
  report?: ImagingReport;
}

/* ------------------------------------------------------- Nursing tasks ---- */

export interface NursingTask {
  id: ID;
  encounterId: ID;
  patientId: ID;
  type: string;
  description: string;
  due: string;
  priority: OrderPriority;
  status: "pending" | "in-progress" | "done" | "overdue";
  assignedTo?: string;
}

/* ----------------------------------------------------------- Surgery ------ */

export type SurgeryStatus =
  | "scheduled" | "pre-op" | "in-progress" | "recovery" | "completed" | "cancelled";

export interface SurgeryCase {
  id: ID;
  patientId: ID;
  encounterId?: ID;
  procedure: string;
  surgeon: string;
  room: string;
  scheduledAt: string;
  durationMin: number;
  status: SurgeryStatus;
  anesthesia?: string;
  preopDiagnosis?: string;
  postopDiagnosis?: string;
  consentSigned: boolean;
  safetyChecklistDone: boolean;
}

/* ----------------------------------------------------------- Referrals ---- */

export interface Referral {
  id: ID;
  patientId: ID;
  encounterId: ID;
  kind: "interconsulta" | "remision";
  specialty: string;
  reason: string;
  priority: OrderPriority;
  status: "requested" | "accepted" | "rejected" | "answered";
  requestedBy: string;
  requestedAt: string;
  response?: string;
}

/* ------------------------------------------------------------ Billing ----- */

export type AuthorizationStatus =
  | "pending" | "approved" | "denied" | "docs-required";

export interface Authorization {
  id: ID;
  patientId: ID;
  encounterId: ID;
  eps: string;
  service: string;
  status: AuthorizationStatus;
  requestedAt: string;
  number?: string;
  delayHours: number;
  notes?: string;
}

export interface InvoiceItem {
  code: string;
  description: string;
  qty: number;
  unitPrice: number;
}

export interface BillingCase {
  id: ID;
  patientId: ID;
  encounterId: ID;
  eps: string;
  status: "open" | "submitted" | "glossed" | "paid";
  items: InvoiceItem[];
  copay: number;
  authorizations: ID[];
}

/* ---------------------------------------------------------- Inventory ----- */

export interface InventoryItem {
  id: ID;
  name: string;
  category: "medicamento" | "insumo-quirurgico" | "insumo-lab" | "stock-piso";
  stock: number;
  min: number;
  unit: string;
  lot: string;
  expiry: string;
  supplier: string;
  location: string;
  /** Medicamento de control especial (Fondo Nacional de Estupefacientes). */
  controlled?: boolean;
  /** Costo unitario en COP. */
  unitCost?: number;
}

/* -------------------------------------------------------------- Audit ----- */

export interface AuditEvent {
  id: ID;
  timestamp: string;
  actor: string;
  actorRole: RoleId;
  action: string;
  module: string;
  entity: string;
  patientId?: ID;
  encounterId?: ID;
  field?: string;
  previousValue?: string;
  newValue?: string;
  session: string;
  device: string;
}

/* ------------------------------------------------------------- Miracle ---- */

export interface FieldMapping {
  key: string;
  label: string;
  expected: string;
  testId?: string;
  section?: string;
}

export interface MiracleScenario {
  id: ID;
  title: string;
  category: string;
  targetModule: ModuleKey;
  targetRoute: string;
  patientId?: ID;
  difficulty: "basic" | "intermediate" | "advanced";
  transcript: string;
  expectedFields: FieldMapping[];
  expectedOrders: string[];
  expectedDiagnoses: string[];
  expectedMedications: string[];
}

/** Runtime registration captured by the field registry for the debug overlay. */
export interface RegisteredField {
  testId: string;
  domId: string;
  label: string;
  section: string;
  route: string;
  type: string;
  required: boolean;
  value: string;
}

/* ----------------------------------------------------------- Catalogs ----- */

export interface Cie10Item {
  code: string;
  label: string;
}

export interface MedicationCatalogItem {
  name: string;
  generic: string;
  forms: string[];
  routes: string[];
}

export interface LabCatalogTest {
  test: string;
  unit: string;
  referenceRange: string;
}

export interface LabCatalogItem {
  panel: string;
  tests: LabCatalogTest[];
}

/** The full synthetic dataset persisted in local state. */
export interface HospitalDataset {
  patients: Patient[];
  encounters: Encounter[];
  vitals: VitalSigns[];
  diagnoses: Diagnosis[];
  notes: ClinicalNote[];
  orders: Order[];
  medications: MedicationOrder[];
  labs: LabOrder[];
  imaging: ImagingOrder[];
  nursingTasks: NursingTask[];
  surgeries: SurgeryCase[];
  referrals: Referral[];
  authorizations: Authorization[];
  billing: BillingCase[];
  inventory: InventoryItem[];
  audit: AuditEvent[];
}
