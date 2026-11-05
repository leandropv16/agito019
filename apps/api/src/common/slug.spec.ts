import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("gera slug sem acento", () => {
    expect(slugify("Boteco do Zé")).toBe("boteco-do-ze");
  });
});

describe("uniqueSlug", () => {
  it("sufixa em caso de conflito", async () => {
    const taken = new Set(["boteco-do-ze", "boteco-do-ze-2"]);
    const slug = await uniqueSlug("Boteco do Zé", async (value) => taken.has(value));
    expect(slug).toBe("boteco-do-ze-3");
  });
});
