import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("shop.login", () => {
  it("accepts the configured credentials and sets a session cookie", async () => {
    const cookies: Array<{ name: string; value: string }> = [];
    const ctx = {
      user: null,
      req: { headers: {} },
      res: { cookie: (name: string, value: string) => cookies.push({ name, value }) },
    } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shop.login({ username: "admin", password: "admin" });
    expect(result).toEqual({ success: true });
    expect(cookies).toHaveLength(1);
    expect(cookies[0]?.value).toContain(".");
  });

  it("rejects an incorrect password", async () => {
    const ctx = { user: null, req: { headers: {} }, res: { cookie: () => undefined } } as unknown as TrpcContext;
    const caller = appRouter.createCaller(ctx);
    await expect(caller.shop.login({ username: "admin", password: "wrong" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
