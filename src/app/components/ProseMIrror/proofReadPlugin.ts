import { getAI } from "@/app/api/ai/viewAI";
import {
  EditorState,
  Plugin,
  PluginKey,
  TextSelection,
  Transaction,
} from "prosemirror-state";
import { Decoration, DecorationSet, EditorView } from "prosemirror-view";
import { DiffMatchPatch } from "diff-match-patch-typescript";
import { Node } from "prosemirror-model";
import { Mapping } from "prosemirror-transform";
import { DocConsumer, visit } from "./DocVisitor";
import styles from "./../TextEditorWrapper.module.css";

export type State = {
  state: "proofReading" | "waiting" | "idle";
  activeProofRead: ProofRead | undefined;
  proofReads: ProofRead[];
};

// Define a plugin key for our proofreading plugin
const proofreadingPluginKey = new PluginKey<State>("proofreading");

export type ProofRead = {
  from: number;
  to: number;
  diff: string;
};

type Command =
  | {
      type: "updateState";
      state: "proofReading" | "waiting" | "idle";
    }
  | {
      type: "replace";
      proofReads: ProofRead[];
    }
  | {
      type: "delete";
      proofRead: ProofRead;
    }
  | {
      type: "activate";
      proofRead: ProofRead;
    }
  | {
      type: "reset";
    };

function getCommand(tr: Transaction): Command | undefined {
  return tr.getMeta(proofreadingPluginKey);
}

function setCommand(tr: Transaction, command: Command) {
  return tr.setMeta(proofreadingPluginKey, command);
}

function mapProofRead(item: ProofRead, mapping: Mapping) {
  const newFrom = mapping.mapResult(item.from);
  if (newFrom.deleted) {
    return undefined;
  }
  const newTo = mapping.mapResult(item.to);
  if (newTo.deleted) {
    return undefined;
  }
  return {
    from: newFrom.pos,
    to: newTo.pos,
    diff: item.diff,
  };
}

export const ProofReadPlugin = new Plugin<State>({
  key: proofreadingPluginKey,
  state: {
    init() {
      return { proofReads: [], activeProofRead: undefined, state: "idle" };
    },
    apply(tr, state) {
      const command = getCommand(tr);
      let newState: ProofRead[] = state.proofReads;
      let activeProofRead = state.activeProofRead;
      if (command) {
        switch (command.type) {
          case "updateState":
            if (command.state === "waiting" && state.state === "proofReading") {
              if (state.proofReads.length) {
                return {
                  ...state,
                  state: command.state,
                  activeProofRead: state.proofReads[0],
                };
              } else {
                return {
                  ...state,
                  state: "idle",
                  activeProofRead: undefined,
                };
              }
            }
            return {
              ...state,
              state: command.state,
            };
          case "replace":
            return {
              proofReads: command.proofReads,
              activeProofRead: undefined,
              state: state.state,
            };
          case "delete":
            const index = state.proofReads.findIndex((r) => {
              return (
                r.from === command.proofRead.from &&
                r.to === command.proofRead.to
              );
            });
            newState = state.proofReads.filter((r) => {
              return (
                r.from !== command.proofRead.from ||
                r.to !== command.proofRead.to
              );
            });
            if (
              activeProofRead?.from === command.proofRead.from &&
              activeProofRead?.to === command.proofRead.to
            ) {
              activeProofRead = newState[index] ?? newState[0];
            }
            break;
          case "activate":
            if (
              state.proofReads.some((r) => {
                return (
                  r.from === command.proofRead.from &&
                  r.to === command.proofRead.to
                );
              })
            ) {
              activeProofRead = command.proofRead;
            }
            break;
          case "reset":
            return {
              proofReads: [],
              activeProofRead: undefined,
              state: "idle",
            };
          default:
            let _command: never = command;
        }
      }
      if (tr.mapping.maps.length) {
        newState = newState
          .map((s) => {
            return mapProofRead(s, tr.mapping);
          })
          .filter((s): s is ProofRead => {
            return !!s;
          });
      }

      return {
        proofReads: newState,
        state: state.state,
        activeProofRead:
          activeProofRead && mapProofRead(activeProofRead, tr.mapping),
      };
    },
  },
  props: {
    handleKeyDown(view, event) {
      if (event.key == "'" && event.metaKey) {
        proofread(view);
      }
    },
    decorations(state) {
      const pluginState = proofreadingPluginKey.getState(state);
      if (!pluginState) {
        return;
      }
      return DecorationSet.create(
        state.doc,
        createDiffsDecorations(state.doc, pluginState.proofReads)
      );
    },
  },
});

