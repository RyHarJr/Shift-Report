import "server-only";
import { Prisma } from "@prisma/client";
import { NotFoundError } from "@/lib/errors";
import { roundDecimal } from "@/lib/utils";
import {
  DEFAULT_INSPECTION_TYPE,
  FIXED_CUSTOMER,
  getKnifeSystemForChipper,
} from "./shift-report.constants";
import { shiftReportRepository } from "./shift-report.repository";
import {
  shiftReportInputSchema,
  shiftReportQuerySchema,
  type ShiftReportParsedInput,
} from "./shift-report.schema";

function parseUtcDateOnly(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  return new Date(`${dateStr}T00:00:00.000Z`);
}

function buildPersistencePayload(
  parsed: ShiftReportParsedInput,
): Prisma.ShiftReportCreateInput {
  const totalAccept = roundDecimal(parsed.totalAccept, 2);
  const pinPlusFines = roundDecimal(parsed.pin + parsed.fines, 2);

  return {
    // Forced domain business rules
    customer: FIXED_CUSTOMER,
    typeOfKnifeSystem: getKnifeSystemForChipper(parsed.chipperType),
    typeOfInspection: parsed.typeOfInspection || DEFAULT_INSPECTION_TYPE,

    // Header
    reportDate: new Date(`${parsed.reportDate}T00:00:00.000Z`),
    inspectionBy: parsed.inspectionBy,
    chipperType: parsed.chipperType,
    chipLengthSetUp: parsed.chipLengthSetUp,
    adjustChipLengthFrom: parsed.adjustChipLengthFrom,
    adjustChipLengthTo: parsed.adjustChipLengthTo,
    signature: parsed.signature,
    startChipperTime: parsed.startChipperTime,
    stopChipperTime: parsed.stopChipperTime,
    shift: parsed.shift,
    samplingTime: parsed.samplingTime,

    // Section 1
    oversize: parsed.oversize,
    overthick: parsed.overthick,
    largeAccept: parsed.largeAccept,
    smallAccept: parsed.smallAccept,
    pin: parsed.pin,
    fines: parsed.fines,
    barkContent: parsed.barkContent,
    moisture: parsed.moisture,
    dataSourceChipClassifier: parsed.dataSourceChipClassifier,
    samplingDoneByCostumer: parsed.samplingDoneByCostumer,
    totalAccept,
    pinPlusFines,
    chipQualityRemarks: parsed.chipQualityRemarks,
    chipQualityRemarksPhotoUrl: parsed.chipQualityRemarksPhotoUrl,

    // Section 2
    layerObservation: parsed.layerObservation,
    logConditionDry: parsed.logConditionDry,
    logConditionFresh: parsed.logConditionFresh,
    lotsOfBark: parsed.lotsOfBark,
    lotsOfSand: parsed.lotsOfSand,
    thereIsAStone: parsed.thereIsAStone,
    operationalPhotoUrl: parsed.operationalPhotoUrl,
    operationalPhotoCaption: parsed.operationalPhotoUrl
      ? parsed.operationalPhotoCaption
      : null,
    operationalPhotoUrl2: parsed.operationalPhotoUrl2,
    operationalPhotoCaption2: parsed.operationalPhotoUrl2
      ? parsed.operationalPhotoCaption2
      : null,
    operationalPhotoUrl3: parsed.operationalPhotoUrl3,
    operationalPhotoCaption3: parsed.operationalPhotoUrl3
      ? parsed.operationalPhotoCaption3
      : null,
    operationalPhotoUrl4: parsed.operationalPhotoUrl4,
    operationalPhotoCaption4: parsed.operationalPhotoUrl4
      ? parsed.operationalPhotoCaption4
      : null,

    // Section 3.1
    tDimensionMm: parsed.tDimensionMm,
    tDimensionLastSettingDate: parseUtcDateOnly(parsed.tDimensionLastSettingDate),
    clearanceAnvilMm: parsed.clearanceAnvilMm,
    clearanceAnvilLastSettingDate: parseUtcDateOnly(
      parsed.clearanceAnvilLastSettingDate,
    ),
    geometryRemarks: parsed.geometryRemarks,
    geometryRemarksPhotoUrl: parsed.geometryRemarksPhotoUrl,

    // Section 3.2
    partKnife: parsed.partKnife,
    partClamps: parsed.partClamps,
    partHolder: parsed.partHolder,
    partKnifeBolt: parsed.partKnifeBolt,
    partWearPlate: parsed.partWearPlate,
    partFillerPiece: parsed.partFillerPiece,
    partDiscCover: parsed.partDiscCover,
    partChipSlot: parsed.partChipSlot,
    partWings: parsed.partWings,
    partBedKnife: parsed.partBedKnife,
    partSideWearPlateInner: parsed.partSideWearPlateInner,
    partSideWearPlateOuter: parsed.partSideWearPlateOuter,
    partFeedSpot: parsed.partFeedSpot,
    partRemarks: parsed.partRemarks,
    partRemarksPhotoUrl: parsed.partRemarksPhotoUrl,
    partRemarks2: parsed.partRemarks2,
    partRemarks2PhotoUrl: parsed.partRemarks2PhotoUrl,
    partRemarks3: parsed.partRemarks3,
    partRemarks3PhotoUrl: parsed.partRemarks3PhotoUrl,
    partRemarks4: parsed.partRemarks4,
    partRemarks4PhotoUrl: parsed.partRemarks4PhotoUrl,

    // Section 4
    logYardNumber: parsed.logYardNumber,
    logAgeYears: parsed.logAgeYears,
    logAgingMonths: parsed.logAgingMonths,
    avgLogDiameterCm: parsed.avgLogDiameterCm,
    logMoisturePct: parsed.logMoisturePct,
    diameterPct1: parsed.diameterPct1,
    diameterMm1: parsed.diameterMm1,
    diameterPct2: parsed.diameterPct2,
    diameterMm2: parsed.diameterMm2,
    rawMaterialRemarks: parsed.rawMaterialRemarks,
    rawMaterialRemarksPhotoUrl: parsed.rawMaterialRemarksPhotoUrl,
    rawMaterialRemarks2: parsed.rawMaterialRemarks2,
    rawMaterialRemarks2PhotoUrl: parsed.rawMaterialRemarks2PhotoUrl,
  };
}

export const shiftReportService = {
  async listReports(rawQuery: unknown) {
    const query = shiftReportQuerySchema.parse(rawQuery);
    return shiftReportRepository.findPaginated(query);
  },

  async getChartData(rawQuery: unknown) {
    const parsed = shiftReportQuerySchema.parse(rawQuery);
    return shiftReportRepository.findChartSeries(parsed);
  },

  async getReportById(id: string) {
    const report = await shiftReportRepository.findById(id);
    if (!report) {
      throw new NotFoundError();
    }
    return report;
  },

  async createReport(rawInput: unknown) {
    const parsed = shiftReportInputSchema.parse(rawInput);
    const payload = buildPersistencePayload(parsed);
    return shiftReportRepository.create(payload);
  },

  async updateReport(id: string, rawInput: unknown) {
    const existing = await shiftReportRepository.findById(id);
    if (!existing) {
      throw new NotFoundError();
    }
    const parsed = shiftReportInputSchema.parse(rawInput);
    const payload = buildPersistencePayload(parsed);
    return shiftReportRepository.update(id, payload);
  },

  async deleteReport(id: string) {
    const existing = await shiftReportRepository.findById(id);
    if (!existing) {
      throw new NotFoundError();
    }
    await shiftReportRepository.delete(id);
    return { id };
  },
};

