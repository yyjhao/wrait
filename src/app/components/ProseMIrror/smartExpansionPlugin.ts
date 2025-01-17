import { getAI } from "@/app/api/ai/viewAI";
import { Plugin, PluginKey, EditorState, Transaction } from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import styles from "./../TextEditorWrapper.module.css";

export type SmartExpansionState =
  | {
      type: "generating";
      from: number;
      to: number;
      generatedText: string;
      generateType: "rewrite" | "expand";
    }
  | {
      type: "hintGenerating";
      from: number;
      to: number;
      generateType: "rewrite" | "expand";
    }
  | {
      type: "idle";
    };

type SmartExpansionCommand =
  | {
      type: "startGenerating";
      from: number;
      to: number;
      generateType: "rewrite" | "expand";
    }
  | {
      type: "updateGenerating";
      text: string;
    }
  | {
      type: "reset";
    }
  | {
      type: "hintGenerating";
      from: number;
      to: number;
      generateType: "rewrite" | "expand";
    };

function getCommand(tr: Transaction): SmartExpansionCommand | undefined {
  return tr.getMeta(smartExpansionKey);
}

function setCommand(tr: Transaction, command: SmartExpansionCommand) {
  return tr.setMeta(smartExpansionKey, command);
}

export const smartExpansionKey = new PluginKey<SmartExpansionState>(
  "smartExpansion"
);

export const SmartExpansionPlugin = new Plugin<SmartExpansionState>({
  key: smartExpansionKey,
  state: {
    init(): SmartExpansionState {
      return { type: "idle" };
    },
    apply(tr: Transaction, state: SmartExpansionState): SmartExpansionState {
      const meta = getCommand(tr);
      if (!meta) {
        return state;
      }
      switch (meta.type) {
        case "startGenerating":
          return {
            type: "generating",
            from: meta.from,
            to: meta.to,
            generatedText: "",
            generateType: meta.generateType,
          };
        case "updateGenerating":
          if (state.type === "generating") {
            return { ...state, generatedText: meta.text };
          }
          return state;
        case "reset":
          return { type: "idle" };
        case "hintGenerating":
          return {
            type: "hintGenerating",
            from: meta.from,
            to: meta.to,
            generateType: meta.generateType,
          };
      }
    },
  },
  view(editorView) {
    return {
      update(view, prevState) {
        const currentSelection = view.state.selection;
        const previousSelection = prevState.selection;

        if (currentSelection.eq(previousSelection)) {
          return;
        }
        const pluginState = smartExpansionKey.getState(view.state);
        if (pluginState?.type === "hintGenerating") {
          if (
            currentSelection.from !== currentSelection.to ||
            currentSelection.from !== pluginState.to
          ) {
            view.dispatch(
              setCommand(view.state.tr, {
                type: "reset",
              })
            );
          }
        } else if (pluginState?.type === "idle") {
          run(view, currentSelection.to);
        }
      },
    };
  },
  props: {
    handleKeyDown(view, event) {
      if (event.key === "Tab" && getAI(view)?.loaded) {
        const pluginState = smartExpansionKey.getState(view.state);
        if (pluginState?.type === "hintGenerating") {
          if (pluginState.generateType === "expand") {
            applyExpansion(view, pluginState.from, pluginState.to);
          } else {
            applyRewrite(view, pluginState.from, pluginState.to);
          }
          return true;
        }
      }
    },
    decorations(state: EditorState): DecorationSet | undefined {
      const pluginState = this.getState(state);
      if (!pluginState) {
        return;
      }
      switch (pluginState.type) {
        case "generating":
          return DecorationSet.create(state.doc, [
            Decoration.inline(pluginState.from, pluginState.to, {
              class: styles.expandingLoading,
            }),
          ]);
        case "hintGenerating":
          return DecorationSet.create(state.doc, [
            Decoration.inline(pluginState.from, pluginState.to, {
              class: styles.expandingLoading,
            }),
          ]);
        case "idle":
          return undefined;
        default:
          const _: never = pluginState;
      }
    },
  },
});

const MAX_MATCH = 2000;

function run(view: EditorView, to: number) {
  if (view.composing) return false;
  let state = view.state,
    $to = state.doc.resolve(to);
  let textBefore = $to.parent.textBetween(
    Math.max(0, $to.parentOffset - MAX_MATCH),
    $to.parentOffset,
    null,
    "\ufffc"
  );
  const match = textBefore.match(/(<[^>]+>$)/);
  if (match) {
    view.dispatch(
      setCommand(view.state.tr, {
        type: "hintGenerating",
        from: to - match[1].length,
        to: to,
        generateType: "expand",
      })
    );
    return;
  }
  const matchRewrite = textBefore.match(/(\[[^\]]+\]$)/);
  if (matchRewrite) {
    view.dispatch(
      setCommand(view.state.tr, {
        type: "hintGenerating",
        from: to - matchRewrite[1].length,
        to: to,
        generateType: "rewrite",
      })
    );
    return;
  }
  if (smartExpansionKey.getState(view.state)?.type === "hintGenerating") {
    view.dispatch(
      setCommand(view.state.tr, {
        type: "reset",
      })
    );
  }
}

