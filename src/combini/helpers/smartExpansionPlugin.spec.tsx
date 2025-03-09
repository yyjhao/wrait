import { EditorState, Plugin, Selection } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { Schema } from "prosemirror-model";
import { SmartExpansionPlugin, smartExpansionKey, getSmartExpansionState } from "./smartExpansionPlugin";
import * as viewAIModule from "./viewAI";

// Helper to flush promises
async function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

describe("SmartExpansionPlugin", () => {
  let schema: Schema;
  let state: EditorState;
  let view: EditorView;
  let mockAI: any;
  let container: HTMLElement;
  let getAISpy: jasmine.Spy;

  beforeEach(() => {
    schema = new Schema({
      nodes: {
        doc: { content: "text*" },
        text: { inline: true },
      },
    });

    container = document.createElement("div");
    document.body.appendChild(container);

    state = EditorState.create({
      schema,
      plugins: [SmartExpansionPlugin],
    });

    view = new EditorView(container, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        state = newState;
      },
    });

    mockAI = {
      loaded: true,
      request: jasmine.createSpy("request").and.callFake((config, callback) => {
        return new Promise((resolve) => {
          setTimeout(() => callback("partial"), 50);
          setTimeout(() => callback("partial response"), 100);
          setTimeout(() => {
            callback("final response");
            resolve("final response");
          }, 150);
        });
      }),
    };

    // Properly mock the getAI function from viewAI
    getAISpy = spyOn(viewAIModule, 'getAI').and.returnValue(mockAI);
  });

  afterEach(() => {
    view.destroy();
    container.remove();
    getAISpy.calls.reset();
  });

  describe("Plugin initialization", () => {
    it("should initialize with idle state", () => {
      const pluginState = smartExpansionKey.getState(state);
      expect(pluginState).toEqual({ type: "idle" });
    });
  });

  describe("Trigger handling", () => {
    it("should detect expansion trigger < >", async () => {
      const tr = state.tr.insertText("<test>");
      view.dispatch(tr);
      
      await flushPromises();
      
      const pluginState = smartExpansionKey.getState(view.state);
      if (!pluginState || pluginState.type !== "hintGenerating") {
        fail(`Expected hintGenerating state but got ${JSON.stringify(pluginState)}`);
        return;
      }
      expect(pluginState.generateType).toBe("expand");
    });

    it("should detect rewrite trigger [ ]", async () => {
      const tr = state.tr.insertText("[test]");
      view.dispatch(tr);
      
      await flushPromises();
      
      const pluginState = smartExpansionKey.getState(view.state);
      if (!pluginState || pluginState.type !== "hintGenerating") {
        fail(`Expected hintGenerating state but got ${JSON.stringify(pluginState)}`);
        return;
      }
      expect(pluginState.generateType).toBe("rewrite");
    });
  });

  describe("Tab key handling", () => {
    it("should handle tab key for expansion", async () => {
      const tr = state.tr.insertText("<test>");
      view.dispatch(tr);
      
      await flushPromises();

      const event = new KeyboardEvent("keydown", { key: "Tab" });
      const handled = SmartExpansionPlugin.props.handleKeyDown!(view, event);
      expect(handled).toBe(true);

      // Verify immediate transition to generating state
      const generatingState = smartExpansionKey.getState(view.state);
      expect(generatingState?.type).toBe("generating");
      expect(generatingState?.generateType).toBe("expand");

      // Wait for all AI responses
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockAI.request).toHaveBeenCalled();
      const finalState = smartExpansionKey.getState(view.state);
      expect(finalState?.type).toBe("idle");
    });
  });

  describe("State transitions", () => {
    it("should show intermediate states during generation", async () => {
      const tr = state.tr.insertText("<test>");
      view.dispatch(tr);
      
      await flushPromises();

      const event = new KeyboardEvent("keydown", { key: "Tab" });
      SmartExpansionPlugin.props.handleKeyDown!(view, event);

      let currentState = smartExpansionKey.getState(view.state);
      if (!currentState || currentState.type !== "generating") {
        fail(`Expected generating state but got ${JSON.stringify(currentState)}`);
        return;
      }

      // Wait for first update
      await new Promise(resolve => setTimeout(resolve, 75));
      currentState = smartExpansionKey.getState(view.state);
      if (!currentState || currentState.type !== "generating") {
        fail(`Expected generating state but got ${JSON.stringify(currentState)}`);
        return;
      }
      expect(currentState.generatedText).toBe("partial");

      // Wait for completion
      await new Promise(resolve => setTimeout(resolve, 200));
      const finalState = smartExpansionKey.getState(view.state);
      expect(finalState?.type).toBe("idle");
    });
  });

  describe("Error handling", () => {
    it("should handle AI request errors", async () => {
      const testError = new Error("Test error");
      mockAI.request = jasmine.createSpy("request").and.returnValue(Promise.reject(testError));
      const errorSpy = spyOn(console, 'error');

      const tr = state.tr.insertText("<test>");
      view.dispatch(tr);
      
      await flushPromises();

      const event = new KeyboardEvent("keydown", { key: "Tab" });
      SmartExpansionPlugin.props.handleKeyDown!(view, event);

      // Verify immediate transition to generating state
      const generatingState = smartExpansionKey.getState(view.state);
      expect(generatingState?.type).toBe("generating");
      expect(generatingState?.generateType).toBe("expand");

      try {
        await new Promise((_, reject) => setTimeout(() => reject(testError), 50));
        fail("Should have thrown an error");
      } catch (e) {
        expect(errorSpy).toHaveBeenCalledWith("Error expanding text:", testError);
        const finalState = smartExpansionKey.getState(view.state);
        expect(finalState?.type).toBe("idle");
      }
    });
  });

  describe("Selection handling", () => {
    it("should reset hint state when selection changes", async () => {
      const tr = state.tr.insertText("<test>");
      view.dispatch(tr);
      
      await flushPromises();

      const newTr = view.state.tr.setSelection(Selection.near(view.state.doc.resolve(0)));
      view.dispatch(newTr);

      await flushPromises();

      const pluginState = smartExpansionKey.getState(view.state);
      expect(pluginState?.type).toBe("idle");
    });
  });
});