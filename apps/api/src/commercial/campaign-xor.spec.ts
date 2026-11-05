import { assertCampaignXor } from "./dto/commercial.dto";
import { CommercialService } from "./commercial.service";

describe("campanha XOR", () => {
  it("aceita só estabelecimento", () => {
    expect(assertCampaignXor("est-1", null)).toBe(true);
  });

  it("aceita só artista", () => {
    expect(assertCampaignXor(null, "art-1")).toBe(true);
  });

  it("rejeita os dois ou nenhum", () => {
    expect(assertCampaignXor("est-1", "art-1")).toBe(false);
    expect(assertCampaignXor(null, null)).toBe(false);
  });

  it("service lança código CAMPAIGN_TARGET_XOR", () => {
    const service = new CommercialService({} as never);
    expect(() => service.validateXor(null, null)).toThrow("estabelecimento ou a um artista");
  });
});
