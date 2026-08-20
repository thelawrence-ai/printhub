import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { createPrintOrder, listPrintOrders, updatePrintOrderStatus } from "./db";
import { storagePut } from "./storage";
import { hasShopSession, createShopSession, SHOP_SESSION_COOKIE, validateShopCredentials } from "./shopAuth";

const orderInput = z.object({
  whatsapp: z.string().min(7).max(32), token: z.string().max(120).optional(), fileName: z.string().min(1).max(255),
  fileBase64: z.string().min(1), fileType: z.literal("application/pdf"),
  printType: z.enum(["Black & white", "Colour", "Spiral binding"]), delivery: z.enum(["Counter pickup", "Campus delivery"]),
  message: z.string().min(1).max(2000),
});
const statusInput = z.object({ orderNumber: z.string().min(1), status: z.enum(["New", "Printing", "Ready"]) });
function requireShop(req: { headers: { cookie?: string } }) { if (!hasShopSession(req.headers.cookie)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Shop login required" }); }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => { const cookieOptions = getSessionCookieOptions(ctx.req); ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 }); return { success: true } as const; }),
  }),
  shop: router({
    login: publicProcedure.input(z.object({ username: z.string(), password: z.string() })).mutation(({ input, ctx }) => {
      if (!validateShopCredentials(input.username, input.password)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Incorrect shop credentials" });
      ctx.res.cookie(SHOP_SESSION_COOKIE, createShopSession(), { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 1000 * 60 * 60 * 12 });
      return { success: true } as const;
    }),
    logout: publicProcedure.mutation(({ ctx }) => { ctx.res.clearCookie(SHOP_SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: -1 }); return { success: true } as const; }),
    session: publicProcedure.query(({ ctx }) => ({ authenticated: hasShopSession(ctx.req.headers.cookie) })),
    listOrders: publicProcedure.query(({ ctx }) => { requireShop(ctx.req); return listPrintOrders(); }),
    updateStatus: publicProcedure.input(statusInput).mutation(({ input, ctx }) => { requireShop(ctx.req); return updatePrintOrderStatus(input.orderNumber, input.status); }),
  }),
  orders: router({
    create: publicProcedure.input(orderInput).mutation(async ({ input }) => {
      const sizeBytes = Math.ceil((input.fileBase64.length * 3) / 4);
      if (sizeBytes > 10 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "PDF must be 10 MB or smaller" });
      const orderNumber = `PH-${Date.now().toString(36).toUpperCase().slice(-8)}`;
      const uploaded = await storagePut(`printhub/orders/${orderNumber}/${input.fileName}`, Buffer.from(input.fileBase64, "base64"), input.fileType);
      return createPrintOrder({ orderNumber, whatsapp: input.whatsapp, token: input.token || null, fileName: input.fileName, fileKey: uploaded.key, fileUrl: uploaded.url, printType: input.printType, delivery: input.delivery, message: input.message, status: "New" });
    }),
  }),
});

export type AppRouter = typeof appRouter;
