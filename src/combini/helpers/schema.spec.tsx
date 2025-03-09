import { textSchema } from "./schema";

describe("textSchema", () => {
  it("should have the required nodes", () => {
    expect(textSchema.nodes.doc).toBeDefined();
    expect(textSchema.nodes.paragraph).toBeDefined();
    expect(textSchema.nodes.text).toBeDefined();
  });

  it("should have the autoComplete mark", () => {
    expect(textSchema.marks.autoComplete).toBeDefined();
  });
});