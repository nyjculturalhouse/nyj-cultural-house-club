import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { fetchAttendanceStatuses, fetchMonthlyAttendanceStatuses } from "./attendanceStatus";
import {
  APPLICATION_PROVIDERS,
  buildProgramIcs,
  deleteManagedProgram,
  getProgramById,
  listManagedPrograms,
  listPrograms,
  PROGRAM_STATUSES,
  saveManagedProgram,
  uploadManagedProgramImage,
} from "./programs";

const managementProgramInput = z.object({
  externalId: z.string().trim().min(3).max(128).regex(/^[a-zA-Z0-9-]+$/, "프로그램 ID는 영문·숫자·하이픈만 사용할 수 있습니다."),
  title: z.string().trim().min(1).max(255),
  summary: z.string().trim().min(1).max(500),
  description: z.string().trim().max(8_000).optional().default(""),
  category: z.string().trim().max(100).optional().default(""),
  target: z.string().trim().max(255).optional().default(""),
  venue: z.string().trim().max(255).optional().default(""),
  startAt: z.string().datetime().nullable().optional().default(null),
  endAt: z.string().datetime().nullable().optional().default(null),
  recruitmentDeadline: z.string().datetime().nullable().optional().default(null),
  recruitmentStatus: z.enum(PROGRAM_STATUSES),
  applicationUrl: z.string().url().or(z.literal("")).optional().default(""),
  applicationProvider: z.enum(APPLICATION_PROVIDERS),
  contact: z.string().trim().max(255).optional().default(""),
  preApplicationChecks: z.string().trim().max(4_000).optional().default(""),
  imageUrl: z.string().trim().max(2_000).optional().default(""),
  isPublished: z.boolean(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  attendance: router({
    status: publicProcedure.query(async () => fetchAttendanceStatuses()),
    monthlyStatus: publicProcedure
      .input(z.object({ year: z.number().int().min(2000).max(2100), month: z.number().int().min(1).max(12) }))
      .query(async ({ input }) => fetchMonthlyAttendanceStatuses(input.year, input.month)),
  }),
  programs: router({
    list: publicProcedure
      .input(z.object({
        category: z.string().trim().min(1).optional(),
        target: z.string().trim().min(1).optional(),
        status: z.enum(PROGRAM_STATUSES).optional(),
      }).optional())
      .query(async ({ input }) => listPrograms(input)),
    getById: publicProcedure
      .input(z.object({ id: z.string().trim().min(1).max(128) }))
      .query(async ({ input }) => getProgramById(input.id)),
    ics: publicProcedure
      .input(z.object({ id: z.string().trim().min(1).max(128) }))
      .query(async ({ input }) => {
        const { item } = await getProgramById(input.id);
        if (!item) throw new Error("프로그램을 찾을 수 없습니다.");
        return { filename: `남양주시-문화의집-${item.id}.ics`, content: buildProgramIcs(item) };
      }),
    adminList: adminProcedure.query(async () => listManagedPrograms()),
    adminSave: adminProcedure
      .input(managementProgramInput)
      .mutation(async ({ input }) => saveManagedProgram(input)),
    adminDelete: adminProcedure
      .input(z.object({ externalId: z.string().trim().min(3).max(128) }))
      .mutation(async ({ input }) => deleteManagedProgram(input.externalId)),
    uploadImage: adminProcedure
      .input(z.object({
        fileName: z.string().trim().min(1).max(255),
        contentType: z.string().trim().min(6).max(100),
        dataUrl: z.string().min(16).max(7_000_000),
      }))
      .mutation(async ({ input }) => uploadManagedProgramImage(input)),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
