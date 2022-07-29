import { PROJECTS, PROJECT_LIST, TokenProjectId } from "./projects";

describe("Token Project", () => {
  it("should have kebab case ids", () => {
    PROJECT_LIST.forEach((project) => {
      expect(project.id).toMatch(/^([a-z][a-z]*)(-[a-z]+)*$/);
    });
  });

  it("should have a consistent list and a table", () => {
    PROJECT_LIST.forEach((project) => {
      expect(PROJECTS[project.id as TokenProjectId]).toBe(project);
    });
    expect(PROJECT_LIST.length).toEqual(Object.keys(PROJECTS).length);
    expect(PROJECT_LIST.length).toEqual(Object.keys(TokenProjectId).length);
  });
});
