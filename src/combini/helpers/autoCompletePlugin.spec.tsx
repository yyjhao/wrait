import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { textSchema } from "./schema";
import {
  autoCompletePlugin,
  getAutoCompleteDerivedState,
} from "./autoCompletePlugin";

describe("autoCompletePlugin", () => {
  let state: EditorState;
  let view: EditorView;
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement("div");
    state = EditorState.create({
      schema: textSchema,
      plugins: [autoCompletePlugin],
    });
    view = new EditorView(mockElement, { state });
  });

  afterEach(() => {
    view.destroy();
  });

  it("should initialize with idle state", () => {
    const derivedState = getAutoCompleteDerivedState(state);
    expect(derivedState.state).toBe("idle");
  });

  it("should handle key events correctly", () => {
    const tabEvent = new KeyboardEvent("keydown", { key: "Tab" });
    const dotEvent = new KeyboardEvent("keydown", {
      key: ".",
      metaKey: true,
    });

    const plugin = autoCompletePlugin.props.handleKeyDown;
    if (!plugin) throw new Error("Plugin handleKeyDown not defined");

    // When no auto-complete is active, Tab should not do anything
    expect(plugin(view, tabEvent)).toBe(false);

    // Meta+. should trigger auto-complete
    plugin(view, dotEvent);
    const stateAfterDot = getAutoCompleteDerivedState(view.state);
    expect(stateAfterDot.state).toBe("autoCompleting");
  });

  it("should update plugin state when auto-complete progresses", () => {
    // Start auto-complete
    const tr = state.tr.setMeta(autoCompletePlugin.key, {
      type: "ADD_AUTO_COMPLETE",
      autoComplete: {
        type: "progressing",
        id: 1,
        pos: 0,
        content: "test",
        abort: () => {},
      },
    });

    const newState = state.apply(tr);
    const pluginState = autoCompletePlugin.getState(newState);

    expect(pluginState?.autoComplete).toBeDefined();
    expect(pluginState?.autoComplete?.type).toBe("progressing");
    expect((pluginState?.autoComplete as any).content).toBe("test");
  });

  it("should remove auto-complete when requested", () => {
    // First add auto-complete
    let tr = state.tr.setMeta(autoCompletePlugin.key, {
      type: "ADD_AUTO_COMPLETE",
      autoComplete: {
        type: "progressing",
        id: 1,
        pos: 0,
        content: "test",
        abort: () => {},
      },
    });

    let newState = state.apply(tr);

    // Then remove it
    tr = newState.tr.setMeta(autoCompletePlugin.key, {
      type: "REMOVE_AUTO_COMPLETE",
    });

    newState = newState.apply(tr);
    const pluginState = autoCompletePlugin.getState(newState);

    expect(pluginState?.autoComplete).toBeUndefined();
  });

  it("should maintain position through document changes", () => {
    // Start with a paragraph containing "|" (cursor position 2)
    const initialDoc = textSchema.node("doc", null, [
      textSchema.node("paragraph", null, [textSchema.text("0")]),
    ]);
    let testState = EditorState.create({
      doc: initialDoc,
      schema: textSchema,
      plugins: [autoCompletePlugin],
    });

    // Add auto-complete at valid text position (start of empty paragraph)
    let tr = testState.tr.setMeta(autoCompletePlugin.key, {
      type: "ADD_AUTO_COMPLETE",
      autoComplete: {
        type: "progressing",
        id: 1,
        pos: 2, // Position inside paragraph
        content: "test",
        abort: () => {},
      },
    });

    let newState = testState.apply(tr);

    // Insert text properly within the paragraph
    tr = newState.tr.insertText("prefix ", 2); // Insert at position 2
    newState = newState.apply(tr);

    const pluginState = autoCompletePlugin.getState(newState);
    // Original position 2 + inserted text length 7 = 9
    // But mapped through insertion becomes 2 + 7 = 9
    expect((pluginState?.autoComplete as any).pos).toBe(9);
  });
});
