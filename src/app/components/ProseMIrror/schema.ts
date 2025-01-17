import { Schema } from "prosemirror-model";
import styles from "../TextEditorWrapper.module.css";

export const textSchema = new Schema({
  nodes: {
    text: {
      group: "inline",
    },
    paragraph: {
      group: "block",
      content: "inline*",
      toDOM() {
        return ["p", 0];
      },
      parseDOM: [{ tag: "p" }],
    },
    doc: { content: "block+" },
  },
  marks: {
    autoComplete: {
      toDOM() {
        return [
          "span",
          { contentEditable: "false", class: styles.autoComplete },
          0,
        ];
      },
    },
  },
});