async function proofReadBlock(view: EditorView, from: number, to: number) {
  const itemsBefore: ProofRead[] =
    proofreadingPluginKey.getState(view.state)?.proofReads ?? [];
  const selectedText = view.state.doc
    .textBetween(from, to)
    .replace(/( |“|”|’)/g, (s) => {
      if (s === " ") {
        return " ";
      }
      if (s === "“" || s === "”") {
        return '"';
      }
      if (s === "’") {
        return "'";
      }
      return s;
    });

  // Call the proofreading API
  let curText = "";
  await getAI(view)?.request(
    {
      stream: true,
      messages: [
        {
          role: "user",
          content: `Proof read the text after --- and output a version with only spelling, grammatical, spacing and word-use mistakes fixed.
Note:
1. Only correct words that are wrong. Improvement is not asked for.
2. Maintain the original tone and style.
3. Do not add new lines.
4. Only output the corrected text without anything else before or after.
---
${selectedText}`,
        },
      ],
      temperature: 0,
    },
    (text) => {
      const { state } = view;
      curText = text;
      // Update the plugin state with the proofreading results
      const diffs = generateProofReads(selectedText, curText, from, false);
      view.dispatch(
        setCommand(state.tr, {
          type: "replace",
          proofReads: [...itemsBefore, ...diffs],
        })
      );
    }
  );
  const diffs = generateProofReads(selectedText, curText, from, true);
  view.dispatch(
    setCommand(view.state.tr, {
      type: "replace",
      proofReads: [...itemsBefore, ...diffs],
    })
  );
}

// Function to initiate proofreading
export async function proofread(view: EditorView) {
  if (!getAI(view)?.loaded()) {
    return;
  }
  const { state } = view;

  if (proofreadingPluginKey.getState(state)?.state === "proofReading") {
    return;
  }

  const { selection } = state;
  const { from, to } =
    selection.from !== selection.to
      ? selection
      : {
          from: 0,
          to: view.state.doc.nodeSize - 2,
        };

  if (selection.from !== selection.to) {
    const newSelection = TextSelection.create(
      view.state.doc,
      selection.from,
      selection.from
    );
    // Dispatch the new selection
    view.dispatch(view.state.tr.setSelection(newSelection));
  }

  const slice = state.doc.slice(from, to);
  const consumer = new BlockConsumer(from - slice.openStart);

  const { content } = slice;
  for (let i = 0; i < content.childCount; i++) {
    let child: Node | null = content.child(i);
    visit(child, consumer);
  }

  view.dispatch(
    setCommand(view.state.tr, {
      type: "updateState",
      state: "proofReading",
    })
  );

  for (const [from, to] of consumer.getTextRanges()) {
    await proofReadBlock(view, from, to);
  }

  view.dispatch(
    setCommand(view.state.tr, {
      type: "updateState",
      state: "waiting",
    })
  );
}

class BlockConsumer implements DocConsumer {
  #curPos: number;
  #textStartEnd: [number, number][] = [];

  constructor(startPos: number) {
    this.#curPos = startPos;
  }

  enterNode(node: Node) {
    const isBlock = node.type.isBlock;
    if (isBlock) {
      this.#curPos += 1;
    }
  }

