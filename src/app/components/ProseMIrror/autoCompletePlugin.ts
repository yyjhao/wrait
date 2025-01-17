import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { textSchema } from "./schema";
import { Mapping } from "prosemirror-transform";
import { getAI } from "@/app/api/ai/viewAI";

const pluginKey = new PluginKey("autoComplete");

let id = 0;

function makeId(): number {
  return id++;
}

type ProgressingAutoComplete = {
  type: "progressing" | "waiting";
  id: number;
  pos: number;
  content: string;
  abort: () => void;
};

type AutoCompleteState =
  | ProgressingAutoComplete
  | {
      type: "starting";
      id: number;
      pos: number;
    };

type PluginState = {
  autoComplete: AutoCompleteState | undefined;
};

export async function performAutoComplete(view: EditorView) {
  const { autoComplete } = autoCompletePlugin.getState(view.state) ?? {};

  if (autoComplete) {
    return;
  }
  const currentSelection = view.state.selection;
  const { $head } = currentSelection;
  const id = makeId();
  view.dispatch(startAutoComplete(view.state, id, $head.pos));
  const prefix = view.state.doc.textBetween(0, $head.pos);
  let curText = "";
  // await getAI(view)?.completion(
  //   `Continue writing the given text:\n${prefix}`,
  //   (text, abort) => {
  //     curText = text;
  //     if (autoCompletePlugin.getState(view.state)?.autoComplete?.id === id) {
  //       view.dispatch(
  //         createOrUpdateAutoComplete(
  //           view.state,
  //           {
  //             type: "progressing",
  //             id,
  //             pos: $head.pos,
  //             content: text,
  //             abort,
  //           },
  //           autoCompletePlugin.getState(view.state)?.autoComplete
  //         )
  //       );
  //     }
  //   }
  // );

  await getAI(view)?.request(
    {
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are an LLM that excels at performing tasks exactly as specified.`,
        },
        {
          role: "user",
          content: `Help me finish this text, only respond with the continuation without the prompt or anything else, add space at the beginning if needed: ${prefix}`,
        },
      ],
      temperature: 0.2,
    },
    (text, abort) => {
      const { state } = view;

      curText = text;
      // Update the plugin state with the proofreading results
      view.dispatch(
        createOrUpdateAutoComplete(
          view.state,
          {
            type: "progressing",
            id,
            pos: $head.pos,
            content: text,
            abort,
          },
          autoCompletePlugin.getState(view.state)?.autoComplete
        )
      );
    }
  );

  view.dispatch(
    createOrUpdateAutoComplete(
      view.state,
      {
        type: "waiting",
        id,
        pos: $head.pos,
        content: curText,
        abort: () => {},
      },
      autoCompletePlugin.getState(view.state)?.autoComplete
    )
  );
}

export const autoCompletePlugin = new Plugin<PluginState>({
  key: pluginKey,
  state: {
    init() {
      return { autoComplete: undefined };
    },
    apply(tr, value, oldState, newState): PluginState {
      const oldAutoComplete = autoCompletePlugin.getState(oldState) ?? {
        autoComplete: undefined,
      };
      const action = tr.getMeta(pluginKey);
      if (!action) {
        if (oldAutoComplete.autoComplete) {
          const mapping = new Mapping(tr.mapping.maps);
          // Map the position through the transaction
          const newPos = mapping.map(oldAutoComplete.autoComplete.pos);

          return {
            autoComplete: {
              ...oldAutoComplete.autoComplete,
              pos: newPos,
            },
          };
        }
        return oldAutoComplete;
      } else {
        if (action.type === "ADD_AUTO_COMPLETE") {
          return {
            autoComplete: action.autoComplete,
          };
        } else if (action.type === "REMOVE_AUTO_COMPLETE") {
          if (oldAutoComplete.autoComplete?.type === "progressing") {
            oldAutoComplete.autoComplete?.abort();
          }
          return { autoComplete: undefined };
        }
        return value;
      }
    },
  },
  props: {
    handleKeyDown(view, event) {
      if (event.key == "Tab") {
        return acceptAutoComplete(view);
      } else if (event.key == "." && event.metaKey) {
        performAutoComplete(view);
      }
    },
  },
  view(editorView) {
    return {
      update(view, prevState) {
        const currentSelection = view.state.selection;
        const previousSelection = prevState.selection;

        const { autoComplete } = autoCompletePlugin.getState(view.state) ?? {};

        if (!currentSelection.eq(previousSelection)) {
          if (autoComplete) {
            view.dispatch(removeAutoComplete(view.state, autoComplete));
          }
        }
      },
    };
  },
});

function removeAutoComplete(
  state: EditorState,
  autoComplete: AutoCompleteState
): Transaction {
  let tr = state.tr;
  if (autoComplete.type === "progressing" || autoComplete.type === "waiting") {
    tr = tr.deleteRange(
      autoComplete.pos,
      autoComplete.pos + autoComplete.content.length
    );
  }
  return tr.setMeta(autoCompletePlugin, {
    type: "REMOVE_AUTO_COMPLETE",
  });
}

function startAutoComplete(
  state: EditorState,
  id: number,
  pos: number
): Transaction {
  let tr = state.tr;
  return tr.setMeta(autoCompletePlugin, {
    type: "ADD_AUTO_COMPLETE",
    autoComplete: {
      id,
      pos,
      type: "starting",
    },
  });
}

function createOrUpdateAutoComplete(
  state: EditorState,
  autoComplete: ProgressingAutoComplete,
  oldAutoComplete: AutoCompleteState | undefined
): Transaction {
  let tr = state.tr;
  if (oldAutoComplete && oldAutoComplete.type === "progressing") {
    tr = tr.delete(
      oldAutoComplete.pos,
      oldAutoComplete.pos + oldAutoComplete.content.length
    );
  }
  tr = tr.insert(
    autoComplete.pos,
    textSchema.text(autoComplete.content, [
      textSchema.marks.autoComplete.create(),
    ])
  );
  return tr
    .setSelection(TextSelection.create(tr.doc, autoComplete.pos))
    .setMeta(autoCompletePlugin, {
      type: "ADD_AUTO_COMPLETE",
      autoComplete: autoComplete,
    });
}

export function acceptAutoComplete(view: EditorView) {
  const { autoComplete } = autoCompletePlugin.getState(view.state) ?? {};
  if (!autoComplete || autoComplete.type === "starting") {
    return false;
  }
  view.dispatch(applyAutoComplete(view.state, autoComplete));
  return true;
}

function applyAutoComplete(
  state: EditorState,
  autoComplete: ProgressingAutoComplete
): Transaction {
  const tr = state.tr
    .setMeta(autoCompletePlugin, {
      type: "REMOVE_AUTO_COMPLETE",
    })
    .removeMark(
      autoComplete.pos,
      autoComplete.pos + autoComplete.content.length,
      textSchema.marks.autoComplete
    );
  return tr.setSelection(
    TextSelection.create(tr.doc, autoComplete.pos + autoComplete.content.length)
  );
}

export function getAutoCompleteDerivedState(state: EditorState): {
  state: "idle" | "waiting" | "autoCompleting";
} {
  const pluginState = autoCompletePlugin.getState(state);
  const autoComplete = pluginState?.autoComplete;
  return {
    state:
      autoComplete?.type === "progressing" || autoComplete?.type === "starting"
        ? "autoCompleting"
        : autoComplete
          ? "waiting"
          : "idle",
  };
}
