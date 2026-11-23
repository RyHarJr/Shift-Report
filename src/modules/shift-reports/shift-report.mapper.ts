import type { ShiftReport } from "@prisma/client";
import { toDateInputValue } from "@/lib/utils";
import type {
  ShiftReportChartPoint,
  ShiftReportListItem,
} from "./shift-report.repository";
import type {
  ShiftReportChartDTO,
  ShiftReportDTO,
  ShiftReportListDTO,
} from "./shift-report.types";

/** Converts a Prisma ShiftReport record into a JSON-safe DTO for Server -> Client props. */
export function toShiftReportDTO(report: ShiftReport): ShiftReportDTO {
  return {
    id: report.id,
    customer: report.customer,
    reportDate: toDateInputValue(report.reportDate),
    inspectionBy: report.inspectionBy,
    chipperType: report.chipperType,
    chipLengthSetUp: report.chipLengthSetUp,
    typeOfKnifeSystem: report.typeOfKnifeSystem,
    typeOfInspection: report.typeOfInspection,
    adjustChipLengthFrom: report.adjustChipLengthFrom,
    adjustChipLengthTo: report.adjustChipLengthTo,
    signature: report.signature,
    startChipperTime: report.startChipperTime,
    stopChipperTime: report.stopChipperTime,
    shift: report.shift,
    samplingTime: report.samplingTime,

    oversize: report.oversize,
    overthick: report.overthick,
    largeAccept: report.largeAccept,
    smallAccept: report.smallAccept,
    pin: report.pin,
    fines: report.fines,
    barkContent: report.barkContent,
    moisture: report.moisture,
    dataSourceChipClassifier: report.dataSourceChipClassifier,
    samplingDoneByCostumer: report.samplingDoneByCostumer,
    totalAccept: report.totalAccept,
    pinPlusFines: report.pinPlusFines,
    chipQualityRemarks: report.chipQualityRemarks,
    chipQualityRemarksPhotoUrl: report.chipQualityRemarksPhotoUrl,

    layerObservation: report.layerObservation,
    logConditionDry: report.logConditionDry,
    logConditionFresh: report.logConditionFresh,
    lotsOfBark: report.lotsOfBark,
    lotsOfSand: report.lotsOfSand,
    thereIsAStone: report.thereIsAStone,
    operationalPhotoUrl: report.operationalPhotoUrl,
    operationalPhotoCaption: report.operationalPhotoCaption,
    operationalPhotoUrl2: report.operationalPhotoUrl2,
    operationalPhotoCaption2: report.operationalPhotoCaption2,
    operationalPhotoUrl3: report.operationalPhotoUrl3,
    operationalPhotoCaption3: report.operationalPhotoCaption3,
    operationalPhotoUrl4: report.operationalPhotoUrl4,
    operationalPhotoCaption4: report.operationalPhotoCaption4,

    tDimensionMm: report.tDimensionMm,
    tDimensionLastSettingDate: report.tDimensionLastSettingDate
      ? toDateInputValue(report.tDimensionLastSettingDate)
      : null,
    clearanceAnvilMm: report.clearanceAnvilMm,
    clearanceAnvilLastSettingDate: report.clearanceAnvilLastSettingDate
      ? toDateInputValue(report.clearanceAnvilLastSettingDate)
      : null,
    geometryRemarks: report.geometryRemarks,
    geometryRemarksPhotoUrl: report.geometryRemarksPhotoUrl,

    partKnife: report.partKnife,
    partClamps: report.partClamps,
    partHolder: report.partHolder,
    partKnifeBolt: report.partKnifeBolt,
    partWearPlate: report.partWearPlate,
    partFillerPiece: report.partFillerPiece,
    partDiscCover: report.partDiscCover,
    partChipSlot: report.partChipSlot,
    partWings: report.partWings,
    partBedKnife: report.partBedKnife,
    partSideWearPlateInner: report.partSideWearPlateInner,
    partSideWearPlateOuter: report.partSideWearPlateOuter,
    partFeedSpot: report.partFeedSpot,
    partRemarks: report.partRemarks,
    partRemarksPhotoUrl: report.partRemarksPhotoUrl,
    partRemarks2: report.partRemarks2,
    partRemarks2PhotoUrl: report.partRemarks2PhotoUrl,
    partRemarks3: report.partRemarks3,
    partRemarks3PhotoUrl: report.partRemarks3PhotoUrl,
    partRemarks4: report.partRemarks4,
    partRemarks4PhotoUrl: report.partRemarks4PhotoUrl,

    logYardNumber: report.logYardNumber,
    logAgeYears: report.logAgeYears,
    logAgingMonths: report.logAgingMonths,
    avgLogDiameterCm: report.avgLogDiameterCm,
    logMoisturePct: report.logMoisturePct,
    diameterPct1: report.diameterPct1,
    diameterMm1: report.diameterMm1,
    diameterPct2: report.diameterPct2,
    diameterMm2: report.diameterMm2,
    diameterPct3: report.diameterPct3,
    diameterMm3: report.diameterMm3,
    rawMaterialRemarks: report.rawMaterialRemarks,
    rawMaterialRemarksPhotoUrl: report.rawMaterialRemarksPhotoUrl,
    rawMaterialRemarks2: report.rawMaterialRemarks2,
    rawMaterialRemarks2PhotoUrl: report.rawMaterialRemarks2PhotoUrl,

    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

/** Converts a Prisma list projection into a JSON-safe list DTO. */
export function toShiftReportListDTO(
  item: ShiftReportListItem,
): ShiftReportListDTO {
  return {
    id: item.id,
    customer: item.customer,
    reportDate: toDateInputValue(item.reportDate),
    inspectionBy: item.inspectionBy,
    chipperType: item.chipperType,
    chipLengthSetUp: item.chipLengthSetUp,
    typeOfKnifeSystem: item.typeOfKnifeSystem,
    shift: item.shift,
    samplingTime: item.samplingTime,
    oversize: item.oversize,
    overthick: item.overthick,
    largeAccept: item.largeAccept,
    smallAccept: item.smallAccept,
    pin: item.pin,
    fines: item.fines,
    barkContent: item.barkContent,
    moisture: item.moisture,
    totalAccept: item.totalAccept,
    pinPlusFines: item.pinPlusFines,
    layerObservation: item.layerObservation,
    createdAt: item.createdAt.toISOString(),
  };
}

/** Converts a Prisma chart projection into a JSON-safe chart point DTO. */
export function toShiftReportChartDTO(
  item: ShiftReportChartPoint,
): ShiftReportChartDTO {
  return {
    id: item.id,
    reportDate: toDateInputValue(item.reportDate),
    shift: item.shift,
    chipperType: item.chipperType,
    inspectionBy: item.inspectionBy,
    oversize: item.oversize,
    overthick: item.overthick,
    largeAccept: item.largeAccept,
    smallAccept: item.smallAccept,
    pin: item.pin,
    fines: item.fines,
    barkContent: item.barkContent,
    moisture: item.moisture,
    totalAccept: item.totalAccept,
    pinPlusFines: item.pinPlusFines,
  };
}
