"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ImagePlus,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  formatBytesLabel,
  optimizeImageBeforeUpload,
} from "@/lib/client-image-resize";
import { cn, roundDecimal } from "@/lib/utils";
import {
  CHIP_QUALITY_METRICS,
  CHIPPER_OPTIONS,
  CHIPPER_PARTS,
  DEFAULT_INSPECTION_TYPE,
  FIXED_CUSTOMER,
  getKnifeSystemForChipper,
  PART_CONDITION_OPTIONS,
  SHIFT_OPTIONS,
  type ChipperPartKey,
  type ChipperTypeValue,
  type PartConditionValue,
  type ShiftCodeValue,
} from "@/modules/shift-reports/shift-report.constants";
import { shiftReportInputSchema } from "@/modules/shift-reports/shift-report.schema";
import type { ShiftReportDTO } from "@/modules/shift-reports/shift-report.types";

interface ShiftReportFormState {
  reportDate: string;
  inspectionBy: string;
  chipperType: ChipperTypeValue;
  chipLengthSetUp: string;
  adjustChipLengthFrom: string;
  adjustChipLengthTo: string;
  startChipperTime: string;
  stopChipperTime: string;
  shift: ShiftCodeValue;
  samplingTime: string;

  oversize: string;
  overthick: string;
  largeAccept: string;
  smallAccept: string;
  pin: string;
  fines: string;
  barkContent: string;
  moisture: string;
  dataSourceChipClassifier: boolean;
  samplingDoneByCostumer: boolean;
  totalAccept: string;
  chipQualityRemarks: string;
  chipQualityRemarksPhotoUrl: string;

  layerObservation: "SINGLE_LAYER" | "MULTI_LAYER" | "";
  logConditionDry: boolean;
  logConditionFresh: boolean;
  lotsOfBark: "yes" | "no" | "";
  lotsOfSand: "yes" | "no" | "";
  thereIsAStone: "yes" | "no" | "";
  operationalPhotoUrl: string;
  operationalPhotoCaption: string;
  operationalPhotoUrl2: string;
  operationalPhotoCaption2: string;
  operationalPhotoUrl3: string;
  operationalPhotoCaption3: string;
  operationalPhotoUrl4: string;
  operationalPhotoCaption4: string;

  tDimensionMm: string;
  tDimensionLastSettingDate: string;
  clearanceAnvilMm: string;
  clearanceAnvilLastSettingDate: string;
  geometryRemarks: string;
  geometryRemarksPhotoUrl: string;

  partKnife: PartConditionValue | "";
  partClamps: PartConditionValue | "";
  partHolder: PartConditionValue | "";
  partKnifeBolt: PartConditionValue | "";
  partWearPlate: PartConditionValue | "";
  partFillerPiece: PartConditionValue | "";
  partDiscCover: PartConditionValue | "";
  partChipSlot: PartConditionValue | "";
  partWings: PartConditionValue | "";
  partBedKnife: PartConditionValue | "";
  partSideWearPlateInner: PartConditionValue | "";
  partSideWearPlateOuter: PartConditionValue | "";
  partFeedSpot: PartConditionValue | "";
  partRemarks: string;
  partRemarksPhotoUrl: string;
  partRemarks2: string;
  partRemarks2PhotoUrl: string;

  logYardNumber: string;
  logAgeYears: string;
  logAgingMonths: string;
  avgLogDiameterCm: string;
  logMoisturePct: string;
  diameterPct1: string;
  diameterMm1: string;
  diameterPct2: string;
  diameterMm2: string;
  rawMaterialRemarks: string;
  rawMaterialRemarksPhotoUrl: string;
}

function numToStr(val: number | null | undefined): string {
  return val === null || val === undefined ? "" : String(val);
}

function boolToYesNo(val: boolean | null | undefined): "yes" | "no" | "" {
  if (val === true) return "yes";
  if (val === false) return "no";
  return "";
}

function createInitialState(
  initialData?: ShiftReportDTO,
  defaultDate = "",
): ShiftReportFormState {
  if (!initialData) {
    return {
      reportDate: defaultDate,
      inspectionBy: "",
      chipperType: "HHQ_16",
      chipLengthSetUp: "",
      adjustChipLengthFrom: "",
      adjustChipLengthTo: "",
      startChipperTime: "07:00",
      stopChipperTime: "15:00",
      shift: "I",
      samplingTime: "10:00",

      oversize: "",
      overthick: "",
      largeAccept: "",
      smallAccept: "",
      pin: "",
      fines: "",
      barkContent: "",
      moisture: "",
      dataSourceChipClassifier: true,
      samplingDoneByCostumer: true,
      totalAccept: "",
      chipQualityRemarks: "",
      chipQualityRemarksPhotoUrl: "",

      layerObservation: "",
      logConditionDry: false,
      logConditionFresh: false,
      lotsOfBark: "",
      lotsOfSand: "",
      thereIsAStone: "",
      operationalPhotoUrl: "",
      operationalPhotoCaption: "",
      operationalPhotoUrl2: "",
      operationalPhotoCaption2: "",
      operationalPhotoUrl3: "",
      operationalPhotoCaption3: "",
      operationalPhotoUrl4: "",
      operationalPhotoCaption4: "",

      tDimensionMm: "",
      tDimensionLastSettingDate: "",
      clearanceAnvilMm: "",
      clearanceAnvilLastSettingDate: "",
      geometryRemarks: "",
      geometryRemarksPhotoUrl: "",

      partKnife: "",
      partClamps: "",
      partHolder: "",
      partKnifeBolt: "",
      partWearPlate: "",
      partFillerPiece: "",
      partDiscCover: "",
      partChipSlot: "",
      partWings: "",
      partBedKnife: "",
      partSideWearPlateInner: "",
      partSideWearPlateOuter: "",
      partFeedSpot: "",
      partRemarks: "",
      partRemarksPhotoUrl: "",
      partRemarks2: "",
      partRemarks2PhotoUrl: "",

      logYardNumber: "",
      logAgeYears: "",
      logAgingMonths: "",
      avgLogDiameterCm: "",
      logMoisturePct: "",
      diameterPct1: "",
      diameterMm1: "",
      diameterPct2: "",
      diameterMm2: "",
      rawMaterialRemarks: "",
      rawMaterialRemarksPhotoUrl: "",
    };
  }

  return {
    reportDate: initialData.reportDate,
    inspectionBy: initialData.inspectionBy,
    chipperType: initialData.chipperType,
    chipLengthSetUp: numToStr(initialData.chipLengthSetUp),
    adjustChipLengthFrom: numToStr(initialData.adjustChipLengthFrom),
    adjustChipLengthTo: numToStr(initialData.adjustChipLengthTo),
    startChipperTime: initialData.startChipperTime,
    stopChipperTime: initialData.stopChipperTime,
    shift: initialData.shift,
    samplingTime: initialData.samplingTime,

    oversize: numToStr(initialData.oversize),
    overthick: numToStr(initialData.overthick),
    largeAccept: numToStr(initialData.largeAccept),
    smallAccept: numToStr(initialData.smallAccept),
    pin: numToStr(initialData.pin),
    fines: numToStr(initialData.fines),
    barkContent: numToStr(initialData.barkContent),
    moisture: numToStr(initialData.moisture),
    dataSourceChipClassifier: initialData.dataSourceChipClassifier,
    samplingDoneByCostumer: initialData.samplingDoneByCostumer,
    totalAccept: numToStr(initialData.totalAccept),
    chipQualityRemarks: initialData.chipQualityRemarks ?? "",
    chipQualityRemarksPhotoUrl: initialData.chipQualityRemarksPhotoUrl ?? "",

    layerObservation: initialData.layerObservation ?? "",
    logConditionDry: initialData.logConditionDry,
    logConditionFresh: initialData.logConditionFresh,
    lotsOfBark: boolToYesNo(initialData.lotsOfBark),
    lotsOfSand: boolToYesNo(initialData.lotsOfSand),
    thereIsAStone: boolToYesNo(initialData.thereIsAStone),
    operationalPhotoUrl: initialData.operationalPhotoUrl ?? "",
    operationalPhotoCaption: initialData.operationalPhotoCaption ?? "",
    operationalPhotoUrl2: initialData.operationalPhotoUrl2 ?? "",
    operationalPhotoCaption2: initialData.operationalPhotoCaption2 ?? "",
    operationalPhotoUrl3: initialData.operationalPhotoUrl3 ?? "",
    operationalPhotoCaption3: initialData.operationalPhotoCaption3 ?? "",
    operationalPhotoUrl4: initialData.operationalPhotoUrl4 ?? "",
    operationalPhotoCaption4: initialData.operationalPhotoCaption4 ?? "",

    tDimensionMm: numToStr(initialData.tDimensionMm),
    tDimensionLastSettingDate: initialData.tDimensionLastSettingDate ?? "",
    clearanceAnvilMm: numToStr(initialData.clearanceAnvilMm),
    clearanceAnvilLastSettingDate:
      initialData.clearanceAnvilLastSettingDate ?? "",
    geometryRemarks: initialData.geometryRemarks ?? "",
    geometryRemarksPhotoUrl: initialData.geometryRemarksPhotoUrl ?? "",

    partKnife: initialData.partKnife ?? "",
    partClamps: initialData.partClamps ?? "",
    partHolder: initialData.partHolder ?? "",
    partKnifeBolt: initialData.partKnifeBolt ?? "",
    partWearPlate: initialData.partWearPlate ?? "",
    partFillerPiece: initialData.partFillerPiece ?? "",
    partDiscCover: initialData.partDiscCover ?? "",
    partChipSlot: initialData.partChipSlot ?? "",
    partWings: initialData.partWings ?? "",
    partBedKnife: initialData.partBedKnife ?? "",
    partSideWearPlateInner: initialData.partSideWearPlateInner ?? "",
    partSideWearPlateOuter: initialData.partSideWearPlateOuter ?? "",
    partFeedSpot: initialData.partFeedSpot ?? "",
    partRemarks: initialData.partRemarks ?? "",
    partRemarksPhotoUrl: initialData.partRemarksPhotoUrl ?? "",
    partRemarks2: initialData.partRemarks2 ?? "",
    partRemarks2PhotoUrl: initialData.partRemarks2PhotoUrl ?? "",

    logYardNumber: initialData.logYardNumber ?? "",
    logAgeYears: numToStr(initialData.logAgeYears),
    logAgingMonths: numToStr(initialData.logAgingMonths),
    avgLogDiameterCm: numToStr(initialData.avgLogDiameterCm),
    logMoisturePct: numToStr(initialData.logMoisturePct),
    diameterPct1: numToStr(initialData.diameterPct1),
    diameterMm1: numToStr(initialData.diameterMm1),
    diameterPct2: numToStr(initialData.diameterPct2),
    diameterMm2: numToStr(initialData.diameterMm2),
    rawMaterialRemarks: initialData.rawMaterialRemarks ?? "",
    rawMaterialRemarksPhotoUrl: initialData.rawMaterialRemarksPhotoUrl ?? "",
  };
}