  exitNode(node: Node) {
    if (node.type.isBlock) {
      this.#curPos += 1;
    } else if (node.type.isText) {
      const nextPos = this.#curPos + node.nodeSize;
      this.#textStartEnd.push([this.#curPos, nextPos]);
      this.#curPos = nextPos;
    } else {
      this.#curPos += node.nodeSize;
    }
  }

  getTextRanges() {
    return this.#textStartEnd;
  }
}

function createDiffsDecorations(doc: Node, diffs: ProofRead[]) {
  let offset = 0;
  return diffs.map((diff) => {
    if (diff.from === diff.to) {
      return Decoration.widget(diff.from + offset, createInsertionWidget(diff));
    } else if (diff.diff === "") {
      return Decoration.inline(diff.from + offset, diff.to + offset, {
        class: styles.deleteStyle,
        "data-pf-diff": JSON.stringify(diff),
      });
    } else {
      // replacement
      return Decoration.inline(diff.from + offset, diff.to + offset, {
        class: styles.diffStyle,
        "data-pf-diff": JSON.stringify(diff),
      });
    }
  });
}

function createInsertionWidget(diff: ProofRead) {
  const span = document.createElement("span");
  span.className = styles.insertStyle;
  span.textContent = diff.diff;
  span.setAttribute("data-pf-diff", JSON.stringify(diff));
  return span;
}

function generateProofReads(
  oldStr: string,
  newStr: string,
  baseOffset: number,
  hasFinished: boolean
): ProofRead[] {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(oldStr, newStr);
  dmp.diff_cleanupSemantic(diffs);

  const proofReads: ProofRead[] = [];
  let offset = 0;
  let currentProofRead: ProofRead | null = null;

  for (const [op, text] of diffs) {
    if (op === 0) {
      // No change
      if (currentProofRead) {
        proofReads.push(currentProofRead);
        currentProofRead = null;
      }
      offset += text.length;
    } else if (op === -1) {
      // Deletion
      if (!currentProofRead) {
        currentProofRead = {
          from: baseOffset + offset,
          to: baseOffset + offset + text.length,
          diff: "",
        };
      } else {
        currentProofRead.to += text.length;
      }
      offset += text.length;
    } else if (op === 1) {
      // Insertion
      if (!currentProofRead) {
        currentProofRead = {
          from: baseOffset + offset,
          to: baseOffset + offset,
          diff: text,
        };
      } else {
        currentProofRead.diff += text;
      }
    }
  }

  if (currentProofRead) {
    proofReads.push(currentProofRead);
  }

  if (!hasFinished) {
    proofReads.pop();
  }

  return proofReads;
}

// Function to apply a suggestion
export function applySuggestion(view: EditorView, diff: ProofRead) {
  let tr = setCommand(view.state.tr, {
    type: "delete",
    proofRead: diff,
  });
  if (diff.diff) {
    tr = tr.replaceWith(diff.from, diff.to, view.state.schema.text(diff.diff));
  } else {
    tr = tr.deleteRange(diff.from, diff.to);
  }
  view.dispatch(tr);
}

// Function to apply a suggestion
export function rejectSuggestion(view: EditorView, diff: ProofRead) {
  const tr = setCommand(view.state.tr, {
    type: "delete",
    proofRead: diff,
  });
  view.dispatch(tr);
}

export function activateProofReadItem(view: EditorView, diff: ProofRead) {
  const tr = setCommand(view.state.tr, {
    type: "activate",
    proofRead: diff,
  });
  view.dispatch(tr);
}

export function resetProofRead(view: EditorView) {
  const tr = setCommand(view.state.tr, {
    type: "reset",
  });
  view.dispatch(tr);
}

export function getProofReadDerivedState(state: EditorState) {
  const pluginState = proofreadingPluginKey.getState(state);
  return {
    activeProofRead: pluginState?.activeProofRead,
    state: pluginState?.state ?? "idle",
  };
}
