# Miracle Hospital HIS Simulator

Simulador **pesado, denso y realista** de un Sistema de Información Hospitalaria / Historia
Clínica Electrónica (HIS/EHR), construido para **probar Miracle** — un agente de
automatización por interfaz que escucha la conversación médico‑paciente y rellena
información clínica en el lugar correcto del sistema.

Hospital ficticio: **Hospital Universitario San Rafael de Medellín**.

> ⚠️ **Simulador de prueba.** Datos 100% sintéticos. No es software clínico certificado,
> no contiene datos reales de pacientes y no debe usarse para atención real.

---

## 1. Qué se construyó

Una aplicación web tipo hospital completo, en **español** (UI) con código en inglés,
optimizada para **automatización por UI**: cada campo relevante tiene `label`, `id`,
`name`, `data-testid`, `aria-label` y mensajes de validación.

- **App shell** con sidebar oscuro (25 destinos en 5 grupos), barra superior de comando
  (búsqueda global, selector de rol, sede, turno, contadores de órdenes/alertas, reloj,
  menú de usuario) y **encabezado de contexto del paciente** persistente.
- **14 roles** con visibilidad de módulos y permisos simulados (firmar, prescribir,
  administrar, facturar).
- **Registro de campos en vivo** + **overlay Miracle QA** con ruta actual, paciente/encuentro
  seleccionado, conteo de campos, último campo editado, último evento de auditoría y todos los
  `data-testid` visibles.
- **Atajos de teclado**: `Ctrl/Cmd+K` búsqueda · `Ctrl/Cmd+S` guardar · `Ctrl/Cmd+Shift+A`
  auditoría · `Ctrl/Cmd+Shift+M` overlay Miracle · `Esc` cerrar modal/drawer.
- **Trazabilidad**: cada acción de guardado genera un evento de **auditoría** en estado local.
- **Persistencia** en `localStorage` (datos sintéticos sembrados una sola vez).

### Datos sintéticos sembrados
50 pacientes · 15 urgencias activas · 20 citas ambulatorias · 25 hospitalizados · 8 UCI ·
60 órdenes · 40 laboratorios · 25 imágenes · 40 medicamentos (con eMAR) · 30 tareas de
enfermería · 10 cirugías · 15 remisiones · 20 autorizaciones EPS · 15 facturas · 30 ítems de
inventario · 100 eventos de auditoría. Nombres y EPS de estilo colombiano, **ficticios**.

---

## 2. Rutas principales (50+)

| Módulo | Ruta(s) |
| --- | --- |
| Inicio / Tablero | `/dashboard` |
| Bandeja clínica | `/clinical-inbox` |
| Pacientes | `/patients`, `/patients/[id]` |
| Admisiones | `/admissions` |
| Urgencias | `/emergency`, `/emergency/triage`, `/emergency/encounter/[id]` |
| Consulta externa | `/outpatient`, `/outpatient/schedule`, `/outpatient/consultation/[id]` |
| Hospitalización | `/inpatient`, `/inpatient/wards`, `/inpatient/bed-board`, `/inpatient/encounter/[id]` |
| UCI | `/icu` |
| Enfermería | `/nursing`, `/nursing/tasks`, `/nursing/vitals`, `/nursing/notes` |
| Cirugía | `/surgery`, `/surgery/schedule`, `/surgery/case/[id]` |
| Documentación | `/documentation` |
| Órdenes (CPOE) | `/orders`, `/orders/new`, `/orders/[id]` |
| Laboratorio (LIS) | `/lab`, `/lab/orders`, `/lab/results`, `/lab/sample-tracking` |
| Imágenes (RIS/PACS) | `/imaging`, `/imaging/orders`, `/imaging/reports` |
| Farmacia | `/pharmacy`, `/pharmacy/dispensing`, `/pharmacy/inventory` |
| Medicamentos / eMAR | `/medications` |
| Remisiones | `/referrals` |
| Egresos / Epicrisis | `/discharge`, `/discharge/[id]` |
| Facturación / EPS | `/billing`, `/billing/authorizations`, `/billing/invoices` |
| Inventario clínico | `/inventory` |
| Reportes BI | `/reports` |
| Auditoría | `/audit` |
| Interoperabilidad (FHIR-like) | `/interoperability` |
| Configuración | `/settings` |
| **Miracle Test Lab** | `/miracle-test-lab` |

---

## 3. Cómo ejecutarlo localmente

Requisitos: Node.js ≥ 18.18 (probado con Node 24) y npm.

```bash
npm install
npm run dev      # http://localhost:3000  (redirige a /dashboard)
```

Build de producción:

```bash
npm run build
npm run start
```

La primera carga siembra los datos sintéticos en `localStorage`. Para regenerarlos:
**Configuración → Datos → Restablecer datos demo**, o borre el `localStorage` del sitio.

---

## 4. Módulos completos

Pantallas reales con datos, formularios densos e interacciones (firmar, cancelar, administrar,
reconocer, validar, exportar, etc.):

- Tablero clínico, Bandeja clínica, Índice maestro de pacientes (+ ficha).
- Admisiones (ingreso con checklist), Urgencias (tablero + triage + nota médica).
- Consulta externa (agenda + nota **SOAP** de 9 pestañas).
- Hospitalización (censo, servicios, **mapa de camas**, encuentro de **14 pestañas**), UCI
  (hoja de cuidado crítico).
- Enfermería (tareas, signos vitales, notas), Documentación (modo libre + estructurado lado a
  lado), Órdenes **CPOE** (con order sets, alertas de duplicado/alergia), Laboratorio,
  Imágenes, Farmacia, Medicamentos/eMAR + conciliación.
