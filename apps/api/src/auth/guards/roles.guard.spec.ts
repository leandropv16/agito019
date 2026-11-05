import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { AppException } from "../../common/errors/app.exception";

function contextWith(user?: { role: string }) {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
}

describe("RolesGuard", () => {
  it("bloqueia PARTNER em rota ADMIN", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(() => guard.canActivate(contextWith({ role: "PARTNER" }))).toThrow(AppException);
  });

  it("permite ADMIN", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["ADMIN"]) } as unknown as Reflector;
    const guard = new RolesGuard(reflector);
    expect(guard.canActivate(contextWith({ role: "ADMIN" }))).toBe(true);
  });
});
