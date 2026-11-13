import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import PDFDocument from "pdfkit";
import sharp from "sharp";
import { formatDateDisplay, formatNumber } from "@/lib/utils";
import {
  CHIP_QUALITY_METRICS,
  CHIPPER_LABEL_MAP,
  CHIPPER_PARTS,
} from "./shift-report.constants";
import type { ShiftReportDTO } from "./shift-report.types";

const UPLOAD_DIR = path.join(process.cwd(), "storage", "uploads");
const SAFE_UPLOAD_URL_REGEX = /^\/api\/uploads\/([0-9]+-[0-9a-f-]+\.(?:jpg|png|webp))$/i;

const BLUE = "#005A9C";
const DARK = "#0F172A";
const MUTED = "#475569";
const BORDER = "#334155";
const INNER_BORDER = "#475569";

const PAGE_LEFT = 42;
const CONTENT_W = 496; // Leaves comfortable right margin for rotated vertical mark

interface LoadedPhoto {
  label: string;
  caption: string | null;
  buffer: Buffer;
}

interface LoadedRemarkPhoto {
  sectionTitle: string;
  remarkText: string | null;
  buffer: Buffer | null;
}

async function loadUploadImageBuffer(
  url: string | null | undefined,
  width: number,
  height: number,
): Promise<Buffer | null> {
  if (!url) return null;
  const match = SAFE_UPLOAD_URL_REGEX.exec(url);
  if (!match) return null;

  const filePath = path.join(UPLOAD_DIR, match[1]);
  try {
    const rawBuffer = await fs.readFile(filePath);
    return await sharp(rawBuffer)
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize({ width, height, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84 })
      .toBuffer();
  } catch {
    return null;
  }
}

async function loadOperationalPhotos(
  report: ShiftReportDTO,
): Promise<LoadedPhoto[]> {
  const slots = [
    {
      url: report.operationalPhotoUrl,
      caption: report.operationalPhotoCaption,
      label: "Foto 1",
    },
    {
      url: report.operationalPhotoUrl2,
      caption: report.operationalPhotoCaption2,
      label: "Foto 2",
    },
    {
      url: report.operationalPhotoUrl3,
      caption: report.operationalPhotoCaption3,
      label: "Foto 3",
    },
    {
      url: report.operationalPhotoUrl4,
      caption: report.operationalPhotoCaption4,
      label: "Foto 4",
    },
  ];

  const loaded: LoadedPhoto[] = [];

  for (const slot of slots) {
    const buffer = await loadUploadImageBuffer(slot.url, 900, 675);
    if (buffer) {
      loaded.push({
        label: slot.label,
        caption: slot.caption,
        buffer,
      });
    }
  }

  return loaded;
}

async function loadRemarksPhotos(
  report: ShiftReportDTO,
): Promise<LoadedRemarkPhoto[]> {
  const slots = [
    {
      sectionTitle: "1. Chip Quality",
      remarkText: report.chipQualityRemarks,
      url: report.chipQualityRemarksPhotoUrl,
    },
    {
      sectionTitle: "3.1 Geometry",
      remarkText: report.geometryRemarks,
      url: report.geometryRemarksPhotoUrl,
    },
    {
      sectionTitle: "3.2 Part (1)",
      remarkText: report.partRemarks,
      url: report.partRemarksPhotoUrl,
    },
    {
      sectionTitle: "3.2 Part (2)",
      remarkText: report.partRemarks2,
      url: report.partRemarks2PhotoUrl,
    },
    {
      sectionTitle: "3.2 Part (3)",
      remarkText: report.partRemarks3,
      url: report.partRemarks3PhotoUrl,
    },
    {
      sectionTitle: "3.2 Part (4)",
      remarkText: report.partRemarks4,
      url: report.partRemarks4PhotoUrl,
    },
    {
      sectionTitle: "4. Raw Material (1)",
      remarkText: report.rawMaterialRemarks,
      url: report.rawMaterialRemarksPhotoUrl,
    },
    {
      sectionTitle: "4. Raw Material (2)",
      remarkText: report.rawMaterialRemarks2,
      url: report.rawMaterialRemarks2PhotoUrl,
    },
  ];

  const loaded: LoadedRemarkPhoto[] = [];

  for (const slot of slots) {
    const buffer = await loadUploadImageBuffer(slot.url, 900, 675);
    loaded.push({
      sectionTitle: slot.sectionTitle,
      remarkText: slot.remarkText,
      buffer,
    });
  }

  return loaded;
}

const LOGO_PATH = path.join(process.cwd(), "public", "Andritz-Symbol.png");
let cachedLogoBuffer: Buffer | null | undefined;

async function loadCompanyLogo(): Promise<Buffer | null> {
  if (cachedLogoBuffer !== undefined) {
    return cachedLogoBuffer;
  }
  try {
    const rawBuffer = await fs.readFile(LOGO_PATH);
    cachedLogoBuffer = await sharp(rawBuffer)
      .trim()
      .resize({ height: 180 })
      .png()
      .toBuffer();
    return cachedLogoBuffer;
  } catch {
    cachedLogoBuffer = null;
    return null;
  }
}

function drawVerticalTagline(doc: PDFKit.PDFDocument) {
  doc.save();
  doc.translate(562, 460);
  doc.rotate(-90);
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .fillColor(BLUE)
    .text("ENGINEERED SUCCESS", 0, 0, {
      characterSpacing: 1.5,
      lineBreak: false,
    });
  doc.restore();
}

function drawPageHeader(
  doc: PDFKit.PDFDocument,
  logoBuffer: Buffer | null,
  subtitleRight?: string,
) {
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor(DARK)
    .text("Shift Report", PAGE_LEFT, 44);

  if (logoBuffer) {
    doc.image(logoBuffer, PAGE_LEFT + CONTENT_W - 64, 28, {
      fit: [64, 52],
      align: "right",
      valign: "center",
    });
  }

  if (subtitleRight) {
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text(subtitleRight, PAGE_LEFT + CONTENT_W - 110, 88, {
        width: 110,
        align: "right",
      });
  }
}

function drawCellBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  lineWidth = 0.65,
  strokeColor = INNER_BORDER,
) {
  doc.save().lineWidth(lineWidth).strokeColor(strokeColor).rect(x, y, w, h).stroke().restore();
}

function drawDoubleFrame(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  drawCellBox(doc, x, y, w, h, 0.8, BORDER);
  drawCellBox(doc, x + 2, y + 2, w - 4, h - 4, 0.55, INNER_BORDER);
}

