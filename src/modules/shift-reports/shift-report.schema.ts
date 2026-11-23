import { z } from "zod";
import { SAFE_UPLOAD_URL_REGEX } from "@/modules/uploads/upload-url";

const TIME_HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

function emptyToNull(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return null;
  }
  return value;
}

const optionalNumber = (min = 0, max = 100000) =>
  z.preprocess(
    emptyToNull,
    z.coerce
      .number({ message: "Harus berupa angka yang valid." })
      .min(min, `Nilai minimal ${min}.`)
      .max(max, `Nilai maksimal ${max}.`)
      .nullable(),
  );

const requiredPercentage = (label: string) =>
  z.coerce
    .number({ message: `${label} wajib diisi angka.` })
    .min(0, `${label} minimal 0%.`)
    .max(100, `${label} maksimal 100%.`);

const requiredManualPercentage = (label: string) =>
  z.preprocess(
    (val) => {
      if (typeof val === "number") return Number.isFinite(val) ? val : undefined;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed === "") return undefined;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : trimmed;
      }
      return undefined;
    },
    z
      .number({ message: `${label} wajib diisi angka.` })
      .min(0, `${label} minimal 0%.`)
      .max(100, `${label} maksimal 100%.`),
  );

const optionalPercentage = (label: string) =>
  z.preprocess(
    emptyToNull,
    z.coerce
      .number({ message: `${label} harus berupa angka.` })
      .min(0, `${label} minimal 0%.`)
      .max(100, `${label} maksimal 100%.`)
      .nullable(),
  );

const optionalString = (maxLength = 1000) =>
  z.preprocess(
    (val) => {
      if (typeof val !== "string") return val ?? null;
      const trimmed = val.trim();
      return trimmed.length === 0 ? null : trimmed;
    },
    z.string().max(maxLength, `Maksimal ${maxLength} karakter.`).nullable(),
  );

const optionalPhotoUrl = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val ?? null;
    const trimmed = val.trim();
    return trimmed.length === 0 ? null : trimmed;
  },
  z
    .string()
    .max(500, "URL foto terlalu panjang.")
    .regex(SAFE_UPLOAD_URL_REGEX, "URL foto hasil unggahan tidak valid.")
    .nullable(),
);

const optionalDateString = z.preprocess(
  emptyToNull,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .nullable(),
);

const optionalBoolean = z.preprocess((val) => {
  if (val === "" || val === undefined || val === null) return null;
  if (val === "true" || val === true) return true;
  if (val === "false" || val === false) return false;
  return val;
}, z.boolean().nullable());

const partConditionSchema = z.preprocess(
  emptyToNull,
  z.enum(["GOOD", "WORN_OUT", "BROKEN"]).nullable(),
);

const layerObservationSchema = z.preprocess(
  emptyToNull,
  z.enum(["SINGLE_LAYER", "MULTI_LAYER"]).nullable(),
);

