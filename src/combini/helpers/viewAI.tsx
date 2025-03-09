import { EditorView } from "prosemirror-view";
import { AI } from "./ai";

const map = new WeakMap<EditorView, AI>();

export function getAI(view: EditorView) {
  return map.get(view);
}

export function setAI(view: EditorView, ai: AI) {
  map.set(view, ai);
}
