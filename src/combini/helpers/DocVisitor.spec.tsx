import { Node, Schema } from "prosemirror-model";
import { visit, DocConsumer } from "./DocVisitor";

// Define a basic schema for testing
const schema = new Schema({
  nodes: {
    doc: { content: "paragraph+" },
    paragraph: { content: "text*" },
    text: { inline: true },
  },
});

describe("visit", () => {
  it("should call enterNode and exitNode for each node in the tree", () => {
    // Create a mock implementation of DocConsumer
    const mockConsumer: DocConsumer = {
      enterNode: jasmine.createSpy("enterNode"),
      exitNode: jasmine.createSpy("exitNode"),
    };

    // Create a simple node tree for testing using the schema
    const childNode1 = schema.node("paragraph");
    const childNode2 = schema.node("paragraph");
    const parentNode = schema.node("doc", null, [childNode1, childNode2]);

    // Call the visit function with the mock consumer
    visit(parentNode, mockConsumer);

    // Verify that enterNode and exitNode were called correctly
    expect(mockConsumer.enterNode).toHaveBeenCalledWith(parentNode);
    expect(mockConsumer.enterNode).toHaveBeenCalledWith(childNode1);
    expect(mockConsumer.enterNode).toHaveBeenCalledWith(childNode2);

    expect(mockConsumer.exitNode).toHaveBeenCalledWith(childNode1);
    expect(mockConsumer.exitNode).toHaveBeenCalledWith(childNode2);
    expect(mockConsumer.exitNode).toHaveBeenCalledWith(parentNode);

    // Verify the order of calls
    const enterNodeCalls = (mockConsumer.enterNode as jasmine.Spy).calls.all();
    const exitNodeCalls = (mockConsumer.exitNode as jasmine.Spy).calls.all();

    expect(enterNodeCalls[0].args[0]).toBe(parentNode);
    expect(enterNodeCalls[1].args[0]).toBe(childNode1);
    expect(enterNodeCalls[2].args[0]).toBe(childNode2);

    expect(exitNodeCalls[0].args[0]).toBe(childNode1);
    expect(exitNodeCalls[1].args[0]).toBe(childNode2);
    expect(exitNodeCalls[2].args[0]).toBe(parentNode);
  });
});
