import type {
  Cie10Item,
  LabCatalogItem,
  MedicationCatalogItem,
} from "@/lib/types";

/**
 * DEMO catalogs only. "Catálogo demo, no usar para atención real."
 * Synthetic, intentionally simplified — for UI/automation testing.
 */
export const CATALOG_DISCLAIMER = "Catálogo demo, no usar para atención real.";

export const CIE10_CATALOG: Cie10Item[] = [
  { code: "I10", label: "Hipertensión esencial (primaria)" },
  { code: "E11", label: "Diabetes mellitus tipo 2" },
  { code: "J45", label: "Asma" },
  { code: "R07.4", label: "Dolor torácico, no especificado" },
  { code: "J18", label: "Neumonía, microorganismo no especificado" },
  { code: "S72", label: "Fractura de fémur" },
  { code: "N39", label: "Infección de vías urinarias" },
  { code: "K35", label: "Apendicitis aguda" },
  { code: "O80", label: "Parto único espontáneo" },
  { code: "F41", label: "Otros trastornos de ansiedad" },
  { code: "I21", label: "Infarto agudo de miocardio" },
  { code: "J44", label: "Enfermedad pulmonar obstructiva crónica" },
  { code: "K29", label: "Gastritis y duodenitis" },
  { code: "A09", label: "Diarrea y gastroenteritis de presunto origen infeccioso" },
  { code: "R51", label: "Cefalea" },
  { code: "I50", label: "Insuficiencia cardíaca" },
  { code: "N17", label: "Insuficiencia renal aguda" },
  { code: "E86", label: "Depleción de volumen (deshidratación)" },
  { code: "J20", label: "Bronquitis aguda" },
  { code: "R10", label: "Dolor abdominal y pélvico" },
  { code: "S06", label: "Traumatismo intracraneal" },
  { code: "I63", label: "Infarto cerebral" },
  { code: "L03", label: "Celulitis" },
  { code: "R50", label: "Fiebre de origen desconocido" },
  { code: "E66", label: "Obesidad" },
  { code: "M54", label: "Dorsalgia / lumbago" },
  { code: "O20", label: "Hemorragia precoz del embarazo" },
  { code: "J96", label: "Insuficiencia respiratoria" },
  { code: "A41", label: "Sepsis, no especificada" },
  { code: "T14", label: "Traumatismo de región no especificada" },
];

