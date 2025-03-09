import { EditorView } from "prosemirror-view";
import { getAI, setAI } from "./viewAI";
import { AI } from "./ai";

describe("viewAI", () => {
  let view1: EditorView;
  let view2: EditorView;
  let ai1: AI;
  let ai2: AI;

  beforeEach(() => {
    // Mock EditorView since we don't need actual implementation
    view1 = {} as EditorView;
    view2 = {} as EditorView;
    ai1 = { id: "ai1" } as AI;
    ai2 = { id: "ai2" } as AI;
  });

  it("should set and get AI instance for a view", () => {
    setAI(view1, ai1);
    expect(getAI(view1)).toBe(ai1);
  });

  it("should handle multiple views with different AI instances", () => {
    setAI(view1, ai1);
    setAI(view2, ai2);

    expect(getAI(view1)).toBe(ai1);
    expect(getAI(view2)).toBe(ai2);
  });

  it("should return undefined for view without AI instance", () => {
    expect(getAI(view1)).toBeUndefined();
  });

  it("should update AI instance for existing view", () => {
    setAI(view1, ai1);
    setAI(view1, ai2);
    expect(getAI(view1)).toBe(ai2);
  });
});