function parseFloatOrZero(val: string): number {
  const num = Number.parseFloat(val);
  return Number.isFinite(num) ? num : 0;
}

const PHOTO_SLOTS = [
  {
    key: "operationalPhotoUrl",
    captionKey: "operationalPhotoCaption",
    label: "Foto 1",
  },
  {
    key: "operationalPhotoUrl2",
    captionKey: "operationalPhotoCaption2",
    label: "Foto 2",
  },
  {
    key: "operationalPhotoUrl3",
    captionKey: "operationalPhotoCaption3",
    label: "Foto 3",
  },
  {
    key: "operationalPhotoUrl4",
    captionKey: "operationalPhotoCaption4",
    label: "Foto 4",
  },
] as const;

const PART_REMARK_SLOTS = [
  {
    key: "partRemarks",
    photoKey: "partRemarksPhotoUrl",
    label: "Remarks 1",
    placeholder: "Catatan Part bagan 1...",
  },
  {
    key: "partRemarks2",
    photoKey: "partRemarks2PhotoUrl",
    label: "Remarks 2",
    placeholder: "Catatan Part bagan 2...",
  },
] as const;

type PhotoSlotKey =
  | (typeof PHOTO_SLOTS)[number]["key"]
  | "chipQualityRemarksPhotoUrl"
  | "geometryRemarksPhotoUrl"
  | (typeof PART_REMARK_SLOTS)[number]["photoKey"]
  | "rawMaterialRemarksPhotoUrl";

interface RemarksPhotoAttachmentProps {
  photoUrl: string;
  label: string;
  isUploading: boolean;
  disabled: boolean;
  error?: string;
  onUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}