function drawCheckCell(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  checked: boolean,
  markColor = DARK,
) {
  drawCellBox(doc, x, y, w, h);
  if (checked) {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(markColor)
      .text("X", x, y + (h - 9) / 2, {
        width: w,
        align: "center",
        lineBreak: false,
      });
  }
}

function drawRemarksHeader(
  doc: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  hasPhoto = false,
  boxWidth?: number,
) {
  doc
    .font("Helvetica-Oblique")
    .fontSize(8.5)
    .fillColor(BLUE)
    .text(title, x, y, { underline: true, lineBreak: false });

  if (hasPhoto && boxWidth) {
    doc
      .font("Helvetica")
      .fontSize(6)
      .fillColor(MUTED)
      .text("[Foto terlampir]", x, y + 1.5, {
        width: boxWidth - 10,
        align: "right",
        lineBreak: false,
      });
  }
}

function drawPartitionedRemarks(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number,
  slots: { value: string | null; hasPhoto?: boolean }[],
) {
  drawCellBox(doc, x, y, w, h);
  const hdrH = 16;
  drawRemarksHeader(doc, "Remarks", x + 5, y + 4);

  const bodyY = y + hdrH;
  const bodyH = h - hdrH;
  const slotH = bodyH / slots.length;

  slots.forEach((slot, index) => {
    const sy = bodyY + index * slotH;
    drawCellBox(doc, x, sy, w, slotH, 0.45, "#CBD5E1");
    if (slot.value) {
      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(DARK)
        .text(slot.value, x + 5, sy + 4, {
          width: w - 10,
          height: slotH - (slot.hasPhoto ? 14 : 8),
          ellipsis: true,
        });
    }
    if (slot.hasPhoto) {
      doc
        .font("Helvetica")
        .fontSize(5.5)
        .fillColor(MUTED)
        .text("[Foto terlampir]", x + 5, sy + slotH - 9, {
          width: w - 10,
          align: "right",
          lineBreak: false,
        });
    }
  });
}

function formatPdfDate(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return formatDateDisplay(isoDate).replace(/\//g, " / ");
}

function fmtOptNum(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || Number.isNaN(val)) return "";
  return formatNumber(val, decimals);
}

