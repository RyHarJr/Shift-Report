import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ShiftReportQueryInput } from "./shift-report.schema";

const listItemSelect = {
  id: true,
  customer: true,
  reportDate: true,
  inspectionBy: true,
  chipperType: true,
  chipLengthSetUp: true,
  typeOfKnifeSystem: true,
  shift: true,
  samplingTime: true,
  oversize: true,
  overthick: true,
  largeAccept: true,
  smallAccept: true,
  pin: true,
  fines: true,
  barkContent: true,
  moisture: true,
  totalAccept: true,
  pinPlusFines: true,
  layerObservation: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ShiftReportSelect;

export type ShiftReportListItem = Prisma.ShiftReportGetPayload<{
  select: typeof listItemSelect;
}>;

const chartItemSelect = {
  id: true,
  reportDate: true,
  shift: true,
  chipperType: true,
  inspectionBy: true,
  oversize: true,
  overthick: true,
  largeAccept: true,
  smallAccept: true,
  pin: true,
  fines: true,
  barkContent: true,
  moisture: true,
  totalAccept: true,
  pinPlusFines: true,
} satisfies Prisma.ShiftReportSelect;

export type ShiftReportChartPoint = Prisma.ShiftReportGetPayload<{
  select: typeof chartItemSelect;
}>;

function buildWhereClause(
  query: Omit<ShiftReportQueryInput, "page" | "limit">,
): Prisma.ShiftReportWhereInput {
  const where: Prisma.ShiftReportWhereInput = {};

  if (query.chipperType !== "ALL") {
    where.chipperType = query.chipperType;
  }

  if (query.shift !== "ALL") {
    where.shift = query.shift;
  }

  if (query.dateFrom || query.dateTo) {
    where.reportDate = {
      ...(query.dateFrom
        ? { gte: new Date(`${query.dateFrom}T00:00:00.000Z`) }
        : {}),
      ...(query.dateTo
        ? { lte: new Date(`${query.dateTo}T23:59:59.999Z`) }
        : {}),
    };
  }

  if (query.search) {
    where.OR = [
      { inspectionBy: { contains: query.search } },
      { logYardNumber: { contains: query.search } },
      { typeOfKnifeSystem: { contains: query.search } },
    ];
  }

  return where;
}

export const shiftReportRepository = {
  async findPaginated(query: ShiftReportQueryInput) {
    const where = buildWhereClause(query);
    const skip = (query.page - 1) * query.limit;

    const [items, total] = await Promise.all([
      prisma.shiftReport.findMany({
        where,
        select: listItemSelect,
        orderBy: [
          { reportDate: "desc" },
          { shift: "desc" },
          { createdAt: "desc" },
        ],
        skip,
        take: query.limit,
      }),
      prisma.shiftReport.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  },

  async findChartSeries(
    query: Omit<ShiftReportQueryInput, "page" | "limit">,
    maxPoints = 60,
  ) {
    const where = buildWhereClause(query);
    const rows = await prisma.shiftReport.findMany({
      where,
      select: chartItemSelect,
      orderBy: [
        { reportDate: "asc" },
        { shift: "asc" },
        { createdAt: "asc" },
      ],
      take: maxPoints,
    });
    return rows;
  },

  async findForExport(
    query: Omit<ShiftReportQueryInput, "page" | "limit">,
    maxRows = 2000,
  ) {
    const where = buildWhereClause(query);
    return prisma.shiftReport.findMany({
      where,
      orderBy: [
        { reportDate: "desc" },
        { shift: "desc" },
        { createdAt: "desc" },
      ],
      take: maxRows,
    });
  },

  async findById(id: string) {
    return prisma.shiftReport.findUnique({
      where: { id },
    });
  },

  async create(data: Prisma.ShiftReportCreateInput) {
    return prisma.shiftReport.create({ data });
  },

  async update(id: string, data: Prisma.ShiftReportUpdateInput) {
    return prisma.shiftReport.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return prisma.shiftReport.delete({
      where: { id },
    });
  },
};