export function applyExpansion(view: EditorView, from: number, to: number) {
  if (from === to) return false; // No selection

  const selectedText = view.state.doc
    .textBetween(from, to)
    .replace(/(^<)|(>$)/g, "");

  view.dispatch(
    setCommand(view.state.tr, {
      type: "startGenerating",
      from,
      to,
      generateType: "expand",
    })
  );

  const prefix = view.state.doc.textBetween(0, from);

  // Call AI endpoint
  fetchAiExpansion(view, prefix, selectedText)
    .then((expandedText) => {
      const newTr = setCommand(
        view.state.tr.replaceWith(
          from,
          to,
          view.state.schema.text(expandedText)
        ),
        {
          type: "reset",
        }
      );
      view.dispatch(newTr);
    })
    .catch((error) => {
      console.error("Error expanding text:", error);
      // Reset plugin state on error
      const errorTr = setCommand(view.state.tr, {
        type: "reset",
      });
      view.dispatch(errorTr);
    });
}

export function applyRewrite(view: EditorView, from: number, to: number) {
  if (from === to) return false; // No selection

  const selectedText = view.state.doc
    .textBetween(from, to)
    .replace(/(^\[)|(\]$)/g, "");

  view.dispatch(
    setCommand(view.state.tr, {
      type: "startGenerating",
      from,
      to,
      generateType: "rewrite",
    })
  );

  const prefix = view.state.doc.textBetween(0, from);

  // Call AI endpoint
  fetchAiRewrite(view, prefix, selectedText)
    .then((expandedText) => {
      const newTr = setCommand(
        view.state.tr.replaceWith(
          from,
          to,
          view.state.schema.text(expandedText)
        ),
        {
          type: "reset",
        }
      );
      view.dispatch(newTr);
    })
    .catch((error) => {
      console.error("Error expanding text:", error);
      // Reset plugin state on error
      const errorTr = setCommand(view.state.tr, {
        type: "reset",
      });
      view.dispatch(errorTr);
    });
}

async function fetchAiExpansion(
  view: EditorView,
  prefix: string,
  text: string
): Promise<string> {
  console.log(text);
  let generatedText = "";
  await getAI(view)?.request(
    {
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a writing assistant. You respond to the user's request by expanding what they say, following the style and context from the text before. ONLY output the expanded result without anything else before or after. Do NOT include the text before.
When expanding, follow the style and tone of the following text:
${prefix || "No text before."}`,
        },
        {
          role: "user",
          content: `${text}`,
        },
      ],
      temperature: 0.1,
    },
    (chunk) => {
      // Update the generated text
      generatedText = chunk;

      // Update the plugin state with the current generated text
      const tr = setCommand(view.state.tr, {
        type: "updateGenerating",
        text: generatedText,
      });
      view.dispatch(tr);
    }
  );
  return generatedText;
}

async function fetchAiRewrite(
  view: EditorView,
  prefix: string,
  text: string
): Promise<string> {
  let generatedText = "";
  await getAI(view)?.request(
    {
      stream: true,
      messages: [
        {
          role: "system",
          content: `You are a writing assistant. You respond to the user's request by rewriting what they say to improve coherence and readability.
1. The result should have the same style, tone and length as before.
2. Directly output the rewritten text ONLY without anything else before or after.
3. Do not include the text before, only the rewritten text.
`,
        },
        {
          role: "user",
          content: "rewrite this: Hey, thinking about a new hobby. Painting or gardening. Sounds relaxing, could be fun. What do you think?"
        },
        {
          role: "assistant",
          content: "Hey, I've been considering starting a new hobby, like painting or gardening. It sounds super relaxing, and I think it could be a lot of fun. What do you think?",
        },
        {
          role: "user",
          content: "rewrite this: Dear team, we got the new client. Big deal for us. Thanks for all the hard work. Let's keep it up."
        },
        {
          role: "assistant",
          content: "Dear team, I'm pleased to announce that we have successfully secured the new client. This is a major milestone for our company, and I want to thank everyone for their hard work in achieving this. Let's keep aiming for excellence in our upcoming projects."
        },
        {
          role: "user",
          content: `rewrite this: ${text}`,
        },
      ],
      temperature: 0,
    },
    (chunk) => {
      // Update the generated text
      generatedText = chunk;

      // Update the plugin state with the current generated text
      const tr = setCommand(view.state.tr, {
        type: "updateGenerating",
        text: generatedText,
      });
      view.dispatch(tr);
    }
  );
  return generatedText;
}

// Helper function to get the current state of the plugin
export function getSmartExpansionState(
  state: EditorState
): SmartExpansionState {
  return (
    smartExpansionKey.getState(state) || {
      type: "idle",
    }
  );
}