export const shiftReportInputSchema = z.object({
  // Header & Metadata
  reportDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal inspeksi wajib diisi (YYYY-MM-DD)."),
  inspectionBy: z
    .string()
    .trim()
    .min(1, "Nama inspektor (Inspection by) wajib diisi.")
    .max(150, "Maksimal 150 karakter."),
  chipperType: z.enum(["HHQ_16", "CAMURA_1", "CAMURA_2"], {
    message: "Pilih Chipper type (HHQ 16, Camura 1, atau Camura 2).",
  }),
  chipLengthSetUp: z.coerce
    .number({ message: "Chip Length Set Up wajib diisi angka." })
    .min(0.1, "Chip Length Set Up harus lebih dari 0 mm.")
    .max(500, "Chip Length Set Up maksimal 500 mm."),
  typeOfInspection: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .default("Daily Inspection"),
  adjustChipLengthFrom: optionalNumber(0, 500),
  adjustChipLengthTo: optionalNumber(0, 500),
  signature: optionalString(2000),
  startChipperTime: z
    .string()
    .regex(TIME_HH_MM_REGEX, "Format Start Chipper harus HH:mm (contoh 08:30)."),
  stopChipperTime: z
    .string()
    .regex(TIME_HH_MM_REGEX, "Format Stop Chipper harus HH:mm (contoh 16:45)."),
  shift: z.enum(["I", "II", "III"], {
    message: "Pilih Shift (I, II, atau III).",
  }),
  samplingTime: z
    .string()
    .regex(TIME_HH_MM_REGEX, "Format Sampling Time harus HH:mm (contoh 10:00)."),

  // Section 1: Chip Quality & Data Source / Sampling
  oversize: requiredPercentage("1.1 Oversize"),
  overthick: requiredPercentage("1.2 Overthick"),
  largeAccept: requiredPercentage("1.3 Large Accept"),
  smallAccept: requiredPercentage("1.4 Small Accept"),
  pin: requiredPercentage("1.5 Pin"),
  fines: requiredPercentage("1.6 Fines"),
  barkContent: requiredPercentage("1.7 Bark Content"),
  moisture: requiredPercentage("1.8 Moisture"),
  dataSourceChipClassifier: z.boolean().default(true),
  samplingDoneByCostumer: z.boolean().default(true),
  totalAccept: requiredManualPercentage("Total Accept"),
  chipQualityRemarks: optionalString(2000),
  chipQualityRemarksPhotoUrl: optionalPhotoUrl,

  // Section 2: Operational Condition & Photo
  layerObservation: layerObservationSchema,
  logConditionDry: z.boolean().default(false),
  logConditionFresh: z.boolean().default(false),
  lotsOfBark: optionalBoolean,
  lotsOfSand: optionalBoolean,
  thereIsAStone: optionalBoolean,
  operationalPhotoUrl: optionalPhotoUrl,
  operationalPhotoCaption: optionalString(255),
  operationalPhotoUrl2: optionalPhotoUrl,
  operationalPhotoCaption2: optionalString(255),
  operationalPhotoUrl3: optionalPhotoUrl,
  operationalPhotoCaption3: optionalString(255),
  operationalPhotoUrl4: optionalPhotoUrl,
  operationalPhotoCaption4: optionalString(255),

  // Section 3.1: Geometry
  tDimensionMm: optionalNumber(0, 1000),
  tDimensionLastSettingDate: optionalDateString,
  clearanceAnvilMm: optionalNumber(0, 1000),
  clearanceAnvilLastSettingDate: optionalDateString,
  geometryRemarks: optionalString(2000),
  geometryRemarksPhotoUrl: optionalPhotoUrl,

  // Section 3.2: Part Condition
  partKnife: partConditionSchema,
  partClamps: partConditionSchema,
  partHolder: partConditionSchema,
  partKnifeBolt: partConditionSchema,
  partWearPlate: partConditionSchema,
  partFillerPiece: partConditionSchema,
  partDiscCover: partConditionSchema,
  partChipSlot: partConditionSchema,
  partWings: partConditionSchema,
  partBedKnife: partConditionSchema,
  partSideWearPlateInner: partConditionSchema,
  partSideWearPlateOuter: partConditionSchema,
  partFeedSpot: partConditionSchema,
  partRemarks: optionalString(2000),
  partRemarksPhotoUrl: optionalPhotoUrl,
  partRemarks2: optionalString(2000),
  partRemarks2PhotoUrl: optionalPhotoUrl,
  partRemarks3: optionalString(2000),
  partRemarks3PhotoUrl: optionalPhotoUrl,
  partRemarks4: optionalString(2000),
  partRemarks4PhotoUrl: optionalPhotoUrl,

  // Section 4: Raw Material
  logYardNumber: optionalString(50),
  logAgeYears: optionalNumber(0, 100),
  logAgingMonths: optionalNumber(0, 120),
  avgLogDiameterCm: optionalNumber(0, 500),
  logMoisturePct: optionalPercentage("4.5 Log Moisture"),
  diameterPct1: optionalPercentage("4.6 Persentase 1"),
  diameterMm1: optionalNumber(0, 2000),
  diameterPct2: optionalPercentage("4.6 Persentase 2"),
  diameterMm2: optionalNumber(0, 2000),
  diameterPct3: optionalPercentage("4.6 Persentase 3"),
  diameterMm3: optionalNumber(0, 2000),
  rawMaterialRemarks: optionalString(2000),
  rawMaterialRemarksPhotoUrl: optionalPhotoUrl,
  rawMaterialRemarks2: optionalString(2000),
  rawMaterialRemarks2PhotoUrl: optionalPhotoUrl,
});

export type ShiftReportFormValues = z.input<typeof shiftReportInputSchema>;
export type ShiftReportParsedInput = z.output<typeof shiftReportInputSchema>;

export const shiftReportQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(15),
  search: z.string().trim().max(100).optional(),
  chipperType: z.enum(["ALL", "HHQ_16", "CAMURA_1", "CAMURA_2"]).default("ALL"),
  shift: z.enum(["ALL", "I", "II", "III"]).default("ALL"),
  dateFrom: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
  dateTo: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export type ShiftReportQueryInput = z.output<typeof shiftReportQuerySchema>;

