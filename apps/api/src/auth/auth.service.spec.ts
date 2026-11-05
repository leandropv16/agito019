import { AuthService } from "./auth.service";
import { AppException } from "../common/errors/app.exception";
import { COOKIE_ACCESS, COOKIE_REFRESH } from "../common/shared";

jest.mock("argon2", () => ({
  verify: jest.fn(),
}));

import { verify } from "argon2";

function cookies() {
  return {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  };
}

describe("AuthService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("recusa credencial inválida", async () => {
    const prisma = {
      user: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const service = new AuthService(prisma as never, { signAsync: jest.fn() } as never);
    await expect(service.login("a@b.com", "secret", {} as never)).rejects.toBeInstanceOf(AppException);
  });

  it("login grava cookies HTTP-only", async () => {
    (verify as jest.Mock).mockResolvedValue(true);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: "u1",
          name: "Admin",
          email: "xena.w@example.org",
          role: "ADMIN",
          active: true,
          passwordHash: "hash",
        }),
      },
      authSession: { create: jest.fn().mockResolvedValue({}) },
    };
    const jwt = { signAsync: jest.fn().mockResolvedValue("access-token") };
    const service = new AuthService(prisma as never, jwt as never);
    const response = cookies();
    const user = await service.login("xena.w@example.org", "Agito019!admin", response as never);
    expect(user.email).toBe("xena.w@example.org");
    expect(response.cookie).toHaveBeenCalledWith(
      COOKIE_ACCESS,
      "access-token",
      expect.objectContaining({ httpOnly: true }),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      COOKIE_REFRESH,
      expect.any(String),
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it("refresh recusa token ausente", async () => {
    const service = new AuthService({} as never, { signAsync: jest.fn() } as never);
    await expect(service.refresh(undefined, cookies() as never)).rejects.toBeInstanceOf(AppException);
  });

  it("logout limpa cookies mesmo sem sessão", async () => {
    const prisma = { authSession: { updateMany: jest.fn() } };
    const service = new AuthService(prisma as never, { signAsync: jest.fn() } as never);
    const response = cookies();
    await expect(service.logout(undefined, response as never)).resolves.toEqual({ ok: true });
    expect(response.clearCookie).toHaveBeenCalledWith(COOKIE_ACCESS, expect.any(Object));
    expect(response.clearCookie).toHaveBeenCalledWith(COOKIE_REFRESH, expect.any(Object));
  });
});