export const MEDICATION_CATALOG: MedicationCatalogItem[] = [
  { name: "Losartán", generic: "Losartán potásico", forms: ["Tableta 50 mg", "Tableta 100 mg"], routes: ["Oral"] },
  { name: "Metformina", generic: "Metformina clorhidrato", forms: ["Tableta 850 mg", "Tableta 1000 mg"], routes: ["Oral"] },
  { name: "Acetaminofén", generic: "Paracetamol", forms: ["Tableta 500 mg", "Jarabe 150 mg/5 mL", "Ampolla 1 g/100 mL"], routes: ["Oral", "Intravenosa"] },
  { name: "Ibuprofeno", generic: "Ibuprofeno", forms: ["Tableta 400 mg", "Suspensión 100 mg/5 mL"], routes: ["Oral"] },
  { name: "Omeprazol", generic: "Omeprazol", forms: ["Cápsula 20 mg", "Vial 40 mg"], routes: ["Oral", "Intravenosa"] },
  { name: "Enoxaparina", generic: "Enoxaparina sódica", forms: ["Jeringa 40 mg", "Jeringa 60 mg"], routes: ["Subcutánea"] },
  { name: "Ceftriaxona", generic: "Ceftriaxona sódica", forms: ["Vial 1 g", "Vial 2 g"], routes: ["Intravenosa", "Intramuscular"] },
  { name: "Dipirona", generic: "Metamizol sódico", forms: ["Ampolla 1 g/2 mL", "Tableta 500 mg"], routes: ["Intravenosa", "Oral"] },
  { name: "Salbutamol", generic: "Salbutamol", forms: ["Inhalador 100 mcg", "Solución nebulizar 0.5%"], routes: ["Inhalada", "Nebulización"] },
  { name: "Amlodipino", generic: "Amlodipino besilato", forms: ["Tableta 5 mg", "Tableta 10 mg"], routes: ["Oral"] },
  { name: "Atorvastatina", generic: "Atorvastatina cálcica", forms: ["Tableta 20 mg", "Tableta 40 mg"], routes: ["Oral"] },
  { name: "Insulina cristalina", generic: "Insulina humana regular", forms: ["Vial 100 UI/mL"], routes: ["Subcutánea", "Intravenosa"] },
  { name: "Furosemida", generic: "Furosemida", forms: ["Ampolla 20 mg/2 mL", "Tableta 40 mg"], routes: ["Intravenosa", "Oral"] },
  { name: "Tramadol", generic: "Tramadol clorhidrato", forms: ["Ampolla 100 mg/2 mL", "Cápsula 50 mg"], routes: ["Intravenosa", "Oral"] },
  { name: "Morfina", generic: "Sulfato de morfina", forms: ["Ampolla 10 mg/mL"], routes: ["Intravenosa", "Subcutánea"] },
  { name: "Hidrocortisona", generic: "Hidrocortisona succinato", forms: ["Vial 100 mg", "Vial 500 mg"], routes: ["Intravenosa"] },
  { name: "Ampicilina/Sulbactam", generic: "Ampicilina + Sulbactam", forms: ["Vial 1.5 g", "Vial 3 g"], routes: ["Intravenosa"] },
  { name: "Clopidogrel", generic: "Clopidogrel bisulfato", forms: ["Tableta 75 mg"], routes: ["Oral"] },
  { name: "Ácido acetilsalicílico", generic: "ASA", forms: ["Tableta 100 mg", "Tableta 300 mg"], routes: ["Oral"] },
  { name: "Ondansetrón", generic: "Ondansetrón", forms: ["Ampolla 4 mg/2 mL", "Ampolla 8 mg/4 mL"], routes: ["Intravenosa"] },
  { name: "Vancomicina", generic: "Vancomicina clorhidrato", forms: ["Vial 500 mg", "Vial 1 g"], routes: ["Intravenosa"] },
  { name: "Norepinefrina", generic: "Norepinefrina bitartrato", forms: ["Ampolla 4 mg/4 mL"], routes: ["Intravenosa"] },
  { name: "Midazolam", generic: "Midazolam", forms: ["Ampolla 5 mg/5 mL", "Ampolla 15 mg/3 mL"], routes: ["Intravenosa"] },
  { name: "Fentanilo", generic: "Fentanilo citrato", forms: ["Ampolla 0.5 mg/10 mL"], routes: ["Intravenosa"] },
  { name: "Hidroclorotiazida", generic: "Hidroclorotiazida", forms: ["Tableta 25 mg"], routes: ["Oral"] },
];

