import { AI } from "./ai";
import * as webllm from "@mlc-ai/web-llm";

describe("AI", () => {
  let mockEngine: any;
  let mockPipeline: any;
  let mockTokenizer: any;

  beforeEach(() => {
    mockTokenizer = {
      encode: jasmine.createSpy("encode").and.returnValue([1, 2, 3]),
      decode: jasmine.createSpy("decode").and.returnValue("test output"),
    };

    mockPipeline = {
      tokenizer: mockTokenizer,
    };

    mockEngine = {
      getPipeline: () => mockPipeline,
      forwardTokensAndSample: jasmine.createSpy("forwardTokensAndSample"),
      resetChat: jasmine.createSpy("resetChat"),
      chat: {
        completions: {
          create: jasmine.createSpy("create"),
        },
      },
      interruptGenerate: jasmine.createSpy("interruptGenerate"),
    };

    spyOn(webllm, "CreateMLCEngine").and.returnValue(
      Promise.resolve(mockEngine),
    );
  });

  it("should load successfully", async () => {
    const progressCallback = jasmine.createSpy("progressCallback");
    const ai = new AI(progressCallback);

    await ai.load();

    expect(webllm.CreateMLCEngine).toHaveBeenCalledWith(
      "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      { initProgressCallback: progressCallback },
    );
    expect(ai.loaded()).toBe(true);
  });

  it("should handle completion successfully", async () => {
    const ai = new AI(() => {});
    await ai.load();

    mockEngine.forwardTokensAndSample.and.returnValues(
      Promise.resolve(4),
      Promise.resolve(5),
      Promise.resolve(null),
    );

    const onUpdate = jasmine.createSpy("onUpdate");
    const result = await ai.completion("test input", onUpdate);

    expect(mockTokenizer.encode).toHaveBeenCalledWith("test input");
    expect(mockEngine.forwardTokensAndSample).toHaveBeenCalled();
    expect(mockEngine.resetChat).toHaveBeenCalled();
    expect(result).toBe("test output");
  });

  it("should handle completion abort", async () => {
    const ai = new AI(() => {});
    await ai.load();

    mockEngine.forwardTokensAndSample.and.returnValues(
      Promise.resolve(4),
      Promise.resolve(5),
    );

    const onUpdate = (text: string, abort: () => void) => {
      abort();
    };

    const result = await ai.completion("test input", onUpdate);

    expect(mockEngine.resetChat).toHaveBeenCalled();
    expect(result).toBe("test output");
  });

  it("should handle request successfully", async () => {
    const ai = new AI(() => {});
    await ai.load();

    const mockGenerator = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "Hello" } }] };
        yield { choices: [{ delta: { content: " World" } }] };
        yield { usage: { total_tokens: 10 } };
      },
    };

    mockEngine.chat.completions.create.and.returnValue(
      Promise.resolve(mockGenerator),
    );

    const onUpdate = jasmine.createSpy("onUpdate");
    await ai.request({ messages: [] }, onUpdate);

    expect(onUpdate).toHaveBeenCalledWith("Hello", jasmine.any(Function));
    expect(onUpdate).toHaveBeenCalledWith("Hello World", jasmine.any(Function));
  });

  it("should handle request abort", async () => {
    const ai = new AI(() => {});
    await ai.load();

    const mockGenerator = {
      async *[Symbol.asyncIterator]() {
        yield { choices: [{ delta: { content: "Hello" } }] };
      },
    };

    mockEngine.chat.completions.create.and.returnValue(
      Promise.resolve(mockGenerator),
    );

    const onUpdate = (text: string, abort: () => void) => {
      abort();
    };

    await ai.request({ messages: [] }, onUpdate);

    expect(mockEngine.interruptGenerate).toHaveBeenCalled();
  });
});