function drawPage1(
  doc: PDFKit.PDFDocument,
  report: ShiftReportDTO,
  photos: LoadedPhoto[],
  logoBuffer: Buffer | null,
) {
  drawPageHeader(doc, logoBuffer);
  drawVerticalTagline(doc);

  // =========================================================
  // TOP METADATA GRID (y = 92 .. 216)
  // =========================================================
  const mY = 92;
  const c1W = 142;
  const c2W = 94;
  const c3W = CONTENT_W - c1W - c2W; // 260
  const r1H = 29;
  const r2H = 29;
  const r3H = 19;
  const r4H = 25;
  const r5H = 19;

  // Row 1: Customer | Date | Inspection by
  drawCellBox(doc, PAGE_LEFT, mY, c1W, r1H);
  drawCellBox(doc, PAGE_LEFT + c1W, mY, c2W, r1H);
  drawCellBox(doc, PAGE_LEFT + c1W + c2W, mY, c3W, r1H);

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Customer", PAGE_LEFT + 5, mY + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${report.customer}`, PAGE_LEFT + 5, mY + 16, { width: c1W - 10 });

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Date", PAGE_LEFT + c1W + 5, mY + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${formatPdfDate(report.reportDate)}`, PAGE_LEFT + c1W + 5, mY + 16, {
      width: c2W - 10,
    });

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Inspection by", PAGE_LEFT + c1W + c2W + 5, mY + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${report.inspectionBy}`, PAGE_LEFT + c1W + c2W + 5, mY + 16, {
      width: c3W - 10,
      ellipsis: true,
    });

  // Row 2: Chipper type | Chip Length Set Up | Type of knife system
  const y2 = mY + r1H;
  drawCellBox(doc, PAGE_LEFT, y2, c1W, r2H);
  drawCellBox(doc, PAGE_LEFT + c1W, y2, c2W, r2H);
  drawCellBox(doc, PAGE_LEFT + c1W + c2W, y2, c3W, r2H);

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Chipper type", PAGE_LEFT + 5, y2 + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${CHIPPER_LABEL_MAP[report.chipperType]}`, PAGE_LEFT + 5, y2 + 16);

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Chip Length Set Up", PAGE_LEFT + c1W + 5, y2 + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(
      `: ${formatNumber(report.chipLengthSetUp, 2)} mm`,
      PAGE_LEFT + c1W + 5,
      y2 + 16,
    );

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Type of knife system", PAGE_LEFT + c1W + c2W + 5, y2 + 4);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${report.typeOfKnifeSystem}`, PAGE_LEFT + c1W + c2W + 5, y2 + 16, {
      width: c3W - 10,
    });

  // Row 3: Type of inspection | : Daily Inspection
  const y3 = y2 + r2H;
  drawCellBox(doc, PAGE_LEFT, y3, c1W, r3H);
  drawCellBox(doc, PAGE_LEFT + c1W, y3, c2W + c3W, r3H);

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text("Type of inspection", PAGE_LEFT + 5, y3 + 5.5);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`: ${report.typeOfInspection}`, PAGE_LEFT + c1W + 5, y3 + 5.5);

  // Row 4-5: Adjust Chip Length From/To | Signature | Start/Stop/Shift/Sampling
  const y4 = y3 + r3H;
  const y5 = y4 + r4H;
  const adjW = c1W / 2; // 71 each
  const sigW = 84;
  const rightMetaW = CONTENT_W - c1W - sigW; // 270
  const rmLbl1 = 74;
  const rmVal1 = 58;
  const rmLbl2 = 80;
  const rmVal2 = rightMetaW - rmLbl1 - rmVal1 - rmLbl2; // 58

  // Adjust From/To
  drawCellBox(doc, PAGE_LEFT, y4, adjW, r4H);
  drawCellBox(doc, PAGE_LEFT + adjW, y4, adjW, r4H);
  drawCellBox(doc, PAGE_LEFT, y5, adjW, r5H);
  drawCellBox(doc, PAGE_LEFT + adjW, y5, adjW, r5H);

  doc.font("Helvetica").fontSize(6.5).fillColor(DARK);
  doc.text("Adjust Chip Length\nFrom :", PAGE_LEFT + 3, y4 + 4, {
    width: adjW - 6,
    align: "center",
  });
  doc.text("Adjust Chip Length\nTo :", PAGE_LEFT + adjW + 3, y4 + 4, {
    width: adjW - 6,
    align: "center",
  });

  const fromText =
    report.adjustChipLengthFrom !== null
      ? `${formatNumber(report.adjustChipLengthFrom, 2)} mm`
      : "mm";
  const toText =
    report.adjustChipLengthTo !== null
      ? `${formatNumber(report.adjustChipLengthTo, 2)} mm`
      : "mm";

  doc.font("Helvetica").fontSize(8).fillColor(DARK);
  doc.text(fromText, PAGE_LEFT + 3, y5 + 5.5, {
    width: adjW - 6,
    align: "center",
  });
  doc.text(toText, PAGE_LEFT + adjW + 3, y5 + 5.5, {
    width: adjW - 6,
    align: "center",
  });

  // Signature (blank by request)
  drawCellBox(doc, PAGE_LEFT + c1W, y4, sigW, r4H + r5H);
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text("Signature", PAGE_LEFT + c1W + 4, y4 + 4, {
      width: sigW - 8,
      align: "center",
    });
  if (report.signature) {
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text(report.signature, PAGE_LEFT + c1W + 4, y4 + 18, {
        width: sigW - 8,
        align: "center",
      });
  }

  // Start / Stop / Shift / Sampling grid
  const rmX = PAGE_LEFT + c1W + sigW;
  drawCellBox(doc, rmX, y4, rmLbl1, r4H);
  drawCellBox(doc, rmX + rmLbl1, y4, rmVal1, r4H);
  drawCellBox(doc, rmX + rmLbl1 + rmVal1, y4, rmLbl2, r4H);
  drawCellBox(doc, rmX + rmLbl1 + rmVal1 + rmLbl2, y4, rmVal2, r4H);

  drawCellBox(doc, rmX, y5, rmLbl1, r5H);
  drawCellBox(doc, rmX + rmLbl1, y5, rmVal1, r5H);
  drawCellBox(doc, rmX + rmLbl1 + rmVal1, y5, rmLbl2, r5H);
  drawCellBox(doc, rmX + rmLbl1 + rmVal1 + rmLbl2, y5, rmVal2, r5H);

  doc.font("Helvetica").fontSize(7).fillColor(DARK);
  doc.text("Start Chipper\nAfter Knife Change", rmX + 2, y4 + 4, {
    width: rmLbl1 - 4,
    align: "center",
  });
  doc.text(
    "Stop Chipper\nBefore Knife Change",
    rmX + rmLbl1 + rmVal1 + 2,
    y4 + 4,
    {
      width: rmLbl2 - 4,
      align: "center",
    },
  );

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text(report.startChipperTime, rmX + rmLbl1 + 2, y4 + 8, {
    width: rmVal1 - 4,
    align: "center",
  });
  doc.text(
    report.stopChipperTime,
    rmX + rmLbl1 + rmVal1 + rmLbl2 + 2,
    y4 + 8,
    {
      width: rmVal2 - 4,
      align: "center",
    },
  );

  doc.font("Helvetica").fontSize(7.5).fillColor(DARK);
  doc.text("Shift", rmX + 2, y5 + 5.5, {
    width: rmLbl1 - 4,
    align: "center",
  });
  doc.text("Sampling Time", rmX + rmLbl1 + rmVal1 + 2, y5 + 5.5, {
    width: rmLbl2 - 4,
    align: "center",
  });

  doc.font("Helvetica-Bold").fontSize(8).fillColor(DARK);
  doc.text(report.shift, rmX + rmLbl1 + 2, y5 + 5.5, {
    width: rmVal1 - 4,
    align: "center",
  });
  doc.text(report.samplingTime, rmX + rmLbl1 + rmVal1 + rmLbl2 + 2, y5 + 5.5, {
    width: rmVal2 - 4,
    align: "center",
  });

  // =========================================================
  // SECTION 1: CHIP QUALITY + DATA SOURCE + SAMPLING + REMARKS
  // =========================================================
  const s1Y = y5 + r5H + 10;
  const s1RowH = 20;
  const s1H = s1RowH * 9 + 6; // 186
  drawDoubleFrame(doc, PAGE_LEFT, s1Y, CONTENT_W, s1H);

  const innerX = PAGE_LEFT + 3;
  const innerY = s1Y + 3;
  const leftPaneW = 220;
  const rightPaneX = innerX + leftPaneW + 3;
  const rightPaneW = CONTENT_W - leftPaneW - 9; // 270

  // Left: 1 | Chip Quality + 1.1..1.8
  const colNumW = 30;
  const colNameW = 122;
  const colPctW = leftPaneW - colNumW - colNameW; // 68

  drawCellBox(doc, innerX, innerY, colNumW, s1RowH);
  drawCellBox(doc, innerX + colNumW, innerY, colNameW + colPctW, s1RowH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("1", innerX, innerY + 6, { width: colNumW, align: "center" });
  doc.text("Chip Quality", innerX + colNumW, innerY + 6, {
    width: colNameW + colPctW,
    align: "center",
  });

  CHIP_QUALITY_METRICS.forEach((metric, index) => {
    const ry = innerY + s1RowH * (index + 1);
    const val = report[metric.key];
    drawCellBox(doc, innerX, ry, colNumW, s1RowH);
    drawCellBox(doc, innerX + colNumW, ry, colNameW, s1RowH);
    drawCellBox(doc, innerX + colNumW + colNameW, ry, colPctW, s1RowH);

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(DARK)
      .text(metric.code, innerX, ry + 6, { width: colNumW, align: "center" });
    doc.text(metric.label, innerX + colNumW + 5, ry + 6, {
      width: colNameW - 8,
    });
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(DARK)
      .text(`${formatNumber(val, 2)} %`, innerX + colNumW + colNameW + 3, ry + 6, {
        width: colPctW - 8,
        align: "right",
      });
  });

  // Right: 2. Data Source, 3. Sampling, Total Accept, P+F, Remarks
  const rCodeW = 30;
  const rCheckW = 34;
  const rTextW = rightPaneW - rCodeW - rCheckW;

  // Row 1: 2. | Data Source
  drawCellBox(doc, rightPaneX, innerY, rCodeW, s1RowH);
  drawCellBox(doc, rightPaneX + rCodeW, innerY, rightPaneW - rCodeW, s1RowH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("2.", rightPaneX, innerY + 6, { width: rCodeW, align: "center" });
  doc.text("Data Source", rightPaneX + rCodeW, innerY + 6, {
    width: rightPaneW - rCodeW,
    align: "center",
  });

  // Row 2: 2.1 | [X] | Chip Classifier
  const s1r2Y = innerY + s1RowH;
  drawCellBox(doc, rightPaneX, s1r2Y, rCodeW, s1RowH);
  drawCheckCell(
    doc,
    rightPaneX + rCodeW,
    s1r2Y,
    rCheckW,
    s1RowH,
    report.dataSourceChipClassifier,
  );
  drawCellBox(doc, rightPaneX + rCodeW + rCheckW, s1r2Y, rTextW, s1RowH);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("2.1", rightPaneX, s1r2Y + 6, { width: rCodeW, align: "center" });
  doc
    .fillColor(DARK)
    .text("Chip Classifier", rightPaneX + rCodeW + rCheckW + 6, s1r2Y + 6);

  // Row 3: 3. | Sampling is Done by
  const s1r3Y = innerY + s1RowH * 2;
  drawCellBox(doc, rightPaneX, s1r3Y, rCodeW, s1RowH);
  drawCellBox(doc, rightPaneX + rCodeW, s1r3Y, rightPaneW - rCodeW, s1RowH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("3.", rightPaneX, s1r3Y + 6, { width: rCodeW, align: "center" });
  doc.text("Sampling is Done by", rightPaneX + rCodeW, s1r3Y + 6, {
    width: rightPaneW - rCodeW,
    align: "center",
  });

  // Row 4: 3.1 | [X] | Costumer
  const s1r4Y = innerY + s1RowH * 3;
  drawCellBox(doc, rightPaneX, s1r4Y, rCodeW, s1RowH);
  drawCheckCell(
    doc,
    rightPaneX + rCodeW,
    s1r4Y,
    rCheckW,
    s1RowH,
    report.samplingDoneByCostumer,
  );
  drawCellBox(doc, rightPaneX + rCodeW + rCheckW, s1r4Y, rTextW, s1RowH);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("3.1", rightPaneX, s1r4Y + 6, { width: rCodeW, align: "center" });
  doc
    .fillColor(DARK)
    .text("Costumer", rightPaneX + rCodeW + rCheckW + 6, s1r4Y + 6);

  // Row 5: Total Accept | val% | P+F | val%
  const s1r5Y = innerY + s1RowH * 4;
  const taLblW = 72;
  const taValW = 68;
  const pfLblW = 46;
  const pfValW = rightPaneW - taLblW - taValW - pfLblW; // 84

  drawCellBox(doc, rightPaneX, s1r5Y, taLblW, s1RowH);
  drawCellBox(doc, rightPaneX + taLblW, s1r5Y, taValW, s1RowH);
  drawCellBox(doc, rightPaneX + taLblW + taValW, s1r5Y, pfLblW, s1RowH);
  drawCellBox(doc, rightPaneX + taLblW + taValW + pfLblW, s1r5Y, pfValW, s1RowH);

  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text("Total Accept", rightPaneX, s1r5Y + 6, {
      width: taLblW,
      align: "center",
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(`${formatNumber(report.totalAccept, 2)} %`, rightPaneX + taLblW, s1r5Y + 6, {
      width: taValW,
      align: "center",
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text("P+F", rightPaneX + taLblW + taValW, s1r5Y + 6, {
      width: pfLblW,
      align: "center",
    });
  doc
    .font("Helvetica-Bold")
    .fontSize(8)
    .fillColor(DARK)
    .text(
      `${formatNumber(report.pinPlusFines, 2)} %`,
      rightPaneX + taLblW + taValW + pfLblW,
      s1r5Y + 6,
      { width: pfValW, align: "center" },
    );

  // Row 6-9: Remarks Box
  const rem1Y = innerY + s1RowH * 5;
  const rem1H = s1RowH * 4;
  drawCellBox(doc, rightPaneX, rem1Y, rightPaneW, rem1H);
  drawRemarksHeader(
    doc,
    "Remarks",
    rightPaneX + 5,
    rem1Y + 5,
    Boolean(report.chipQualityRemarksPhotoUrl),
    rightPaneW,
  );
  if (report.chipQualityRemarks) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(report.chipQualityRemarks, rightPaneX + 5, rem1Y + 18, {
        width: rightPaneW - 10,
        height: rem1H - 22,
        ellipsis: true,
      });
  }

  // =========================================================
  // SECTION 2: OPERATIONAL CONDITION + 4 PHOTO SLOTS
  // =========================================================
  const s2Y = s1Y + s1H + 10;
  const s2HeaderH = 22;
  const s2LeftW = 224;
  const s2RightX = innerX + s2LeftW + 3;
  const s2RightW = CONTENT_W - s2LeftW - 9; // 266

  const s2LeftRowsH = 29 + 21 + 21 + 29 + 21 + 21 + 21 + 21 + 21; // 205
  const s2TotalH = s2HeaderH + s2LeftRowsH + 8; // 235 -> ends y ~ 659
  drawDoubleFrame(doc, PAGE_LEFT, s2Y, CONTENT_W, s2TotalH);

  // Header: 2 | Operational Condition
  const s2HdrCodeW = 36;
  drawCellBox(doc, innerX, s2Y + 3, s2HdrCodeW, s2HeaderH);
  drawCellBox(
    doc,
    innerX + s2HdrCodeW,
    s2Y + 3,
    CONTENT_W - s2HdrCodeW - 6,
    s2HeaderH,
  );
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("2", innerX, s2Y + 9, { width: s2HdrCodeW, align: "center" });
  doc.text("Operational Condition", innerX + s2HdrCodeW, s2Y + 9, {
    width: CONTENT_W - s2HdrCodeW - 6,
    align: "center",
  });

  let curY = s2Y + 3 + s2HeaderH + 2;
  const photoStartY = curY;

  const s2CodeW = 36;
  const s2CheckW = 28;
  const s2DescW = s2LeftW - s2CodeW; // 188

  // 2.1 Layer (Visual Observation)
  drawCellBox(doc, innerX, curY, s2CodeW, 29);
  drawCellBox(doc, innerX + s2CodeW, curY, s2DescW, 29);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("2.1", innerX, curY + 10, { width: s2CodeW, align: "center" });
  doc.text("Layer\n(Visual Observation)", innerX + s2CodeW, curY + 5, {
    width: s2DescW,
    align: "center",
  });
  curY += 29;

  // 2.1.1 Single Layer
  drawCellBox(doc, innerX, curY, s2CodeW, 21);
  drawCheckCell(
    doc,
    innerX + s2CodeW,
    curY,
    s2CheckW,
    21,
    report.layerObservation === "SINGLE_LAYER",
  );
  drawCellBox(
    doc,
    innerX + s2CodeW + s2CheckW,
    curY,
    s2DescW - s2CheckW,
    21,
  );
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("2.1.1", innerX, curY + 6.5, { width: s2CodeW, align: "center" });
  doc.text("Single Layer", innerX + s2CodeW + s2CheckW, curY + 6.5, {
    width: s2DescW - s2CheckW,
    align: "center",
  });
  curY += 21;

  // 2.1.2 Multi Layer
  drawCellBox(doc, innerX, curY, s2CodeW, 21);
  drawCheckCell(
    doc,
    innerX + s2CodeW,
    curY,
    s2CheckW,
    21,
    report.layerObservation === "MULTI_LAYER",
  );
  drawCellBox(
    doc,
    innerX + s2CodeW + s2CheckW,
    curY,
    s2DescW - s2CheckW,
    21,
  );
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("2.1.2", innerX, curY + 6.5, { width: s2CodeW, align: "center" });
  doc.text("Multi Layer", innerX + s2CodeW + s2CheckW, curY + 6.5, {
    width: s2DescW - s2CheckW,
    align: "center",
  });
  curY += 21;

  // 2.2 Log Condition (Visual Observation)
  drawCellBox(doc, innerX, curY, s2CodeW, 29);
  drawCellBox(doc, innerX + s2CodeW, curY, s2DescW, 29);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("2.2", innerX, curY + 10, { width: s2CodeW, align: "center" });
  doc.text("Log Condition\n(Visual Observation)", innerX + s2CodeW, curY + 5, {
    width: s2DescW,
    align: "center",
  });
  curY += 29;

  // 2.2.1 Dry & 2.2.2 Fresh
  const dryFreshRows = [
    { code: "2.2.1", label: "Dry", checked: report.logConditionDry },
    { code: "2.2.2", label: "Fresh", checked: report.logConditionFresh },
  ];
  for (const row of dryFreshRows) {
    drawCellBox(doc, innerX, curY, s2CodeW, 21);
    drawCheckCell(doc, innerX + s2CodeW, curY, s2CheckW, 21, row.checked);
    drawCellBox(
      doc,
      innerX + s2CodeW + s2CheckW,
      curY,
      s2DescW - s2CheckW,
      21,
    );
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(row.code, innerX, curY + 6.5, { width: s2CodeW, align: "center" });
    doc.text(row.label, innerX + s2CodeW + s2CheckW, curY + 6.5, {
      width: s2DescW - s2CheckW,
      align: "center",
    });
    curY += 21;
  }

  // 2.2.3 - 2.2.5 Yes/No rows
  const ynRows = [
    { code: "2.2.3", label: "Lots Of Bark", val: report.lotsOfBark },
    { code: "2.2.4", label: "Lots Of Sand", val: report.lotsOfSand },
    { code: "2.2.5", label: "There is a Stone", val: report.thereIsAStone },
  ];
  const ynNameW = 84;
  const ynBoxW = 23;
  const ynLblW = (s2DescW - ynNameW - ynBoxW * 2) / 2; // 29

  for (const row of ynRows) {
    drawCellBox(doc, innerX, curY, s2CodeW, 21);
    drawCellBox(doc, innerX + s2CodeW, curY, ynNameW, 21);
    drawCheckCell(
      doc,
      innerX + s2CodeW + ynNameW,
      curY,
      ynBoxW,
      21,
      row.val === true,
    );
    drawCellBox(doc, innerX + s2CodeW + ynNameW + ynBoxW, curY, ynLblW, 21);
    drawCheckCell(
      doc,
      innerX + s2CodeW + ynNameW + ynBoxW + ynLblW,
      curY,
      ynBoxW,
      21,
      row.val === false,
    );
    drawCellBox(
      doc,
      innerX + s2CodeW + ynNameW + ynBoxW * 2 + ynLblW,
      curY,
      ynLblW,
      21,
    );

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(row.code, innerX, curY + 6.5, { width: s2CodeW, align: "center" });
    doc.text(row.label, innerX + s2CodeW, curY + 6.5, {
      width: ynNameW,
      align: "center",
    });
    doc.text("Yes", innerX + s2CodeW + ynNameW + ynBoxW, curY + 6.5, {
      width: ynLblW,
      align: "center",
    });
    doc.text(
      "No",
      innerX + s2CodeW + ynNameW + ynBoxW * 2 + ynLblW,
      curY + 6.5,
      { width: ynLblW, align: "center" },
    );

    curY += 21;
  }

  // Right: Photo Pane (2x2 grid for up to 4 uploaded photos)
  const photoBoxH = curY - photoStartY;
  drawCellBox(doc, s2RightX, photoStartY, s2RightW, photoBoxH);
  drawRemarksHeader(doc, "Photo", s2RightX + 6, photoStartY + 5);

  if (photos.length === 0) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "Tidak ada foto terlampir",
        s2RightX + 6,
        photoStartY + photoBoxH / 2 - 5,
        { width: s2RightW - 12, align: "center" },
      );
  } else {
    const gridPad = 6;
    const topOffset = 18;
    const availW = s2RightW - gridPad * 2;
    const availH = photoBoxH - topOffset - gridPad;
    const cols = photos.length === 1 ? 1 : 2;
    const rows = photos.length <= 2 ? 1 : 2;
    const gap = 5;
    const slotW = (availW - gap * (cols - 1)) / cols;
    const slotH = (availH - gap * (rows - 1)) / rows;

    photos.forEach((photo, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const sx = s2RightX + gridPad + col * (slotW + gap);
      const sy = photoStartY + topOffset + row * (slotH + gap);

      const captionText = photo.caption
        ? `${photo.label}: ${photo.caption}`
        : photo.label;
      const captionBoxH = photo.caption ? 20 : 12;

      drawCellBox(doc, sx, sy, slotW, slotH, 0.5, "#CBD5E1");
      doc.image(photo.buffer, sx + 2, sy + 2, {
        fit: [slotW - 4, slotH - captionBoxH - 3],
        align: "center",
        valign: "center",
      });
      doc
        .font("Helvetica")
        .fontSize(6)
        .fillColor(photo.caption ? DARK : MUTED)
        .text(captionText, sx + 3, sy + slotH - captionBoxH, {
          width: slotW - 6,
          height: captionBoxH - 1,
          align: "left",
          ellipsis: true,
        });
    });
  }

  // Page 1 Footer matching Tugas Rizki.pdf
  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(BLUE)
    .text("2020-06-01 / ML", PAGE_LEFT, 775, { lineBreak: false });
}

function drawPage2(
  doc: PDFKit.PDFDocument,
  report: ShiftReportDTO,
  logoBuffer: Buffer | null,
  totalPages: number,
) {
  doc.addPage();
  drawPageHeader(doc, logoBuffer, `Sida: 2 (totalt ${totalPages})`);
  drawVerticalTagline(doc);

  // =========================================================
  // SECTION 3: CHIPPER CONDITION (Geometry + Part) & REMARKS
  // =========================================================
  const s3Y = 104;
  const s3LeftW = 342;
  const s3RemX = PAGE_LEFT + 3 + s3LeftW + 3;
  const s3RemW = CONTENT_W - s3LeftW - 9; // 148

  const s3HdrH = 22;
  const subHdrH = 19;
  const colHdrH = 19;
  const geoRowH = 21;
  const geoSectionH = s3HdrH + subHdrH + colHdrH + geoRowH * 2; // 102

  const partHdrH = 19;
  const partColH = 19;
  const partRowH = 21;
  const partSectionH = partHdrH + partColH + partRowH * CHIPPER_PARTS.length; // 38 + 252 = 290

  const s3TotalH = geoSectionH + partSectionH + 10; // 402
  drawDoubleFrame(doc, PAGE_LEFT, s3Y, CONTENT_W, s3TotalH);

  const inX = PAGE_LEFT + 3;
  let cy = s3Y + 3;
  const geoRemStartY = cy;

  // 3 | Chipper Condition
  const s3CodeW = 34;
  drawCellBox(doc, inX, cy, s3CodeW, s3HdrH);
  drawCellBox(doc, inX + s3CodeW, cy, s3LeftW - s3CodeW, s3HdrH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("3", inX, cy + 6.5, { width: s3CodeW, align: "center" });
  doc.text("Chipper Condition", inX + s3CodeW, cy + 6.5, {
    width: s3LeftW - s3CodeW,
    align: "center",
  });
  cy += s3HdrH + 2;

  // Geometry Subheader
  drawCellBox(doc, inX, cy, s3LeftW, subHdrH);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("Geometry", inX, cy + 5.5, { width: s3LeftW, align: "center" });
  cy += subHdrH;

  // 3.1 | Setting | mm | Last Setting Date
  const geoSetW = 104;
  const geoMmW = 38;
  const geoDateW = s3LeftW - s3CodeW - geoSetW - geoMmW; // 166
  drawCellBox(doc, inX, cy, s3CodeW, colHdrH);
  drawCellBox(doc, inX + s3CodeW, cy, geoSetW, colHdrH);
  drawCellBox(doc, inX + s3CodeW + geoSetW, cy, geoMmW, colHdrH);
  drawCellBox(doc, inX + s3CodeW + geoSetW + geoMmW, cy, geoDateW, colHdrH);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("3.1", inX, cy + 5.5, { width: s3CodeW, align: "center" });
  doc.text("Setting", inX + s3CodeW, cy + 5.5, {
    width: geoSetW,
    align: "center",
  });
  doc.text("mm", inX + s3CodeW + geoSetW, cy + 5.5, {
    width: geoMmW,
    align: "center",
  });
  doc.text("Last Setting Date", inX + s3CodeW + geoSetW + geoMmW, cy + 5.5, {
    width: geoDateW,
    align: "center",
  });
  cy += colHdrH;

  // 3.1.1 T Dimension & 3.2.2 Clearance Anvil (preserving Tugas Rizki.pdf numbering)
  const geoRows = [
    {
      code: "3.1.1",
      label: "T Dimension",
      mm: fmtOptNum(report.tDimensionMm, 2),
      date: formatPdfDate(report.tDimensionLastSettingDate),
    },
    {
      code: "3.2.2",
      label: "Clearance Anvil",
      mm: fmtOptNum(report.clearanceAnvilMm, 2),
      date: formatPdfDate(report.clearanceAnvilLastSettingDate),
    },
  ];
  for (const row of geoRows) {
    drawCellBox(doc, inX, cy, s3CodeW, geoRowH);
    drawCellBox(doc, inX + s3CodeW, cy, geoSetW, geoRowH);
    drawCellBox(doc, inX + s3CodeW + geoSetW, cy, geoMmW, geoRowH);
    drawCellBox(doc, inX + s3CodeW + geoSetW + geoMmW, cy, geoDateW, geoRowH);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(row.code, inX, cy + 6.5, { width: s3CodeW, align: "center" });
    doc.text(row.label, inX + s3CodeW, cy + 6.5, {
      width: geoSetW,
      align: "center",
    });
    doc
      .font("Helvetica-Bold")
      .text(row.mm, inX + s3CodeW + geoSetW, cy + 6.5, {
        width: geoMmW,
        align: "center",
      });
    doc
      .font("Helvetica")
      .text(row.date, inX + s3CodeW + geoSetW + geoMmW, cy + 6.5, {
        width: geoDateW,
        align: "center",
      });
    cy += geoRowH;
  }

  // Geometry Remarks (Right Box)
  const geoRemH = cy - geoRemStartY;
  drawCellBox(doc, s3RemX, geoRemStartY, s3RemW, geoRemH);
  drawRemarksHeader(
    doc,
    "Remarks",
    s3RemX + 5,
    geoRemStartY + 5,
    Boolean(report.geometryRemarksPhotoUrl),
    s3RemW,
  );
  if (report.geometryRemarks) {
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(report.geometryRemarks, s3RemX + 5, geoRemStartY + 18, {
        width: s3RemW - 10,
        height: geoRemH - 22,
        ellipsis: true,
      });
  }

  cy += 2;
  const partRemStartY = cy;

  // Part Subheader
  drawCellBox(doc, inX, cy, s3LeftW, partHdrH);
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("Part", inX, cy + 5.5, { width: s3LeftW, align: "center" });
  cy += partHdrH;

  // 3.2 | Description | Condition
  const pDescW = 104;
  const pCondW = s3LeftW - s3CodeW - pDescW; // 204
  drawCellBox(doc, inX, cy, s3CodeW, partColH);
  drawCellBox(doc, inX + s3CodeW, cy, pDescW, partColH);
  drawCellBox(doc, inX + s3CodeW + pDescW, cy, pCondW, partColH);

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("3.2", inX, cy + 5.5, { width: s3CodeW, align: "center" });
  doc.text("Description", inX + s3CodeW, cy + 5.5, {
    width: pDescW,
    align: "center",
  });
  doc.text("Condition", inX + s3CodeW + pDescW, cy + 5.5, {
    width: pCondW,
    align: "center",
  });
  cy += partColH;

  // 12 Chipper Part Rows: [X] Good | [X] Worn Out | [X] Broken
  const pChkW = 20;
  const pGoodLblW = 36;
  const pWornLblW = 52;
  const pBrokLblW = pCondW - pChkW * 3 - pGoodLblW - pWornLblW; // 56

  for (const part of CHIPPER_PARTS) {
    const cond = report[part.key];
    let px = inX;

    drawCellBox(doc, px, cy, s3CodeW, partRowH);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(part.code, px, cy + 6.5, { width: s3CodeW, align: "center" });
    px += s3CodeW;

    drawCellBox(doc, px, cy, pDescW, partRowH);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text(part.label, px + 3, cy + 6.5, {
        width: pDescW - 6,
        align: "center",
        lineBreak: false,
      });
    px += pDescW;

    drawCheckCell(doc, px, cy, pChkW, partRowH, cond === "GOOD", DARK);
    px += pChkW;
    drawCellBox(doc, px, cy, pGoodLblW, partRowH);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text("Good", px, cy + 6.5, { width: pGoodLblW, align: "center" });
    px += pGoodLblW;

    drawCheckCell(doc, px, cy, pChkW, partRowH, cond === "WORN_OUT", DARK);
    px += pChkW;
    drawCellBox(doc, px, cy, pWornLblW, partRowH);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text("Worn Out", px, cy + 6.5, { width: pWornLblW, align: "center" });
    px += pWornLblW;

    drawCheckCell(doc, px, cy, pChkW, partRowH, cond === "BROKEN", DARK);
    px += pChkW;
    drawCellBox(doc, px, cy, pBrokLblW, partRowH);
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(DARK)
      .text("Broken", px, cy + 6.5, { width: pBrokLblW, align: "center" });

    cy += partRowH;
  }

  // Part Remarks (Right Box - 4 Bagan)
  const partRemH = cy - partRemStartY;
  drawPartitionedRemarks(doc, s3RemX, partRemStartY, s3RemW, partRemH, [
    {
      value: report.partRemarks,
      hasPhoto: Boolean(report.partRemarksPhotoUrl),
    },
    {
      value: report.partRemarks2,
      hasPhoto: Boolean(report.partRemarks2PhotoUrl),
    },
    {
      value: report.partRemarks3,
      hasPhoto: Boolean(report.partRemarks3PhotoUrl),
    },
    {
      value: report.partRemarks4,
      hasPhoto: Boolean(report.partRemarks4PhotoUrl),
    },
  ]);

  // =========================================================
  // SECTION 4: RAW MATERIAL + REMARKS
  // =========================================================
  const s4Y = s3Y + s3TotalH + 10;
  const s4RowH = 22;
  const s4TotalH = s4RowH * 7 + 8; // 162
  drawDoubleFrame(doc, PAGE_LEFT, s4Y, CONTENT_W, s4TotalH);

  let ry = s4Y + 3;
  const s4StartY = ry;

  // 4 | Raw Material
  drawCellBox(doc, inX, ry, s3CodeW, s4RowH);
  drawCellBox(doc, inX + s3CodeW, ry, s3LeftW - s3CodeW, s4RowH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("4", inX, ry + 7, { width: s3CodeW, align: "center" });
  doc.text("Raw Material", inX + s3CodeW, ry + 7, {
    width: s3LeftW - s3CodeW,
    align: "center",
  });
  ry += s4RowH + 2;

  const s4LblW = 132;
  const s4RightW = s3LeftW - s3CodeW - s4LblW; // 176
  const s4ValW = 104;
  const s4UnitW = s4RightW - s4ValW; // 72

  // 4.1 Log Yard Number (full right value)
  drawCellBox(doc, inX, ry, s3CodeW, s4RowH);
  drawCellBox(doc, inX + s3CodeW, ry, s4LblW, s4RowH);
  drawCellBox(doc, inX + s3CodeW + s4LblW, ry, s4RightW, s4RowH);
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("4.1", inX, ry + 7, { width: s3CodeW, align: "center" });
  doc.text("Log Yard Number", inX + s3CodeW + 6, ry + 7, {
    width: s4LblW - 10,
  });
  doc
    .font("Helvetica-Bold")
    .text(report.logYardNumber ?? "", inX + s3CodeW + s4LblW, ry + 7, {
      width: s4RightW,
      align: "center",
    });
  ry += s4RowH;

  const unitRows = [
    {
      code: "4.2",
      label: "Log Age",
      val: fmtOptNum(report.logAgeYears, 1),
      unit: "Years",
    },
    {
      code: "4.3",
      label: "Log Aging In Storage",
      val: fmtOptNum(report.logAgingMonths, 1),
      unit: "Months",
    },
    {
      code: "4.4",
      label: "Avg. Log Diameter",
      val: fmtOptNum(report.avgLogDiameterCm, 1),
      unit: "cm",
    },
    {
      code: "4.5",
      label: "Log Moisture",
      val: fmtOptNum(report.logMoisturePct, 2),
      unit: "%",
    },
  ];

  for (const row of unitRows) {
    drawCellBox(doc, inX, ry, s3CodeW, s4RowH);
    drawCellBox(doc, inX + s3CodeW, ry, s4LblW, s4RowH);
    drawCellBox(doc, inX + s3CodeW + s4LblW, ry, s4ValW, s4RowH);
    drawCellBox(doc, inX + s3CodeW + s4LblW + s4ValW, ry, s4UnitW, s4RowH);

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(DARK)
      .text(row.code, inX, ry + 7, { width: s3CodeW, align: "center" });
    doc.text(row.label, inX + s3CodeW + 6, ry + 7, { width: s4LblW - 10 });
    doc
      .font("Helvetica-Bold")
      .text(row.val, inX + s3CodeW + s4LblW, ry + 7, {
        width: s4ValW,
        align: "center",
      });
    doc
      .font("Helvetica")
      .text(row.unit, inX + s3CodeW + s4LblW + s4ValW, ry + 7, {
        width: s4UnitW,
        align: "center",
      });
    ry += s4RowH;
  }

  // 4.6 Percentage Log Diameter
  drawCellBox(doc, inX, ry, s3CodeW, s4RowH);
  drawCellBox(doc, inX + s3CodeW, ry, s4LblW, s4RowH);
  drawCellBox(doc, inX + s3CodeW + s4LblW, ry, s4RightW, s4RowH);

  const d1Pct = fmtOptNum(report.diameterPct1, 1);
  const d1Mm = fmtOptNum(report.diameterMm1, 1);
  const d2Pct = fmtOptNum(report.diameterPct2, 1);
  const d2Mm = fmtOptNum(report.diameterMm2, 1);
  const pairText =
    d1Pct || d1Mm || d2Pct || d2Mm
      ? `${d1Pct || "—"} %  ${d1Mm || "—"} MM    |    ${d2Pct || "—"} %  ${d2Mm || "—"} MM`
      : "";

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(DARK)
    .text("4.6", inX, ry + 7, { width: s3CodeW, align: "center" });
  doc.text("Percentage Log Diameter", inX + s3CodeW + 6, ry + 7, {
    width: s4LblW - 8,
  });
  doc
    .font("Helvetica-Bold")
    .fontSize(7.5)
    .text(pairText, inX + s3CodeW + s4LblW + 4, ry + 7, {
      width: s4RightW - 8,
      align: "center",
    });
  ry += s4RowH;

  // Section 4 Remarks Box (2 Bagan)
  const s4RemH = ry - s4StartY;
  drawPartitionedRemarks(doc, s3RemX, s4StartY, s3RemW, s4RemH, [
    {
      value: report.rawMaterialRemarks,
      hasPhoto: Boolean(report.rawMaterialRemarksPhotoUrl),
    },
    {
      value: report.rawMaterialRemarks2,
      hasPhoto: Boolean(report.rawMaterialRemarks2PhotoUrl),
    },
  ]);
}

function drawRemarksPhotoPage(
  doc: PDFKit.PDFDocument,
  remarkPhotos: LoadedRemarkPhoto[],
  logoBuffer: Buffer | null,
  totalPages: number,
) {
  doc.addPage();
  drawPageHeader(doc, logoBuffer, `Sida: 3 (totalt ${totalPages})`);
  drawVerticalTagline(doc);

  const boxY = 104;
  const boxH = 660;
  drawDoubleFrame(doc, PAGE_LEFT, boxY, CONTENT_W, boxH);

  const inX = PAGE_LEFT + 3;
  const hdrH = 22;
  drawCellBox(doc, inX, boxY + 3, CONTENT_W - 6, hdrH);
  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(DARK)
    .text("Lampiran Foto Remarks", inX, boxY + 9, {
      width: CONTENT_W - 6,
      align: "center",
    });

  const gridX = PAGE_LEFT + 9;
  const gridY = boxY + 3 + hdrH + 6;
  const availW = CONTENT_W - 18;
  const availH = boxH - 37;
  const gapX = 10;
  const gapY = 8;
  const cols = 2;
  const rows = 4;
  const cardW = (availW - gapX) / cols;
  const cardH = (availH - gapY * (rows - 1)) / rows;

  remarkPhotos.slice(0, cols * rows).forEach((item, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = gridX + col * (cardW + gapX);
    const cy = gridY + row * (cardH + gapY);

    drawCellBox(doc, cx, cy, cardW, cardH, 0.65, BORDER);

    const titleH = 17;
    drawCellBox(doc, cx, cy, cardW, titleH, 0.5, BORDER);
    doc
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .fillColor(DARK)
      .text(item.sectionTitle, cx + 6, cy + 5, {
        width: cardW - 12,
        lineBreak: false,
        ellipsis: true,
      });

    let textAreaH = 0;
    if (item.remarkText) {
      textAreaH = 22;
      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(DARK)
        .text(item.remarkText, cx + 6, cy + titleH + 3, {
          width: cardW - 12,
          height: 17,
          ellipsis: true,
        });
      doc
        .save()
        .lineWidth(0.4)
        .strokeColor("#CBD5E1")
        .moveTo(cx, cy + titleH + textAreaH)
        .lineTo(cx + cardW, cy + titleH + textAreaH)
        .stroke()
        .restore();
    }

    const imgY = cy + titleH + textAreaH + 5;
    const imgW = cardW - 12;
    const imgH = cardH - titleH - textAreaH - 10;

    if (item.buffer) {
      doc.image(item.buffer, cx + 6, imgY, {
        fit: [imgW, imgH],
        align: "center",
        valign: "center",
      });
    } else {
      doc
        .save()
        .lineWidth(0.5)
        .dash(3, { space: 3 })
        .strokeColor("#CBD5E1")
        .rect(cx + 8, imgY + 2, imgW - 4, imgH - 4)
        .stroke()
        .undash()
        .restore();

      doc
        .font("Helvetica")
        .fontSize(7)
        .fillColor(MUTED)
        .text("Tidak ada foto", cx + 6, imgY + imgH / 2 - 4, {
          width: imgW,
          align: "center",
        });
    }
  });
}

/** Generates a 2-page A4 Shift Report PDF (+ Page 3 attachment grid when remarks photos exist). */
export async function generateShiftReportPdf(
  report: ShiftReportDTO,
): Promise<Buffer> {
  const [photos, remarkPhotos, logoBuffer] = await Promise.all([
    loadOperationalPhotos(report),
    loadRemarksPhotos(report),
    loadCompanyLogo(),
  ]);

  const hasRemarksPhotos = remarkPhotos.some((item) => item.buffer !== null);
  const totalPages = hasRemarksPhotos ? 3 : 2;

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 0,
      info: {
        Title: `Shift Report - ${report.customer} - ${report.reportDate} - Shift ${report.shift}`,
        Author: report.customer,
        Subject: `Shift Report ${CHIPPER_LABEL_MAP[report.chipperType]}`,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    drawPage1(doc, report, photos, logoBuffer);
    drawPage2(doc, report, logoBuffer, totalPages);
    if (hasRemarksPhotos) {
      drawRemarksPhotoPage(doc, remarkPhotos, logoBuffer, totalPages);
    }

    doc.end();
  });
}