export const LAB_CATALOG: LabCatalogItem[] = [
  {
    panel: "Hemograma",
    tests: [
      { test: "Hemoglobina", unit: "g/dL", referenceRange: "12.0 - 16.0" },
      { test: "Hematocrito", unit: "%", referenceRange: "36 - 46" },
      { test: "Leucocitos", unit: "10³/µL", referenceRange: "4.0 - 11.0" },
      { test: "Neutrófilos", unit: "%", referenceRange: "40 - 70" },
      { test: "Plaquetas", unit: "10³/µL", referenceRange: "150 - 400" },
    ],
  },
  {
    panel: "Química sanguínea",
    tests: [
      { test: "Glucosa", unit: "mg/dL", referenceRange: "70 - 100" },
      { test: "Creatinina", unit: "mg/dL", referenceRange: "0.6 - 1.3" },
      { test: "BUN", unit: "mg/dL", referenceRange: "7 - 20" },
      { test: "Sodio", unit: "mmol/L", referenceRange: "135 - 145" },
      { test: "Potasio", unit: "mmol/L", referenceRange: "3.5 - 5.1" },
    ],
  },
  {
    panel: "Perfil hepático",
    tests: [
      { test: "AST", unit: "U/L", referenceRange: "10 - 40" },
      { test: "ALT", unit: "U/L", referenceRange: "7 - 56" },
      { test: "Bilirrubina total", unit: "mg/dL", referenceRange: "0.1 - 1.2" },
      { test: "Fosfatasa alcalina", unit: "U/L", referenceRange: "44 - 147" },
      { test: "Albúmina", unit: "g/dL", referenceRange: "3.5 - 5.0" },
    ],
  },
  {
    panel: "Perfil lipídico",
    tests: [
      { test: "Colesterol total", unit: "mg/dL", referenceRange: "< 200" },
      { test: "LDL", unit: "mg/dL", referenceRange: "< 100" },
      { test: "HDL", unit: "mg/dL", referenceRange: "> 40" },
      { test: "Triglicéridos", unit: "mg/dL", referenceRange: "< 150" },
    ],
  },
  {
    panel: "Uroanálisis",
    tests: [
      { test: "pH urinario", unit: "", referenceRange: "5.0 - 8.0" },
      { test: "Densidad", unit: "", referenceRange: "1.005 - 1.030" },
      { test: "Leucocitos", unit: "/campo", referenceRange: "0 - 5" },
      { test: "Nitritos", unit: "", referenceRange: "Negativo" },
    ],
  },
  {
    panel: "Gases arteriales",
    tests: [
      { test: "pH", unit: "", referenceRange: "7.35 - 7.45" },
      { test: "pCO₂", unit: "mmHg", referenceRange: "35 - 45" },
      { test: "pO₂", unit: "mmHg", referenceRange: "80 - 100" },
      { test: "HCO₃", unit: "mmol/L", referenceRange: "22 - 26" },
      { test: "Lactato", unit: "mmol/L", referenceRange: "0.5 - 2.0" },
    ],
  },
  {
    panel: "Coagulación",
    tests: [
      { test: "PT", unit: "s", referenceRange: "11 - 13.5" },
      { test: "PTT", unit: "s", referenceRange: "25 - 35" },
      { test: "INR", unit: "", referenceRange: "0.8 - 1.2" },
    ],
  },
  {
    panel: "Troponina",
    tests: [{ test: "Troponina I", unit: "ng/mL", referenceRange: "< 0.04" }],
  },
  {
    panel: "PCR",
    tests: [{ test: "Proteína C reactiva", unit: "mg/L", referenceRange: "< 5" }],
  },
  {
    panel: "Cultivos",
    tests: [{ test: "Hemocultivo", unit: "", referenceRange: "Negativo" }],
  },
  {
    panel: "Pruebas infecciosas",
    tests: [{ test: "Antígeno respiratorio", unit: "", referenceRange: "Negativo" }],
  },
];

export const LAB_PANELS = LAB_CATALOG.map((p) => p.panel);

export const EPS_LIST = [
  "EPS Norte Salud",
  "EPS Vida Integral",
  "Plan Complementario Andino",
  "Medicina Prepagada Horizonte",
  "Particular",
  "SOAT Demo",
  "EPS Sur Confiar (demo)",
];

export const SPECIALTIES = [
  "Medicina general",
  "Medicina interna",
  "Cardiología",
  "Neurología",
  "Ortopedia",
  "Pediatría",
  "Ginecología",
  "Psiquiatría",
  "Fisioterapia",
  "Nutrición",
  "Cirugía general",
  "Anestesiología",
];

export const IMAGING_MODALITIES = [
  "Rayos X",
  "Ecografía",
  "TAC",
  "Resonancia magnética",
  "Medicina nuclear",
  "Mamografía",
  "Fluoroscopia",
] as const;

export const WARDS = [
  "Urgencias",
  "Medicina Interna 3° piso",
  "Medicina Interna 4° piso",
  "Cirugía 5° piso",
  "Pediatría 2° piso",
  "Ginecobstetricia",
  "UCI Adultos",
  "UCI Intermedios",
];

export const ORDER_ROUTES = [
  "Oral",
  "Intravenosa",
  "Intramuscular",
  "Subcutánea",
  "Inhalada",
  "Nebulización",
  "Tópica",
  "Rectal",
  "Sublingual",
];

export const FREQUENCIES = [
  "Cada 6 horas",
  "Cada 8 horas",
  "Cada 12 horas",
  "Cada 24 horas",
  "Cada 4 horas",
  "Dosis única",
  "PRN (según necesidad)",
  "Antes de cada comida",
  "En la noche",
];