- Cirugía (tablero, agenda, nota operatoria + checklists), Remisiones, Egresos/Epicrisis.
- Facturación/Autorizaciones, Inventario, Reportes BI, Auditoría, Interoperabilidad
  (exporta **Bundle FHIR-like**), Configuración.
- **Miracle Test Lab** completo (ver abajo).

## 5. Módulos parcialmente simulados (mock por diseño)

- **Alertas clínicas** (interacciones, alergias, duplicados): textos demostrativos, sin lógica
  clínica real. No dan consejo médico.
- **Imágenes/PACS**: visor de imágenes es un placeholder; los informes sí son editables.
- **Laboratorio**: valores generados con jitter alrededor del rango (no fisiológicos).
- **Facturación**: tarifas y glosas simuladas; sin integración real.
- **Interoperabilidad**: el JSON es *FHIR-inspirado*, no una implementación certificada.
- **Reportes BI**: algunos KPIs se calculan de los datos; otros son cifras demo (incluida la
  "precisión de Miracle").
- **Documentos/PDF/adjuntos**: placeholders.

---

## 6. Miracle Test Lab (`/miracle-test-lab`)

Entorno dedicado para probar la automatización:

- **A. Simulador de transcripción**: pegue/edite una conversación médico‑paciente.
- **B. Panel de mapeo esperado**: campos objetivo (`chiefComplaint`, `presentIllness`,
  `vitalSigns`, `diagnosisSuspicions`, `labOrders`, `imagingOrders`, `plan`, …).
- **C. Mapa de campos**: tabla con etiqueta, `data-testid`, sección, valor actual, valor
  esperado y estado.
- **D. Puntuación de automatización**: correctos / incorrectos / sección incorrecta /
  faltantes / llenados, **precisión %**, interacciones UI y tiempo. Botones *Simular perfecto*
  y *Simular parcial*.
- **E. Biblioteca de 12 escenarios**: dolor torácico, fiebre pediátrica, embarazada con dolor
  abdominal, crisis hipertensiva, control de diabetes, asma, trauma en moto, nota de enfermería
  POP, evolución UCI, epicrisis por neumonía, conciliación de medicamentos, creación de órdenes.
- **F. Modo de prueba de estrés**: matriz de **etiquetas duplicadas** (mismo texto en varios
  módulos — *Observaciones*, *Diagnóstico*, *Plan*, *Medicamentos*, *Alergias vs reacciones*,
  *Órdenes vs resultados*) con su ruta y `data-testid`, para verificar que Miracle usa el
  **contexto** y no solo coincidencia de texto.
- **Campos en vivo**: instantánea del registro de campos montados en la pantalla actual.

---

## 7. Soporte de automatización (para Miracle)

- `data-testid` deterministas y estables (p. ej. `nav-emergency`, `patient-search-input`,
  `field-chief-complaint`, `field-vital-blood-pressure-systolic`, `tab-diagnoses`,
  `button-sign-note`, `modal-lab-results`, `drawer-patient-summary`).
- Cada campo se **auto-registra** (ruta, módulo, sección, label, id, name, testid, tipo,
  requerido, valor) en `lib/store/useFieldRegistry.ts`.
- Overlay Miracle QA (`Ctrl/Cmd+Shift+M`) con estado en tiempo real y lista de `data-testid`.
- Auditoría exportable (`/audit`) y Bundle FHIR-like exportable (`/interoperability`).

---

## 8. Stack técnico

Next.js 15 (App Router) · TypeScript · Tailwind CSS · Zustand (+ persist) · Zod ·
componentes accesibles propios (estilo shadcn/Radix) · `lucide-react`. Sin APIs externas;
capa de datos en memoria + `localStorage`.

### Estructura
```
app/            # 50+ rutas (una page.tsx por pantalla)
components/
  app-shell/    # sidebar, topbar, encabezado de paciente, command palette, overlay
  ui/           # Button, Badge, Card, Field, Tabs, Table, Modal, Drawer, Toaster
  clinical/     # workspaces reutilizables (Lab, Imaging, Nursing, Pharmacy, Inventory, Billing…)
  miracle/      # overlay QA
lib/
  config/       # roles, navegación
  data/         # catálogos (CIE-10, medicamentos, lab), seed sintético, escenarios, stress-test
  store/        # useSession, useHospital, useUI, useFieldRegistry
  types/        # modelo de dominio
  utils/        # cn, format, status, id
  hooks/        # useSelected, useSaveShortcut
```

---

## 9. Próximas mejoras sugeridas para pruebas de Miracle

1. **Registro de campos por ruta persistente**: snapshot del mapa de campos de cada pantalla
   (no solo la activa) para comparar expected vs actual sin navegar.
2. **Timeline de acciones UI** dentro del overlay (cada click/tipeo con timestamp) y export.
3. **Scoring real desde transcripción**: motor de extracción opcional para no depender del
   "simular perfecto/parcial".
4. **Más trampas de contexto**: alergias vs reacciones adversas, dx en triage vs egreso,
   medicamentos en casa vs hoy, orden solicitada vs resultado recibido (ya esbozadas en el
   modo estrés; ampliarlas con escenarios dedicados).
5. **Validaciones más estrictas** (Zod) por campo para probar manejo de errores de Miracle.
6. **Modo "grabar y reproducir"** de un llenado de Miracle para regresión.

> Catálogos clínicos (CIE-10, medicamentos, laboratorio): **"Catálogo demo, no usar para
> atención real."**
