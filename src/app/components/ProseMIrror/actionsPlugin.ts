import { Plugin, PluginKey } from "prosemirror-state";
import { Decoration, DecorationSet } from "prosemirror-view";

const pluginKey = new PluginKey("actions");

type PluginState = {
  pos: number | undefined;
};

export const actionsPlugin = new Plugin<PluginState>({
  key: pluginKey,
  state: {
    init() {
      return { pos: undefined };
    },
    apply(tr, value, oldState, newState) {
      const action = tr.getMeta(pluginKey);
      if (action && action.type === "SHOW_DROPDOWN") {
        return { pos: action.pos };
      } else if (action && action.type === "HIDE_DROPDOWN") {
        return { pos: undefined };
      }
      return value;
    },
  },
  props: {
    handleKeyDown(view, event) {
      if (event.key === "/") {
        const { $from } = view.state.selection;
        const pos = $from.pos + 1;
        view.dispatch(
          view.state.tr.setMeta(this, { type: "SHOW_DROPDOWN", pos })
        );
      }
      return false;
    },
  },
  view(editorView) {
    return {
      update(view, prevState) {
        if (view.state.selection == prevState.selection) {
          return;
        }
        const { pos } = actionsPlugin.getState(view.state) ?? {};
        if (pos !== undefined) {
          const { from } = view.state.selection;
          if (from !== pos) {
            view.dispatch(
              view.state.tr.setMeta(pluginKey, { type: "HIDE_DROPDOWN" })
            );
          }
        }
      },
    };
  },
});
