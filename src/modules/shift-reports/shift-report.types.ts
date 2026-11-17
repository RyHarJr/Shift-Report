import type {
  ChipperTypeValue,
  PartConditionValue,
  ShiftCodeValue,
} from "./shift-report.constants";

export interface ShiftReportDTO {
  id: string;
  customer: string;
  reportDate: string; // YYYY-MM-DD
  inspectionBy: string;
  chipperType: ChipperTypeValue;
  chipLengthSetUp: number;
  typeOfKnifeSystem: string;
  typeOfInspection: string;
  adjustChipLengthFrom: number | null;
  adjustChipLengthTo: number | null;
  signature: string | null;
  startChipperTime: string;
  stopChipperTime: string;
  shift: ShiftCodeValue;
  samplingTime: string;

  oversize: number;
  overthick: number;
  largeAccept: number;
  smallAccept: number;
  pin: number;
  fines: number;
  barkContent: number;
  moisture: number;
  dataSourceChipClassifier: boolean;
  samplingDoneByCostumer: boolean;
  totalAccept: number;
  pinPlusFines: number;
  chipQualityRemarks: string | null;
  chipQualityRemarksPhotoUrl: string | null;

  layerObservation: "SINGLE_LAYER" | "MULTI_LAYER" | null;
  logConditionDry: boolean;
  logConditionFresh: boolean;
  lotsOfBark: boolean | null;
  lotsOfSand: boolean | null;
  thereIsAStone: boolean | null;
  operationalPhotoUrl: string | null;
  operationalPhotoCaption: string | null;
  operationalPhotoUrl2: string | null;
  operationalPhotoCaption2: string | null;
  operationalPhotoUrl3: string | null;
  operationalPhotoCaption3: string | null;
  operationalPhotoUrl4: string | null;
  operationalPhotoCaption4: string | null;

  tDimensionMm: number | null;
  tDimensionLastSettingDate: string | null;
  clearanceAnvilMm: number | null;
  clearanceAnvilLastSettingDate: string | null;
  geometryRemarks: string | null;
  geometryRemarksPhotoUrl: string | null;

  partKnife: PartConditionValue | null;
  partClamps: PartConditionValue | null;
  partHolder: PartConditionValue | null;
  partKnifeBolt: PartConditionValue | null;
  partWearPlate: PartConditionValue | null;
  partFillerPiece: PartConditionValue | null;
  partDiscCover: PartConditionValue | null;
  partChipSlot: PartConditionValue | null;
  partWings: PartConditionValue | null;
  partBedKnife: PartConditionValue | null;
  partSideWearPlateInner: PartConditionValue | null;
  partSideWearPlateOuter: PartConditionValue | null;
  partFeedSpot: PartConditionValue | null;
  partRemarks: string | null;
  partRemarksPhotoUrl: string | null;
  partRemarks2: string | null;
  partRemarks2PhotoUrl: string | null;
  partRemarks3: string | null;
  partRemarks3PhotoUrl: string | null;
  partRemarks4: string | null;
  partRemarks4PhotoUrl: string | null;

  logYardNumber: string | null;
  logAgeYears: number | null;
  logAgingMonths: number | null;
  avgLogDiameterCm: number | null;
  logMoisturePct: number | null;
  diameterPct1: number | null;
  diameterMm1: number | null;
  diameterPct2: number | null;
  diameterMm2: number | null;
  rawMaterialRemarks: string | null;
  rawMaterialRemarksPhotoUrl: string | null;
  rawMaterialRemarks2: string | null;
  rawMaterialRemarks2PhotoUrl: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ShiftReportListDTO {
  id: string;
  customer: string;
  reportDate: string;
  inspectionBy: string;
  chipperType: ChipperTypeValue;
  chipLengthSetUp: number;
  typeOfKnifeSystem: string;
  shift: ShiftCodeValue;
  samplingTime: string;
  oversize: number;
  overthick: number;
  largeAccept: number;
  smallAccept: number;
  pin: number;
  fines: number;
  barkContent: number;
  moisture: number;
  totalAccept: number;
  pinPlusFines: number;
  layerObservation: "SINGLE_LAYER" | "MULTI_LAYER" | null;
  createdAt: string;
}

export interface ShiftReportChartDTO {
  id: string;
  reportDate: string;
  shift: ShiftCodeValue;
  chipperType: ChipperTypeValue;
  inspectionBy: string;
  oversize: number;
  overthick: number;
  largeAccept: number;
  smallAccept: number;
  pin: number;
  fines: number;
  barkContent: number;
  moisture: number;
  totalAccept: number;
  pinPlusFines: number;
}

