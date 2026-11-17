export const FIXED_CUSTOMER = "PT Tanjung Enim Lestari" as const;
export const DEFAULT_INSPECTION_TYPE = "Daily Inspection" as const;
export const MAX_ACTIVE_CHARTS = 6;

export const CHIPPER_OPTIONS = [
  {
    value: "HHQ_16",
    label: "HHQ 16",
    knifeSystem: "TK IV Standart 330 MM",
  },
  {
    value: "CAMURA_1",
    label: "Camura 1",
    knifeSystem: "TK IV Standart 365 MM",
  },
  {
    value: "CAMURA_2",
    label: "Camura 2",
    knifeSystem: "TK IV Standart 365 MM",
  },
] as const;

export type ChipperTypeValue = (typeof CHIPPER_OPTIONS)[number]["value"];

export const CHIPPER_LABEL_MAP: Record<ChipperTypeValue, string> = {
  HHQ_16: "HHQ 16",
  CAMURA_1: "Camura 1",
  CAMURA_2: "Camura 2",
};

export const CHIPPER_KNIFE_MAP: Record<ChipperTypeValue, string> = {
  HHQ_16: "TK IV Standart 330 MM",
  CAMURA_1: "TK IV Standart 365 MM",
  CAMURA_2: "TK IV Standart 365 MM",
};

export function getKnifeSystemForChipper(chipperType: ChipperTypeValue): string {
  return CHIPPER_KNIFE_MAP[chipperType];
}

export const SHIFT_OPTIONS = [
  { value: "I", label: "Shift I" },
  { value: "II", label: "Shift II" },
  { value: "III", label: "Shift III" },
] as const;

export type ShiftCodeValue = (typeof SHIFT_OPTIONS)[number]["value"];

export const PART_CONDITION_OPTIONS = [
  { value: "GOOD", label: "Good" },
  { value: "WORN_OUT", label: "Worn Out" },
  { value: "BROKEN", label: "Broken" },
] as const;

export type PartConditionValue = (typeof PART_CONDITION_OPTIONS)[number]["value"];

export const CHIPPER_PARTS = [
  { key: "partKnife", code: "3.2.1", label: "Knife" },
  { key: "partClamps", code: "3.2.2", label: "Clamps" },
  { key: "partHolder", code: "3.2.3", label: "Holder" },
  { key: "partKnifeBolt", code: "3.2.4", label: "Knife Bolt" },
  { key: "partWearPlate", code: "3.2.5", label: "Wear Plate" },
  { key: "partFillerPiece", code: "3.2.6", label: "Filler Piece" },
  { key: "partDiscCover", code: "3.2.7", label: "Disc Cover" },
  { key: "partChipSlot", code: "3.2.8", label: "Chip Slot" },
  { key: "partWings", code: "3.2.9", label: "Wings" },
  { key: "partBedKnife", code: "3.2.10", label: "Bed Knife" },
  { key: "partSideWearPlateInner", code: "3.2.11", label: "Side Wear Plate Inner" },
  { key: "partSideWearPlateOuter", code: "3.2.12", label: "Side Wear Plate Outer" },
  { key: "partFeedSpot", code: "3.2.13", label: "Feed Spot" },
] as const;

export type ChipperPartKey = (typeof CHIPPER_PARTS)[number]["key"];

export const CHIP_QUALITY_METRICS = [
  { key: "oversize", code: "1.1", label: "Oversize", unit: "%", color: "#B91C1C" },
  { key: "overthick", code: "1.2", label: "Overthick", unit: "%", color: "#D97706" },
  { key: "largeAccept", code: "1.3", label: "Large Accept", unit: "%", color: "#005A9C" },
  { key: "smallAccept", code: "1.4", label: "Small Accept", unit: "%", color: "#0284C7" },
  { key: "pin", code: "1.5", label: "Pin", unit: "%", color: "#7C3AED" },
  { key: "fines", code: "1.6", label: "Fines", unit: "%", color: "#BE185D" },
  { key: "barkContent", code: "1.7", label: "Bark Content", unit: "%", color: "#854D0E" },
  { key: "moisture", code: "1.8", label: "Moisture", unit: "%", color: "#0D9488" },
] as const;

export type ChipQualityMetricKey = (typeof CHIP_QUALITY_METRICS)[number]["key"];

export const CHART_DEFINITIONS = [
  ...CHIP_QUALITY_METRICS.map((m) => ({
    id: m.key,
    code: m.code,
    label: `${m.code} ${m.label}`,
    shortLabel: `${m.code} ${m.label}`,
    unit: m.unit,
    color: m.color,
    description: `Tren persentase ${m.label} (${m.code}) per inspeksi shift.`,
  })),
  {
    id: "totalAccept",
    code: "Accept",
    label: "Total Accept",
    shortLabel: "Total Accept",
    unit: "%",
    color: "#15803D",
    description: "Persentase Total Accept per inspeksi shift.",
  },
  {
    id: "pinPlusFines",
    code: "1.5+1.6",
    label: "P+F (1.5 + 1.6)",
    shortLabel: "P+F",
    unit: "%",
    color: "#EA580C",
    description: "Akumulasi persentase Pin + Fines.",
  },
] as const;

export type ChartId = (typeof CHART_DEFINITIONS)[number]["id"];

export const DEFAULT_SELECTED_CHARTS: ChartId[] = [
  "oversize",
  "overthick",
  "totalAccept",
  "pinPlusFines",
];

export const ALL_SUMMARY_SIX_CHARTS: ChartId[] = [
  "oversize",
  "overthick",
  "totalAccept",
  "pinPlusFines",
  "barkContent",
  "moisture",
];

