import {
  TOKEN_PROJECTS,
  TOKEN_PROJECTS_BY_ID,
  TokenProjectId,
} from "./projects";

describe("Token Project", () => {
  it("should have kebab case ids", () => {
    TOKEN_PROJECTS.forEach((project) => {
      expect(project.id).toMatch(/^([a-z]+)(-[a-z]+)*$/);
    });
  });

  it("should have unique ids", () => {
    const ids = Object.values(TOKEN_PROJECTS_BY_ID).map((x) => x.id);
    expect(ids).toEqual(Array.from(new Set(ids)));
  });

  it("should have unique token number (excluding null)", () => {
    const tokenNumbers = Object.values(TOKEN_PROJECTS_BY_ID)
      .map((x) => x.tokenNumber)
      .filter(<T>(x: T | null): x is T => x !== null);
    expect(tokenNumbers).toEqual(Array.from(new Set(tokenNumbers)));
  });

  it.each(Object.values(TOKEN_PROJECTS_BY_ID))(
    "should have unique token number within range ($id)",
    (tokenProject) => {
      /* eslint-disable jest/no-conditional-expect */
      if (typeof tokenProject.tokenNumber !== "number") {
        expect(tokenProject.tokenNumber).toBeNull();
      } else if (tokenProject.isStablecoin && tokenProject.isLp) {
        // case for swimUSD
        expect(tokenProject.tokenNumber).toBeGreaterThanOrEqual(0x0000);
        expect(tokenProject.tokenNumber).toBeLessThanOrEqual(0x00ff);
      } else if (tokenProject.isStablecoin) {
        // case for stable coin
        expect(tokenProject.tokenNumber).toBeGreaterThanOrEqual(0x0100);
        expect(tokenProject.tokenNumber).toBeLessThanOrEqual(0x7fff);
      } else {
        // case for non-stable coin
        expect(tokenProject.tokenNumber).toBeGreaterThanOrEqual(0x8000);
        expect(tokenProject.tokenNumber).toBeLessThanOrEqual(0xffff);
      }
      /* eslint-enable jest/no-conditional-expect */
    },
  );

  it("should have a consistent list and a table", () => {
    TOKEN_PROJECTS.forEach((project) => {
      expect(TOKEN_PROJECTS_BY_ID[project.id]).toBe(project);
    });
    expect(TOKEN_PROJECTS.length).toEqual(
      Object.keys(TOKEN_PROJECTS_BY_ID).length,
    );
    expect(TOKEN_PROJECTS.length).toEqual(Object.keys(TokenProjectId).length);
  });
});
