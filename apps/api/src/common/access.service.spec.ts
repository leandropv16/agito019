import { AccessService } from "./access.service";
import { AppException } from "./errors/app.exception";

describe("AccessService PARTNER", () => {
  it("403 quando o parceiro não tem vínculo com o local", async () => {
    const prisma = {
      userEstablishment: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const access = new AccessService(prisma as never);
    await expect(
      access.assertEstablishmentAccess({ id: "u1", name: "P", email: "p@p.com", role: "PARTNER" }, "est-1"),
    ).rejects.toBeInstanceOf(AppException);
  });

  it("escopo de listagem do parceiro filtra pelo vínculo", () => {
    const access = new AccessService({} as never);
    expect(access.establishmentScope({ id: "u1", name: "P", email: "p@p.com", role: "PARTNER" })).toEqual({
      users: { some: { userId: "u1" } },
    });
  });
});
