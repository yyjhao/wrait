import { Node } from "prosemirror-model";

export interface DocConsumer {
  enterNode(node: Node): void;
  exitNode(node: Node): void;
}

export function visit(node: Node, consumer: DocConsumer) {
  consumer.enterNode(node);
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    visit(child, consumer);
  }
  consumer.exitNode(node);
}
