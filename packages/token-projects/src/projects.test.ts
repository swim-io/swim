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

  it("should have a consistent list and a table", () => {
    TOKEN_PROJECTS.forEach((project) => {
      expect(TOKEN_PROJECTS_BY_ID[project.id as TokenProjectId]).toBe(project);
    });
    expect(TOKEN_PROJECTS.length).toEqual(
      Object.keys(TOKEN_PROJECTS_BY_ID).length,
    );
    expect(TOKEN_PROJECTS.length).toEqual(Object.keys(TokenProjectId).length);
  });
});
