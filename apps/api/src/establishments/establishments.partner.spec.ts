import { EstablishmentsService } from "./establishments.service";
import { AppException } from "../common/errors/app.exception";

describe("PARTNER não cria estabelecimento", () => {
  it("lança 403", async () => {
    const service = new EstablishmentsService({} as never, {} as never, {} as never);
    await expect(
      service.create(
        { id: "u1", name: "P", email: "p@p.com", role: "PARTNER" },
        { name: "X", cityId: "c", latitude: -22, longitude: -47 } as never,
      ),
    ).rejects.toBeInstanceOf(AppException);
  });
});
