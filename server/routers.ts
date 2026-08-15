import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { fetchAttendanceStatuses, fetchMonthlyAttendanceStatuses } from "./attendanceStatus";
import { buildProgramIcs, getProgramById, listPrograms, PROGRAM_STATUSES } from "./programs";

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
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
