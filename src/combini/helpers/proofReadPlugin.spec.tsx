import { EditorState } from "prosemirror-state";
import { schema } from "prosemirror-schema-basic";
import {
  ProofReadPlugin,
  ProofRead,
  applySuggestion,
  rejectSuggestion,
} from "./proofReadPlugin";
import { EditorView } from "prosemirror-view";

describe("ProofReadPlugin", () => {
  let state: EditorState;
  let view: EditorView;
  let container: HTMLElement;

  beforeEach(() => {
    // Create a proper container element
    container = document.createElement("div");
    document.body.appendChild(container);

    // Initialize state with proper schema and content
    state = EditorState.create({
      schema,
      doc: schema.node("doc", null, [
        schema.node("paragraph", null, [schema.text("Initial content")]),
      ]),
      plugins: [ProofReadPlugin],
    });

    // Create view with proper DOM mounting
    view = new EditorView(container, {
      state,
      dispatchTransaction(tr) {
        state = state.apply(tr);
        view.updateState(state);
      },
    });
  });

  afterEach(() => {
    if (view) {
      view.destroy();
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it("should initialize with default state", () => {
    const pluginState = ProofReadPlugin.getState(state);
    expect(pluginState).toEqual({
      proofReads: [],
      activeProofRead: undefined,
      state: "idle",
    });
  });

  it("should handle proof read item deletion", () => {
    const proofRead: ProofRead = {
      from: 0,
      to: 5,
      diff: "hello",
    };

    // First add the proofRead
    let tr = state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "replace",
      proofReads: [proofRead],
    });
    view.dispatch(tr);

    // Then delete it
    tr = view.state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "delete",
      proofRead,
    });
    view.dispatch(tr);

    const pluginState = ProofReadPlugin.getState(view.state);
    expect(pluginState?.proofReads).toEqual([]);
  });

  it("should activate a proof read item", () => {
    const proofRead: ProofRead = {
      from: 0,
      to: 5,
      diff: "hello",
    };

    // Add the proofRead
    let tr = state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "replace",
      proofReads: [proofRead],
    });
    view.dispatch(tr);

    // Activate it
    tr = view.state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "activate",
      proofRead,
    });
    view.dispatch(tr);

    const pluginState = ProofReadPlugin.getState(view.state);
    expect(pluginState?.activeProofRead).toEqual(proofRead);
  });

  it("should reset state", () => {
    const proofRead: ProofRead = {
      from: 0,
      to: 5,
      diff: "hello",
    };

    // Add some state
    let tr = state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "replace",
      proofReads: [proofRead],
    });
    view.dispatch(tr);

    // Reset
    tr = view.state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "reset",
    });
    view.dispatch(tr);

    const pluginState = ProofReadPlugin.getState(view.state);
    expect(pluginState).toEqual({
      proofReads: [],
      activeProofRead: undefined,
      state: "idle",
    });
  });

  it("should update state correctly", () => {
    let tr = state.tr;
    tr = tr.setMeta(ProofReadPlugin, {
      type: "updateState",
      state: "proofReading",
    });
    view.dispatch(tr);

    const pluginState = ProofReadPlugin.getState(view.state);
    expect(pluginState?.state).toBe("proofReading");
  });
});