function RemarksPhotoAttachment({
  photoUrl,
  label,
  isUploading,
  disabled,
  error,
  onUpload,
  onRemove,
}: RemarksPhotoAttachmentProps) {
  return (
    <div className="mt-2">
      {photoUrl ? (
        <div className="rounded border border-border bg-background/60 p-1.5">
          <div className="relative overflow-hidden rounded border border-border bg-surface-muted h-24 w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={`Lampiran ${label}`}
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <label className="inline-flex h-9 sm:h-7 items-center gap-1.5 rounded border border-border bg-surface px-2.5 text-xs sm:text-[11px] font-medium hover:bg-surface-muted cursor-pointer">
              <ImagePlus className="size-3.5 sm:size-3" aria-hidden="true" />
              <span>{isUploading ? "Mengunggah..." : "Ganti Foto"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={onUpload}
                disabled={disabled}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex h-9 sm:h-7 items-center gap-1 rounded px-2 text-xs sm:text-[11px] font-medium text-danger hover:bg-danger-bg/60 hover:underline cursor-pointer"
            >
              <Trash2 className="size-3.5 sm:size-3" aria-hidden="true" />
              <span>Hapus</span>
            </button>
          </div>
        </div>
      ) : (
        <label className="flex h-10 sm:h-8 w-full items-center justify-center gap-1.5 rounded border border-dashed border-border bg-surface px-3 text-xs sm:text-[11px] font-medium text-muted-foreground hover:border-primary/60 hover:text-foreground transition-colors cursor-pointer">
          <ImagePlus className="size-3.5 shrink-0" aria-hidden="true" />
          <span>
            {isUploading ? "Mengunggah foto..." : "Unggah Foto (Opsional)"}
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onUpload}
            disabled={disabled}
            className="sr-only"
          />
        </label>
      )}
      {error ? (
        <p role="alert" className="mt-1 text-[11px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface ShiftReportFormProps {
  mode: "create" | "edit";
  initialData?: ShiftReportDTO;
  defaultDate: string;
}

export function ShiftReportForm({
  mode,
  initialData,
  defaultDate,
}: ShiftReportFormProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [form, setForm] = useState<ShiftReportFormState>(() =>
    createInitialState(initialData, defaultDate),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotoSlot, setUploadingPhotoSlot] =
    useState<PhotoSlotKey | null>(null);
  const [photoErrors, setPhotoErrors] = useState<
    Partial<Record<PhotoSlotKey, string>>
  >({});
  const [lastSavedId, setLastSavedId] = useState<string | null>(null);

  const knifeSystem = getKnifeSystemForChipper(form.chipperType);
  const autoTotalAcceptRef = roundDecimal(
    parseFloatOrZero(form.largeAccept) + parseFloatOrZero(form.smallAccept),
    2,
  );
  const pinPlusFines = roundDecimal(
    parseFloatOrZero(form.pin) + parseFloatOrZero(form.fines),
    2,
  );
  const sieveSum = roundDecimal(
    parseFloatOrZero(form.oversize) +
      parseFloatOrZero(form.overthick) +
      parseFloatOrZero(form.largeAccept) +
      parseFloatOrZero(form.smallAccept) +
      parseFloatOrZero(form.pin) +
      parseFloatOrZero(form.fines),
    2,
  );

  function setField<K extends keyof ShiftReportFormState>(
    key: K,
    value: ShiftReportFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function setAllPartsGood() {
    setForm((prev) => ({
      ...prev,
      partKnife: "GOOD",
      partClamps: "GOOD",
      partHolder: "GOOD",
      partKnifeBolt: "GOOD",
      partWearPlate: "GOOD",
      partFillerPiece: "GOOD",
      partDiscCover: "GOOD",
      partChipSlot: "GOOD",
      partWings: "GOOD",
      partBedKnife: "GOOD",
      partSideWearPlateInner: "GOOD",
      partSideWearPlateOuter: "GOOD",
      partFeedSpot: "GOOD",
    }));
  }

  async function handlePhotoUpload(
    slotKey: PhotoSlotKey,
    slotLabel: string,
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoErrors((prev) => ({ ...prev, [slotKey]: undefined }));
    setUploadingPhotoSlot(slotKey);
    try {
      const prepared = await optimizeImageBeforeUpload(file);
      const fd = new FormData();
      fd.append("file", prepared.file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as {
        success: boolean;
        data?: { url: string; optimizedSize?: number };
        error?: { message: string };
      };

      if (!res.ok || !json.success || !json.data) {
        const message = json.error?.message ?? "Gagal mengunggah foto.";
        setPhotoErrors((prev) => ({ ...prev, [slotKey]: message }));
        showToast(message, "error");
        return;
      }

      setField(slotKey, json.data.url);
      const finalSize = json.data.optimizedSize ?? prepared.clientSize;
      const savedRatio =
        prepared.originalSize > 0
          ? (prepared.originalSize - finalSize) / prepared.originalSize
          : 0;
      const summarySuffix =
        savedRatio >= 0.1
          ? ` (${formatBytesLabel(prepared.originalSize)} → ${formatBytesLabel(finalSize)})`
          : "";
      showToast(`${slotLabel} berhasil diunggah${summarySuffix}.`, "success");
    } catch {
      const message = "Tidak dapat mengunggah foto. Periksa koneksi Anda.";
      setPhotoErrors((prev) => ({ ...prev, [slotKey]: message }));
      showToast("Gagal menghubungi server saat mengunggah foto.", "error");
    } finally {
      setUploadingPhotoSlot(null);
      e.target.value = "";
    }
  }

  function removePhoto(
    slotKey: PhotoSlotKey,
    captionKey?: (typeof PHOTO_SLOTS)[number]["captionKey"],
  ) {
    setField(slotKey, "");
    if (captionKey) {
      setField(captionKey, "");
    }
    setPhotoErrors((prev) => {
      if (!prev[slotKey]) return prev;
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  }

  function buildPayload() {
    const yesNoToBool = (val: "yes" | "no" | "") => {
      if (val === "yes") return true;
      if (val === "no") return false;
      return null;
    };

    return {
      reportDate: form.reportDate,
      inspectionBy: form.inspectionBy,
      chipperType: form.chipperType,
      chipLengthSetUp: form.chipLengthSetUp,
      typeOfInspection: DEFAULT_INSPECTION_TYPE,
      adjustChipLengthFrom: form.adjustChipLengthFrom,
      adjustChipLengthTo: form.adjustChipLengthTo,
      signature: null,
      startChipperTime: form.startChipperTime,
      stopChipperTime: form.stopChipperTime,
      shift: form.shift,
      samplingTime: form.samplingTime,

      oversize: form.oversize,
      overthick: form.overthick,
      largeAccept: form.largeAccept,
      smallAccept: form.smallAccept,
      pin: form.pin,
      fines: form.fines,
      barkContent: form.barkContent,
      moisture: form.moisture,
      dataSourceChipClassifier: form.dataSourceChipClassifier,
      samplingDoneByCostumer: form.samplingDoneByCostumer,
      totalAccept: form.totalAccept,
      chipQualityRemarks: form.chipQualityRemarks,
      chipQualityRemarksPhotoUrl: form.chipQualityRemarksPhotoUrl || null,

      layerObservation: form.layerObservation || null,
      logConditionDry: form.logConditionDry,
      logConditionFresh: form.logConditionFresh,
      lotsOfBark: yesNoToBool(form.lotsOfBark),
      lotsOfSand: yesNoToBool(form.lotsOfSand),
      thereIsAStone: yesNoToBool(form.thereIsAStone),
      operationalPhotoUrl: form.operationalPhotoUrl || null,
      operationalPhotoCaption: form.operationalPhotoUrl
        ? form.operationalPhotoCaption
        : null,
      operationalPhotoUrl2: form.operationalPhotoUrl2 || null,
      operationalPhotoCaption2: form.operationalPhotoUrl2
        ? form.operationalPhotoCaption2
        : null,
      operationalPhotoUrl3: form.operationalPhotoUrl3 || null,
      operationalPhotoCaption3: form.operationalPhotoUrl3
        ? form.operationalPhotoCaption3
        : null,
      operationalPhotoUrl4: form.operationalPhotoUrl4 || null,
      operationalPhotoCaption4: form.operationalPhotoUrl4
        ? form.operationalPhotoCaption4
        : null,

      tDimensionMm: form.tDimensionMm,
      tDimensionLastSettingDate: form.tDimensionLastSettingDate,
      clearanceAnvilMm: form.clearanceAnvilMm,
      clearanceAnvilLastSettingDate: form.clearanceAnvilLastSettingDate,
      geometryRemarks: form.geometryRemarks,
      geometryRemarksPhotoUrl: form.geometryRemarksPhotoUrl || null,

      partKnife: form.partKnife || null,
      partClamps: form.partClamps || null,
      partHolder: form.partHolder || null,
      partKnifeBolt: form.partKnifeBolt || null,
      partWearPlate: form.partWearPlate || null,
      partFillerPiece: form.partFillerPiece || null,
      partDiscCover: form.partDiscCover ?? null,
      partChipSlot: form.partChipSlot || null,
      partWings: form.partWings || null,
      partBedKnife: form.partBedKnife || null,
      partSideWearPlateInner: form.partSideWearPlateInner || null,
      partSideWearPlateOuter: form.partSideWearPlateOuter || null,
      partFeedSpot: form.partFeedSpot || null,
      partRemarks: form.partRemarks,
      partRemarksPhotoUrl: form.partRemarksPhotoUrl || null,
      partRemarks2: form.partRemarks2,
      partRemarks2PhotoUrl: form.partRemarks2PhotoUrl || null,
      partRemarks3: "",
      partRemarks3PhotoUrl: null,
      partRemarks4: "",
      partRemarks4PhotoUrl: null,

      logYardNumber: form.logYardNumber,
      logAgeYears: form.logAgeYears,
      logAgingMonths: form.logAgingMonths,
      avgLogDiameterCm: form.avgLogDiameterCm,
      logMoisturePct: form.logMoisturePct,
      diameterPct1: form.diameterPct1,
      diameterMm1: form.diameterMm1,
      diameterPct2: form.diameterPct2,
      diameterMm2: form.diameterMm2,
      rawMaterialRemarks: form.rawMaterialRemarks,
      rawMaterialRemarksPhotoUrl: form.rawMaterialRemarksPhotoUrl || null,
      rawMaterialRemarks2: "",
      rawMaterialRemarks2PhotoUrl: null,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const rawPayload = buildPayload();
    const validated = shiftReportInputSchema.safeParse(rawPayload);

    if (!validated.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of validated.error.issues) {
        const key = String(issue.path[0] ?? "_root");
        if (!nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        const el = document.getElementById(`field-${firstKey}`);
        el?.focus();
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      showToast("Periksa kembali field yang belum valid.", "error");
      return;
    }

    setSubmitting(true);
    setLastSavedId(null);

    try {
      const endpoint =
        mode === "edit" && initialData
          ? `/api/shift-reports/${initialData.id}`
          : "/api/shift-reports";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rawPayload),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { id: string };
        error?: { message: string; details?: Record<string, string[]> };
      };

      if (!res.ok || !json.success || !json.data) {
        if (json.error?.details) {
          const serverErrors: Record<string, string> = {};
          for (const [k, msgs] of Object.entries(json.error.details)) {
            if (msgs[0]) serverErrors[k] = msgs[0];
          }
          setErrors(serverErrors);
        }
        showToast(
          json.error?.message ?? "Gagal menyimpan shift report.",
          "error",
        );
        return;
      }

      if (mode === "edit") {
        showToast("Perubahan shift report berhasil disimpan.", "success");
        router.push("/admin");
        router.refresh();
      } else {
        setLastSavedId(json.data.id);
        showToast("Shift report berhasil disimpan.", "success");
        setForm(createInitialState(undefined, defaultDate));
        setErrors({});
        setPhotoErrors({});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      showToast("Gagal menghubungi server. Silakan coba lagi.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {lastSavedId ? (
        <div
          role="status"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-success/30 bg-success-bg px-4 py-3 text-sm text-green-950"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="size-5 text-success shrink-0" aria-hidden="true" />
            <span>
              Shift report berhasil disimpan ke database (ID:{" "}
              <code className="font-mono font-semibold">{lastSavedId.slice(0, 10)}</code>).
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/admin/reports/${lastSavedId}`)}
          >
            Lihat Laporan
          </Button>
        </div>
      ) : null}

      {Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-danger/30 bg-danger-bg px-4 py-3 text-sm text-red-950"
        >
          <p className="font-semibold">
            Terdapat {Object.keys(errors).length} field yang perlu diperbaiki:
          </p>
          <ul className="mt-1 list-disc pl-5 text-xs space-y-0.5">
            {Object.entries(errors).map(([key, msg]) => (
              <li key={key}>
                <a
                  href={`#field-${key}`}
                  className="underline hover:no-underline font-medium"
                >
                  {msg}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* ============================================================
          PAGE 1 ENGINEERING SHEET
         ============================================================ */}
      <section className="relative rounded-lg border border-border bg-surface shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          {/* Title & Corporate Mark matching PDF */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Shift Report
              </h1>
              <p className="mt-1 text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Page 1 / 2 • Chipper Quality &amp; Operational Inspection
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-foreground">
                  {FIXED_CUSTOMER}
                </p>
                <p className="text-[11px] font-mono text-muted-foreground">
                  2020-06-01 / ML
                </p>
              </div>
              <BrandMark />
            </div>
          </div>

          {/* Top Metadata Grid (matches PDF Page 1 header table) */}
          <div className="border border-border-strong/70 divide-y divide-border-strong/70 text-sm">
            {/* Row 1: Customer | Date | Inspection by */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border-strong/70">
              <div className="md:col-span-4 p-3 bg-surface-muted/60">
                <span className="block text-xs font-semibold text-foreground">
                  Customer
                </span>
                <p className="mt-1 font-semibold text-primary">
                  : {FIXED_CUSTOMER}
                </p>
              </div>

              <div className="md:col-span-4 p-3">
                <label
                  htmlFor="field-reportDate"
                  className="block text-xs font-semibold text-foreground"
                >
                  Date <span className="text-danger">*</span>
                </label>
                <input
                  id="field-reportDate"
                  type="date"
                  value={form.reportDate}
                  onChange={(e) => setField("reportDate", e.target.value)}
                  aria-invalid={!!errors.reportDate}
                  className={cn(
                    "mt-1.5 h-9 w-full rounded border border-border bg-surface px-2.5 text-sm font-mono tabular-nums",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    errors.reportDate && "border-danger",
                  )}
                />
                {errors.reportDate ? (
                  <p role="alert" className="mt-1 text-xs text-danger font-medium">
                    {errors.reportDate}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-4 p-3">
                <label
                  htmlFor="field-inspectionBy"
                  className="block text-xs font-semibold text-foreground"
                >
                  Inspection by <span className="text-danger">*</span>
                </label>
                <input
                  id="field-inspectionBy"
                  type="text"
                  placeholder="Nama inspektor..."
                  value={form.inspectionBy}
                  onChange={(e) => setField("inspectionBy", e.target.value)}
                  aria-invalid={!!errors.inspectionBy}
                  className={cn(
                    "mt-1.5 h-9 w-full rounded border border-border bg-surface px-2.5 text-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    errors.inspectionBy && "border-danger",
                  )}
                />
                {errors.inspectionBy ? (
                  <p role="alert" className="mt-1 text-xs text-danger font-medium">
                    {errors.inspectionBy}
                  </p>
                ) : null}
              </div>
            </div>

            {/* Row 2: Chipper type | Chip Length Set Up | Type of knife system */}
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border-strong/70">
              <div className="md:col-span-4 p-3">
                <label
                  htmlFor="field-chipperType"
                  className="block text-xs font-semibold text-foreground"
                >
                  Chipper type <span className="text-danger">*</span>
                </label>
                <select
                  id="field-chipperType"
                  value={form.chipperType}
                  onChange={(e) =>
                    setField("chipperType", e.target.value as ChipperTypeValue)
                  }
                  className="mt-1.5 h-9 w-full rounded border border-border bg-surface px-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {CHIPPER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3 p-3">
                <label
                  htmlFor="field-chipLengthSetUp"
                  className="block text-xs font-semibold text-foreground"
                >
                  Chip Length Set Up <span className="text-danger">*</span>
                </label>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <input
                    id="field-chipLengthSetUp"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="24"
                    value={form.chipLengthSetUp}
                    onChange={(e) => setField("chipLengthSetUp", e.target.value)}
                    aria-invalid={!!errors.chipLengthSetUp}
                    className={cn(
                      "h-9 w-full rounded border border-border bg-surface px-2.5 text-sm font-mono tabular-nums",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      errors.chipLengthSetUp && "border-danger",
                    )}
                  />
                  <span className="text-xs font-mono font-medium text-muted-foreground shrink-0">
                    mm
                  </span>
                </div>
                {errors.chipLengthSetUp ? (
                  <p role="alert" className="mt-1 text-xs text-danger font-medium">
                    {errors.chipLengthSetUp}
                  </p>
                ) : null}
              </div>

              <div className="md:col-span-5 p-3 bg-surface-muted/60">
                <span className="block text-xs font-semibold text-foreground">
                  Type of knife system
                </span>
                <p className="mt-2 font-mono text-sm font-semibold text-primary">
                  : {knifeSystem}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Otomatis mengikuti pilihan Chipper type
                </p>
              </div>
            </div>

            {/* Row 3: Type of inspection */}
            <div className="px-3 py-2.5 bg-surface-muted/40 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-foreground">
                Type of inspection
              </span>
              <span className="text-sm font-semibold text-foreground">
                : {DEFAULT_INSPECTION_TYPE}
              </span>
            </div>

            {/* Row 4-5: Adjust From | Adjust To | Signature | Start/Stop & Shift/Sampling */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-strong/70">
              <div className="lg:col-span-2 p-3 flex flex-col justify-between">
                <label
                  htmlFor="field-adjustChipLengthFrom"
                  className="block text-xs font-semibold text-foreground"
                >
                  Adjust Chip Length From :
                </label>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    id="field-adjustChipLengthFrom"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={form.adjustChipLengthFrom}
                    onChange={(e) =>
                      setField("adjustChipLengthFrom", e.target.value)
                    }
                    className="h-9 w-full rounded border border-border bg-surface px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <span className="text-xs font-mono text-muted-foreground">mm</span>
                </div>
              </div>

              <div className="lg:col-span-2 p-3 flex flex-col justify-between">
                <label
                  htmlFor="field-adjustChipLengthTo"
                  className="block text-xs font-semibold text-foreground"
                >
                  Adjust Chip Length To :
                </label>
                <div className="mt-2 flex items-center gap-1.5">
                  <input
                    id="field-adjustChipLengthTo"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={form.adjustChipLengthTo}
                    onChange={(e) =>
                      setField("adjustChipLengthTo", e.target.value)
                    }
                    className="h-9 w-full rounded border border-border bg-surface px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <span className="text-xs font-mono text-muted-foreground">mm</span>
                </div>
              </div>

              {/* Signature cell intentionally blank per user instruction */}
              <div className="lg:col-span-3 p-3 flex flex-col justify-between bg-surface-muted/30">
                <span className="text-xs font-semibold text-foreground text-center">
                  Signature
                </span>
                <div className="mt-2 flex h-16 items-center justify-center rounded border border-dashed border-border text-xs text-muted-foreground">
                  Dikosongkan
                </div>
              </div>

              {/* Start Chipper, Stop Chipper, Shift, Sampling Time */}
              <div className="lg:col-span-5 divide-y divide-border-strong/70">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-strong/70">
                  <div className="p-2.5">
                    <label
                      htmlFor="field-startChipperTime"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Start Chipper{" "}
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        After Knife Change
                      </span>
                    </label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        id="field-startChipperTime"
                        type="time"
                        value={form.startChipperTime}
                        onChange={(e) =>
                          setField("startChipperTime", e.target.value)
                        }
                        className="h-9 w-full rounded border border-border bg-surface px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">jam</span>
                    </div>
                  </div>

                  <div className="p-2.5">
                    <label
                      htmlFor="field-stopChipperTime"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Stop Chipper{" "}
                      <span className="block text-[11px] font-normal text-muted-foreground">
                        Before Knife Change
                      </span>
                    </label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        id="field-stopChipperTime"
                        type="time"
                        value={form.stopChipperTime}
                        onChange={(e) =>
                          setField("stopChipperTime", e.target.value)
                        }
                        className="h-9 w-full rounded border border-border bg-surface px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">jam</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-strong/70">
                  <div className="p-2.5">
                    <span className="block text-xs font-semibold text-foreground">
                      Shift <span className="text-danger">*</span>
                    </span>
                    <div
                      role="radiogroup"
                      aria-label="Shift"
                      className="mt-1.5 grid grid-cols-3 gap-1"
                    >
                      {SHIFT_OPTIONS.map((opt) => {
                        const selected = form.shift === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setField("shift", opt.value)}
                            className={cn(
                              "h-9 rounded border text-xs font-mono font-semibold transition-colors cursor-pointer",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              selected
                                ? "bg-primary border-primary text-primary-foreground"
                                : "bg-surface border-border text-foreground hover:bg-surface-muted",
                            )}
                          >
                            {opt.value}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-2.5">
                    <label
                      htmlFor="field-samplingTime"
                      className="block text-xs font-semibold text-foreground"
                    >
                      Sampling Time <span className="text-danger">*</span>
                    </label>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <input
                        id="field-samplingTime"
                        type="time"
                        value={form.samplingTime}
                        onChange={(e) =>
                          setField("samplingTime", e.target.value)
                        }
                        className="h-9 w-full rounded border border-border bg-surface px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">jam</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================
              SECTION 1 (Chip Quality) + SECTION 2/3 (Data Source, Sampling, Totals, Remarks)
             ============================================================ */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Left: Section 1 Chip Quality */}
            <div className="lg:col-span-6 border border-border-strong/70 flex flex-col">
              <div className="grid grid-cols-12 bg-surface-muted border-b border-border-strong/70 text-xs font-bold text-foreground">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                  1
                </div>
                <div className="col-span-10 px-3 py-2.5 text-center">
                  Chip Quality
                </div>
              </div>

              <div className="divide-y divide-border-strong/50 flex-1 flex flex-col">
                {CHIP_QUALITY_METRICS.map((metric) => {
                  const fieldKey = metric.key as keyof ShiftReportFormState;
                  const errMsg = errors[fieldKey];
                  return (
                    <div
                      key={metric.key}
                      className="grid grid-cols-12 items-center lg:flex-1"
                    >
                      <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono text-xs font-semibold text-foreground self-stretch flex items-center justify-center bg-surface-muted/30">
                        {metric.code}
                      </div>
                      <label
                        htmlFor={`field-${metric.key}`}
                        className="col-span-5 px-3 py-2 border-r border-border-strong/50 text-sm font-medium text-foreground self-stretch flex items-center"
                      >
                        {metric.label}
                        <span className="ml-1 text-danger">*</span>
                      </label>
                      <div className="col-span-5 px-3 py-1.5 self-stretch flex flex-col justify-center">
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`field-${metric.key}`}
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.0"
                            value={String(form[fieldKey])}
                            onChange={(e) =>
                              setField(fieldKey, e.target.value as never)
                            }
                            aria-invalid={!!errMsg}
                            className={cn(
                              "h-9 w-full rounded border border-border bg-surface px-2.5 text-right text-sm font-mono tabular-nums",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                              errMsg && "border-danger",
                            )}
                          />
                          <span className="text-xs font-mono font-semibold text-muted-foreground w-4 text-right">
                            %
                          </span>
                        </div>
                        {errMsg ? (
                          <p role="alert" className="mt-1 text-xs text-danger font-medium">
                            {errMsg}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border-strong/70 bg-surface-muted/50 px-3 py-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Total Fraksi Ayakan (1.1 – 1.6)
                </span>
                <span className="font-mono font-semibold tabular-nums text-foreground">
                  {sieveSum.toFixed(2)} %
                </span>
              </div>
            </div>

            {/* Right: 2. Data Source, 3. Sampling, Total Accept, P+F, Remarks */}
            <div className="lg:col-span-6 border border-border-strong/70 flex flex-col divide-y divide-border-strong/70">
              {/* 2. Data Source */}
              <div className="grid grid-cols-12 bg-surface-muted text-xs font-bold text-foreground">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                  2.
                </div>
                <div className="col-span-10 px-3 py-2.5 text-center">
                  Data Source
                </div>
              </div>
              <label className="grid grid-cols-12 items-center cursor-pointer hover:bg-surface-muted/40 transition-colors">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 text-center font-mono text-xs font-semibold">
                  2.1
                </div>
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 flex justify-center">
                  <input
                    type="checkbox"
                    checked={form.dataSourceChipClassifier}
                    onChange={(e) =>
                      setField("dataSourceChipClassifier", e.target.checked)
                    }
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <div className="col-span-8 px-3 py-2.5 text-sm font-medium text-foreground">
                  Chip Classifier
                </div>
              </label>

              {/* 3. Sampling is Done by */}
              <div className="grid grid-cols-12 bg-surface-muted text-xs font-bold text-foreground">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                  3.
                </div>
                <div className="col-span-10 px-3 py-2.5 text-center">
                  Sampling is Done by
                </div>
              </div>
              <label className="grid grid-cols-12 items-center cursor-pointer hover:bg-surface-muted/40 transition-colors">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 text-center font-mono text-xs font-semibold">
                  3.1
                </div>
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 flex justify-center">
                  <input
                    type="checkbox"
                    checked={form.samplingDoneByCostumer}
                    onChange={(e) =>
                      setField("samplingDoneByCostumer", e.target.checked)
                    }
                    className="size-4 accent-primary rounded cursor-pointer"
                  />
                </div>
                <div className="col-span-8 px-3 py-2.5 text-sm font-medium text-foreground">
                  Costumer
                </div>
              </label>

              {/* Total Accept (Manual Input) & P+F (Auto-calculated) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border-strong/70 bg-primary/5">
                <div className="px-3 py-2.5 flex flex-col justify-between gap-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                    <label
                      htmlFor="field-totalAccept"
                      className="text-xs font-bold text-foreground whitespace-nowrap"
                    >
                      Total Accept <span className="text-danger">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
                      1.3+1.4: {autoTotalAcceptRef.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="field-totalAccept"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="0.00"
                      value={form.totalAccept}
                      onChange={(e) => setField("totalAccept", e.target.value)}
                      aria-invalid={!!errors.totalAccept}
                      className={cn(
                        "h-9 w-full rounded border border-border bg-surface px-2.5 text-right text-sm font-mono font-bold tabular-nums text-success",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                        errors.totalAccept && "border-danger",
                      )}
                    />
                    <span className="text-xs font-mono font-semibold text-muted-foreground w-4 text-right shrink-0">
                      %
                    </span>
                  </div>
                  {errors.totalAccept ? (
                    <p
                      role="alert"
                      className="text-xs text-danger font-medium"
                    >
                      {errors.totalAccept}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-2 px-3 py-3">
                  <div className="whitespace-nowrap">
                    <span className="block text-xs font-bold text-foreground">
                      P+F
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      (1.5 + 1.6)
                    </span>
                  </div>
                  <span className="font-mono text-base font-bold tabular-nums text-primary whitespace-nowrap">
                    {pinPlusFines.toFixed(2)} %
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div className="p-3 flex-1 flex flex-col">
                <label
                  htmlFor="field-chipQualityRemarks"
                  className="text-xs font-semibold italic text-primary"
                >
                  Remarks
                </label>
                <textarea
                  id="field-chipQualityRemarks"
                  rows={4}
                  placeholder="Catatan tambahan kualitas chip..."
                  value={form.chipQualityRemarks}
                  onChange={(e) => setField("chipQualityRemarks", e.target.value)}
                  className="mt-1.5 w-full flex-1 rounded border border-border bg-surface p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <RemarksPhotoAttachment
                  photoUrl={form.chipQualityRemarksPhotoUrl}
                  label="Remarks Chip Quality"
                  isUploading={
                    uploadingPhotoSlot === "chipQualityRemarksPhotoUrl"
                  }
                  disabled={uploadingPhotoSlot !== null}
                  error={photoErrors.chipQualityRemarksPhotoUrl}
                  onUpload={(e) =>
                    handlePhotoUpload(
                      "chipQualityRemarksPhotoUrl",
                      "Foto Remarks Chip Quality",
                      e,
                    )
                  }
                  onRemove={() => removePhoto("chipQualityRemarksPhotoUrl")}
                />
              </div>
            </div>
          </div>

          {/* ============================================================
              SECTION 2: Operational Condition + Photo
             ============================================================ */}
          <div className="border border-border-strong/70">
            <div className="grid grid-cols-12 bg-surface-muted border-b border-border-strong/70 text-xs font-bold text-foreground">
              <div className="col-span-2 sm:col-span-1 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                2
              </div>
              <div className="col-span-10 sm:col-span-11 px-3 py-2.5 text-center">
                Operational Condition
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-strong/70">
              {/* Left: 2.1 Layer & 2.2 Log Condition */}
              <div className="lg:col-span-6 flex flex-col divide-y divide-border-strong/50">
                {/* 2.1 Layer */}
                <div className="grid grid-cols-12 items-center bg-surface-muted/40">
                  <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono text-xs font-semibold">
                    2.1
                  </div>
                  <div className="col-span-10 px-3 py-2 text-xs font-semibold text-foreground">
                    Layer (Visual Observation)
                  </div>
                </div>

                {[
                  {
                    code: "2.1.1",
                    value: "SINGLE_LAYER" as const,
                    label: "Single Layer",
                  },
                  {
                    code: "2.1.2",
                    value: "MULTI_LAYER" as const,
                    label: "Multi Layer",
                  },
                ].map((layer) => {
                  const checked = form.layerObservation === layer.value;
                  return (
                    <label
                      key={layer.value}
                      className="grid grid-cols-12 items-center lg:flex-1 cursor-pointer hover:bg-surface-muted/30 transition-colors"
                    >
                      <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 text-center font-mono text-xs font-semibold self-stretch flex items-center justify-center">
                        {layer.code}
                      </div>
                      <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 self-stretch flex items-center justify-center">
                        <input
                          type="radio"
                          name="layerObservation"
                          checked={checked}
                          onChange={() =>
                            setField("layerObservation", layer.value)
                          }
                          className="size-4 accent-primary cursor-pointer"
                        />
                      </div>
                      <div className="col-span-8 px-3 py-2.5 text-sm font-medium self-stretch flex items-center">
                        {layer.label}
                      </div>
                    </label>
                  );
                })}

                {/* 2.2 Log Condition */}
                <div className="grid grid-cols-12 items-center bg-surface-muted/40">
                  <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono text-xs font-semibold">
                    2.2
                  </div>
                  <div className="col-span-10 px-3 py-2 text-xs font-semibold text-foreground">
                    Log Condition (Visual Observation)
                  </div>
                </div>

                {/* 2.2.1 Dry */}
                <label className="grid grid-cols-12 items-center lg:flex-1 cursor-pointer hover:bg-surface-muted/30 transition-colors">
                  <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 text-center font-mono text-xs font-semibold self-stretch flex items-center justify-center">
                    2.2.1
                  </div>
                  <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 self-stretch flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={form.logConditionDry}
                      onChange={(e) =>
                        setField("logConditionDry", e.target.checked)
                      }
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                  </div>
                  <div className="col-span-8 px-3 py-2.5 text-sm font-medium self-stretch flex items-center">
                    Dry
                  </div>
                </label>

                {/* 2.2.2 Fresh */}
                <label className="grid grid-cols-12 items-center lg:flex-1 cursor-pointer hover:bg-surface-muted/30 transition-colors">
                  <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 text-center font-mono text-xs font-semibold self-stretch flex items-center justify-center">
                    2.2.2
                  </div>
                  <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/50 self-stretch flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={form.logConditionFresh}
                      onChange={(e) =>
                        setField("logConditionFresh", e.target.checked)
                      }
                      className="size-4 accent-primary rounded cursor-pointer"
                    />
                  </div>
                  <div className="col-span-8 px-3 py-2.5 text-sm font-medium self-stretch flex items-center">
                    Fresh
                  </div>
                </label>

                {/* 2.2.3 - 2.2.5 Yes / No rows */}
                {(
                  [
                    { code: "2.2.3", key: "lotsOfBark", label: "Lots Of Bark" },
                    { code: "2.2.4", key: "lotsOfSand", label: "Lots Of Sand" },
                    {
                      code: "2.2.5",
                      key: "thereIsAStone",
                      label: "There is a Stone",
                    },
                  ] as const
                ).map((item) => {
                  const val = form[item.key];
                  return (
                    <div
                      key={item.key}
                      className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1"
                    >
                      <div className="flex items-center gap-2 sm:contents">
                        <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                          {item.code}
                        </div>
                        <div className="text-sm font-medium sm:col-span-4 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                          {item.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:contents">
                        <div className="sm:col-span-3 sm:px-2 sm:py-2 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center sm:justify-center">
                          <label className="flex min-h-10 sm:min-h-0 items-center justify-center gap-2 rounded border border-border sm:border-transparent bg-surface-muted/30 sm:bg-transparent px-3 py-1.5 sm:p-0 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name={item.key}
                              checked={val === "yes"}
                              onChange={() => setField(item.key, "yes")}
                              className="size-4 accent-primary cursor-pointer"
                            />
                            <span>Yes</span>
                          </label>
                        </div>
                        <div className="sm:col-span-3 sm:px-2 sm:py-2 sm:self-stretch sm:flex sm:items-center sm:justify-center">
                          <label className="flex min-h-10 sm:min-h-0 items-center justify-center gap-2 rounded border border-border sm:border-transparent bg-surface-muted/30 sm:bg-transparent px-3 py-1.5 sm:p-0 cursor-pointer text-sm">
                            <input
                              type="radio"
                              name={item.key}
                              checked={val === "no"}
                              onChange={() => setField(item.key, "no")}
                              className="size-4 accent-primary cursor-pointer"
                            />
                            <span>No</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right: Photo Upload (4 Separate Photo Cards) */}
              <div className="lg:col-span-6 p-4 flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold italic text-primary">
                    Photo (Maks. 4 Foto)
                  </span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    Terunggah:{" "}
                    {
                      PHOTO_SLOTS.filter((slot) => Boolean(form[slot.key]))
                        .length
                    }{" "}
                    / 4
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                  {PHOTO_SLOTS.map((slot) => {
                    const photoUrl = form[slot.key];
                    const isUploading = uploadingPhotoSlot === slot.key;
                    const slotError = photoErrors[slot.key];

                    return (
                      <div
                        key={slot.key}
                        className="rounded border border-border bg-background/40 p-2.5 flex flex-col"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            {slot.label}
                          </span>
                          {photoUrl ? (
                            <button
                              type="button"
                              onClick={() => removePhoto(slot.key, slot.captionKey)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-danger hover:underline cursor-pointer"
                            >
                              <Trash2 className="size-3" aria-hidden="true" />
                              <span>Hapus</span>
                            </button>
                          ) : null}
                        </div>

                        {photoUrl ? (
                          <div className="flex-1 flex flex-col gap-2">
                            <div className="relative overflow-hidden rounded border border-border bg-surface-muted aspect-video">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={photoUrl}
                                alt={
                                  form[slot.captionKey] ||
                                  `Foto kondisi operasional (${slot.label})`
                                }
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <label className="inline-flex h-8 items-center justify-center gap-1.5 rounded border border-border bg-surface px-2.5 text-xs font-medium hover:bg-surface-muted cursor-pointer self-start">
                              <ImagePlus
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              <span>
                                {isUploading ? "Mengunggah..." : "Ganti Foto"}
                              </span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={(e) =>
                                  handlePhotoUpload(slot.key, slot.label, e)
                                }
                                disabled={uploadingPhotoSlot !== null}
                                className="sr-only"
                              />
                            </label>
                          </div>
                        ) : (
                          <label className="flex-1 min-h-32 flex flex-col items-center justify-center rounded border-2 border-dashed border-border hover:border-primary/60 hover:bg-surface-muted/40 transition-colors p-3 text-center cursor-pointer">
                            <ImagePlus
                              className="size-6 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <p className="mt-1.5 text-xs font-medium text-foreground">
                              {isUploading
                                ? "Mengunggah..."
                                : `Unggah ${slot.label}`}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              JPG, PNG, WebP &bull; Auto-resize &amp; kompres
                            </p>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              onChange={(e) =>
                                handlePhotoUpload(slot.key, slot.label, e)
                              }
                              disabled={uploadingPhotoSlot !== null}
                              className="sr-only"
                            />
                          </label>
                        )}

                        <div className="mt-2 pt-2 border-t border-border/70">
                          <label
                            htmlFor={`field-${slot.captionKey}`}
                            className="sr-only"
                          >
                            Caption {slot.label}
                          </label>
                          <input
                            id={`field-${slot.captionKey}`}
                            type="text"
                            maxLength={255}
                            placeholder={`Caption ${slot.label} (opsional)...`}
                            value={form[slot.captionKey]}
                            onChange={(e) =>
                              setField(slot.captionKey, e.target.value)
                            }
                            className="h-8 w-full rounded border border-border bg-surface px-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                          />
                        </div>

                        {slotError ? (
                          <p
                            role="alert"
                            className="mt-1.5 text-[11px] font-medium text-danger"
                          >
                            {slotError}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          PAGE 2 ENGINEERING SHEET (Section 3 & Section 4)
         ============================================================ */}
      <section className="relative rounded-lg border border-border bg-surface shadow-xs overflow-hidden">
        <div className="p-3.5 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Chipper Condition &amp; Raw Material
              </h2>
              <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                Page 2 / 2 • Sida: 2 (totalt 2)
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs font-mono text-muted-foreground">
                {FIXED_CUSTOMER}
              </span>
              <BrandMark />
            </div>
          </div>

          {/* SECTION 3: Chipper Condition */}
          <div className="border border-border-strong/70 divide-y divide-border-strong/70">
            {/* Section 3 Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-surface-muted">
              <div className="lg:col-span-8 grid grid-cols-12 border-b lg:border-b-0 lg:border-r border-border-strong/70 text-xs font-bold text-foreground">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                  3
                </div>
                <div className="col-span-10 px-3 py-2.5 text-center">
                  Chipper Condition
                </div>
              </div>
              <div className="lg:col-span-4 px-3 py-2.5 text-xs font-semibold italic text-primary">
                Remarks (Geometry)
              </div>
            </div>

            {/* 3.1 Geometry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-strong/70">
              <div className="lg:col-span-8 flex flex-col divide-y divide-border-strong/50">
                <div className="px-3 py-2 text-center text-xs font-semibold bg-surface-muted/40">
                  Geometry
                </div>
                <div className="hidden sm:grid sm:grid-cols-12 bg-surface-muted/30 text-xs font-semibold text-foreground">
                  <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono">
                    3.1
                  </div>
                  <div className="col-span-4 px-3 py-2 border-r border-border-strong/50">
                    Setting
                  </div>
                  <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono">
                    mm
                  </div>
                  <div className="col-span-4 px-3 py-2 text-center">
                    Last Setting Date
                  </div>
                </div>

                {/* 3.1.1 T Dimension */}
                <div className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      3.1.1
                    </div>
                    <label
                      htmlFor="field-tDimensionMm"
                      className="text-sm font-medium sm:col-span-4 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      T Dimension
                    </label>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-end sm:contents">
                    <div className="col-span-5 sm:col-span-2 sm:px-2 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:hidden">
                        Ukuran (mm)
                      </span>
                      <input
                        id="field-tDimensionMm"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.0"
                        value={form.tDimensionMm}
                        onChange={(e) => setField("tDimensionMm", e.target.value)}
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 sm:px-2 text-right text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-4 sm:px-2 sm:py-1.5 sm:self-stretch sm:flex sm:items-center">
                      <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:hidden">
                        Last Setting Date
                      </span>
                      <input
                        id="field-tDimensionLastSettingDate"
                        type="date"
                        value={form.tDimensionLastSettingDate}
                        onChange={(e) =>
                          setField("tDimensionLastSettingDate", e.target.value)
                        }
                        aria-label="T Dimension Last Setting Date"
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 sm:px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>

                {/* 3.2.2 Clearance Anvil (preserving exact PDF numbering 3.2.2) */}
                <div className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      3.2.2
                    </div>
                    <label
                      htmlFor="field-clearanceAnvilMm"
                      className="text-sm font-medium sm:col-span-4 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Clearance Anvil
                    </label>
                  </div>
                  <div className="grid grid-cols-12 gap-2 items-end sm:contents">
                    <div className="col-span-5 sm:col-span-2 sm:px-2 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:hidden">
                        Ukuran (mm)
                      </span>
                      <input
                        id="field-clearanceAnvilMm"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.0"
                        value={form.clearanceAnvilMm}
                        onChange={(e) =>
                          setField("clearanceAnvilMm", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 sm:px-2 text-right text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="col-span-7 sm:col-span-4 sm:px-2 sm:py-1.5 sm:self-stretch sm:flex sm:items-center">
                      <span className="mb-1 block text-[11px] font-medium text-muted-foreground sm:hidden">
                        Last Setting Date
                      </span>
                      <input
                        id="field-clearanceAnvilLastSettingDate"
                        type="date"
                        value={form.clearanceAnvilLastSettingDate}
                        onChange={(e) =>
                          setField(
                            "clearanceAnvilLastSettingDate",
                            e.target.value,
                          )
                        }
                        aria-label="Clearance Anvil Last Setting Date"
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 sm:px-2 text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 p-3 flex flex-col">
                <textarea
                  id="field-geometryRemarks"
                  rows={4}
                  aria-label="Geometry Remarks"
                  placeholder="Catatan Geometry..."
                  value={form.geometryRemarks}
                  onChange={(e) => setField("geometryRemarks", e.target.value)}
                  className="w-full flex-1 rounded border border-border bg-surface p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <RemarksPhotoAttachment
                  photoUrl={form.geometryRemarksPhotoUrl}
                  label="Remarks Geometry"
                  isUploading={uploadingPhotoSlot === "geometryRemarksPhotoUrl"}
                  disabled={uploadingPhotoSlot !== null}
                  error={photoErrors.geometryRemarksPhotoUrl}
                  onUpload={(e) =>
                    handlePhotoUpload(
                      "geometryRemarksPhotoUrl",
                      "Foto Remarks Geometry",
                      e,
                    )
                  }
                  onRemove={() => removePhoto("geometryRemarksPhotoUrl")}
                />
              </div>
            </div>

            {/* 3.2 Part */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-strong/70">
              <div className="lg:col-span-8 flex flex-col divide-y divide-border-strong/50">
                <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 bg-surface-muted/40">
                  <span className="text-xs font-semibold">Part (3.2)</span>
                  <button
                    type="button"
                    onClick={setAllPartsGood}
                    className="inline-flex h-8 sm:h-7 items-center gap-1 rounded border border-border bg-surface px-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <Check className="size-3.5" aria-hidden="true" />
                    Tandai Semua Good
                  </button>
                </div>

                <div className="hidden sm:grid sm:grid-cols-12 bg-surface-muted/30 text-xs font-semibold text-foreground">
                  <div className="col-span-2 px-3 py-2 border-r border-border-strong/50 text-center font-mono">
                    3.2
                  </div>
                  <div className="col-span-4 px-3 py-2 border-r border-border-strong/50">
                    Description
                  </div>
                  <div className="col-span-6 px-3 py-2 text-center">
                    Condition
                  </div>
                </div>

                {CHIPPER_PARTS.map((part) => {
                  const key = part.key as ChipperPartKey;
                  const currentVal = form[key];
                  return (
                    <div
                      key={part.key}
                      className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1"
                    >
                      <div className="flex items-center gap-2 sm:contents">
                        <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-2 sm:py-2 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                          {part.code}
                        </div>
                        <div className="text-sm font-medium sm:col-span-4 sm:px-3 sm:py-2 sm:border-r sm:border-border-strong/50 sm:text-xs sm:self-stretch sm:flex sm:items-center">
                          {part.label}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-border-strong/40 rounded border border-border-strong/40 overflow-hidden sm:rounded-none sm:border-0 sm:col-span-6 sm:self-stretch">
                        {PART_CONDITION_OPTIONS.map((opt) => {
                          const isSelected = currentVal === opt.value;
                          return (
                            <label
                              key={opt.value}
                              className={cn(
                                "flex min-h-10 sm:min-h-0 items-center justify-center gap-1 sm:gap-1.5 px-1.5 py-2 text-xs font-medium cursor-pointer transition-colors",
                                isSelected &&
                                  opt.value === "GOOD" &&
                                  "bg-success-bg text-success font-semibold",
                                isSelected &&
                                  opt.value === "WORN_OUT" &&
                                  "bg-warning-bg text-warning font-semibold",
                                isSelected &&
                                  opt.value === "BROKEN" &&
                                  "bg-danger-bg text-danger font-semibold",
                                !isSelected && "hover:bg-surface-muted/40",
                              )}
                            >
                              <input
                                type="radio"
                                name={part.key}
                                checked={isSelected}
                                onChange={() => setField(key, opt.value)}
                                className="sr-only"
                              />
                              {opt.value === "GOOD" ? (
                                <Check
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    isSelected ? "opacity-100" : "opacity-30",
                                  )}
                                  aria-hidden="true"
                                />
                              ) : null}
                              {opt.value === "WORN_OUT" ? (
                                <AlertTriangle
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    isSelected ? "opacity-100" : "opacity-30",
                                  )}
                                  aria-hidden="true"
                                />
                              ) : null}
                              {opt.value === "BROKEN" ? (
                                <X
                                  className={cn(
                                    "size-3.5 shrink-0",
                                    isSelected ? "opacity-100" : "opacity-30",
                                  )}
                                  aria-hidden="true"
                                />
                              ) : null}
                              <span className="truncate">{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-4 p-3 flex flex-col">
                <span className="text-xs font-semibold italic text-primary">
                  Remarks (Part)
                </span>
                <div className="mt-2 grid grid-cols-1 gap-3 flex-1">
                  {PART_REMARK_SLOTS.map((slot) => (
                    <div
                      key={slot.key}
                      className="flex flex-col rounded border border-border bg-background/40 p-2"
                    >
                      <label
                        htmlFor={`field-${slot.key}`}
                        className="mb-1 text-[11px] font-semibold text-muted-foreground"
                      >
                        {slot.label}
                      </label>
                      <textarea
                        id={`field-${slot.key}`}
                        rows={5}
                        placeholder={slot.placeholder}
                        value={form[slot.key]}
                        onChange={(e) => setField(slot.key, e.target.value)}
                        className="w-full flex-1 rounded border border-border bg-surface p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <RemarksPhotoAttachment
                        photoUrl={form[slot.photoKey]}
                        label={`Part ${slot.label}`}
                        isUploading={uploadingPhotoSlot === slot.photoKey}
                        disabled={uploadingPhotoSlot !== null}
                        error={photoErrors[slot.photoKey]}
                        onUpload={(e) =>
                          handlePhotoUpload(
                            slot.photoKey,
                            `Foto Part ${slot.label}`,
                            e,
                          )
                        }
                        onRemove={() => removePhoto(slot.photoKey)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: Raw Material */}
          <div className="border border-border-strong/70 divide-y divide-border-strong/70">
            <div className="grid grid-cols-1 lg:grid-cols-12 bg-surface-muted">
              <div className="lg:col-span-8 grid grid-cols-12 border-b lg:border-b-0 lg:border-r border-border-strong/70 text-xs font-bold text-foreground">
                <div className="col-span-2 px-3 py-2.5 border-r border-border-strong/70 text-center font-mono">
                  4
                </div>
                <div className="col-span-10 px-3 py-2.5 text-center">
                  Raw Material
                </div>
              </div>
              <div className="lg:col-span-4 px-3 py-2.5 text-xs font-semibold italic text-primary">
                Remarks (Raw Material)
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border-strong/70">
              <div className="lg:col-span-8 flex flex-col divide-y divide-border-strong/50">
                {/* 4.1 Log Yard Number */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.1
                    </div>
                    <label
                      htmlFor="field-logYardNumber"
                      className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Log Yard Number
                    </label>
                  </div>
                  <div className="sm:col-span-5 sm:px-3 sm:py-1.5 sm:self-stretch sm:flex sm:items-center">
                    <input
                      id="field-logYardNumber"
                      type="text"
                      inputMode="numeric"
                      placeholder="Contoh: 12"
                      value={form.logYardNumber}
                      onChange={(e) => setField("logYardNumber", e.target.value)}
                      className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 text-left sm:text-center text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                {/* 4.2 Log Age */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.2
                    </div>
                    <label
                      htmlFor="field-logAgeYears"
                      className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Log Age
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="flex-1 sm:col-span-3 sm:px-3 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <input
                        id="field-logAgeYears"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={form.logAgeYears}
                        onChange={(e) => setField("logAgeYears", e.target.value)}
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 text-center text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="shrink-0 w-16 sm:w-auto sm:col-span-2 px-2 py-2.5 text-center text-xs font-medium text-muted-foreground sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      Years
                    </div>
                  </div>
                </div>

                {/* 4.3 Log Aging In Storage */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.3
                    </div>
                    <label
                      htmlFor="field-logAgingMonths"
                      className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Log Aging In Storage
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="flex-1 sm:col-span-3 sm:px-3 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <input
                        id="field-logAgingMonths"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={form.logAgingMonths}
                        onChange={(e) =>
                          setField("logAgingMonths", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 text-center text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="shrink-0 w-16 sm:w-auto sm:col-span-2 px-2 py-2.5 text-center text-xs font-medium text-muted-foreground sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      Months
                    </div>
                  </div>
                </div>

                {/* 4.4 Avg. Log Diameter */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.4
                    </div>
                    <label
                      htmlFor="field-avgLogDiameterCm"
                      className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Avg. Log Diameter
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="flex-1 sm:col-span-3 sm:px-3 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <input
                        id="field-avgLogDiameterCm"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="0"
                        value={form.avgLogDiameterCm}
                        onChange={(e) =>
                          setField("avgLogDiameterCm", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 text-center text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="shrink-0 w-16 sm:w-auto sm:col-span-2 px-2 py-2.5 text-center text-xs font-medium text-muted-foreground sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      cm
                    </div>
                  </div>
                </div>

                {/* 4.5 Log Moisture */}
                <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.5
                    </div>
                    <label
                      htmlFor="field-logMoisturePct"
                      className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center"
                    >
                      Log Moisture
                    </label>
                  </div>
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="flex-1 sm:col-span-3 sm:px-3 sm:py-1.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      <input
                        id="field-logMoisturePct"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={form.logMoisturePct}
                        onChange={(e) =>
                          setField("logMoisturePct", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2.5 text-center text-sm font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>
                    <div className="shrink-0 w-16 sm:w-auto sm:col-span-2 px-2 py-2.5 text-center text-xs font-medium text-muted-foreground sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      %
                    </div>
                  </div>
                </div>

                {/* 4.6 Percentage Log Diameter (exact 2 pairs: XX % XX cm XX % XX cm) */}
                <div className="flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-12 sm:items-center sm:gap-0 sm:p-0 lg:flex-1">
                  <div className="flex items-center gap-2 sm:contents">
                    <div className="shrink-0 font-mono text-xs font-semibold text-muted-foreground sm:text-foreground sm:col-span-2 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:text-center sm:self-stretch sm:flex sm:items-center sm:justify-center">
                      4.6
                    </div>
                    <div className="text-sm font-medium sm:col-span-5 sm:px-3 sm:py-2.5 sm:border-r sm:border-border-strong/50 sm:self-stretch sm:flex sm:items-center">
                      Percentage Log Diameter
                    </div>
                  </div>
                  <div className="sm:col-span-5 sm:p-2 grid grid-cols-1 lg:grid-cols-2 gap-2 sm:self-stretch sm:items-center">
                    <div className="flex items-center gap-1.5">
                      <input
                        id="field-diameterPct1"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="XX"
                        aria-label="Persentase diameter 1"
                        value={form.diameterPct1}
                        onChange={(e) =>
                          setField("diameterPct1", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2 sm:px-1.5 text-center text-sm sm:text-xs font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        %
                      </span>
                      <input
                        id="field-diameterMm1"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="XX"
                        aria-label="Ukuran diameter 1 dalam cm"
                        value={form.diameterMm1}
                        onChange={(e) =>
                          setField("diameterMm1", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2 sm:px-1.5 text-center text-sm sm:text-xs font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        cm
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        id="field-diameterPct2"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="XX"
                        aria-label="Persentase diameter 2"
                        value={form.diameterPct2}
                        onChange={(e) =>
                          setField("diameterPct2", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2 sm:px-1.5 text-center text-sm sm:text-xs font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        %
                      </span>
                      <input
                        id="field-diameterMm2"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="XX"
                        aria-label="Ukuran diameter 2 dalam cm"
                        value={form.diameterMm2}
                        onChange={(e) =>
                          setField("diameterMm2", e.target.value)
                        }
                        className="h-10 sm:h-9 w-full rounded border border-border bg-surface px-2 sm:px-1.5 text-center text-sm sm:text-xs font-mono tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                      <span className="shrink-0 text-xs font-mono text-muted-foreground">
                        cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 p-3 flex flex-col">
                <textarea
                  id="field-rawMaterialRemarks"
                  rows={6}
                  aria-label="Raw Material Remarks"
                  placeholder="Catatan Raw Material..."
                  value={form.rawMaterialRemarks}
                  onChange={(e) =>
                    setField("rawMaterialRemarks", e.target.value)
                  }
                  className="w-full flex-1 rounded border border-border bg-surface p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <RemarksPhotoAttachment
                  photoUrl={form.rawMaterialRemarksPhotoUrl}
                  label="Remarks Raw Material"
                  isUploading={
                    uploadingPhotoSlot === "rawMaterialRemarksPhotoUrl"
                  }
                  disabled={uploadingPhotoSlot !== null}
                  error={photoErrors.rawMaterialRemarksPhotoUrl}
                  onUpload={(e) =>
                    handlePhotoUpload(
                      "rawMaterialRemarksPhotoUrl",
                      "Foto Remarks Raw Material",
                      e,
                    )
                  }
                  onRemove={() => removePhoto("rawMaterialRemarksPhotoUrl")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Sticky / Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-xs">
        <p className="text-xs text-muted-foreground">
          Field bertanda <span className="text-danger font-semibold">*</span> wajib
          diisi. P+F dihitung otomatis.
        </p>
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3">
          {mode === "edit" ? (
            <Button
              variant="outline"
              onClick={() => router.push("/admin")}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setForm(createInitialState(undefined, defaultDate));
                setErrors({});
                setPhotoErrors({});
              }}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span>Reset Form</span>
            </Button>
          )}
          <Button
            type="submit"
            size="lg"
            loading={submitting}
            className="w-full sm:w-auto"
          >
            <Save className="size-4" aria-hidden="true" />
            <span>
              {mode === "edit" ? "Simpan Perubahan" : "Simpan Shift Report"}
            </span>
          </Button>
        </div>
      </div>
    </form>
  );
}

