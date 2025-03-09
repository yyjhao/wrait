import * as webllm from "@mlc-ai/web-llm";

export class AI {
  #engine: webllm.MLCEngineInterface | undefined;

  #loaded = false;

  loaded() {
    return this.#loaded;
  }

  constructor(
    private readonly initProgressCallback: webllm.InitProgressCallback,
  ) {}

  async load() {
    this.#engine = await webllm.CreateMLCEngine(
      "Llama-3.2-3B-Instruct-q4f32_1-MLC",
      {
        initProgressCallback: this.initProgressCallback,
      },
    );
    this.#loaded = true;
  }

  async completion(
    prefix: string,
    onUpdate: (v: string, abort: () => void) => void,
  ) {
    const ids = [
      ...(this.#engine as any).getPipeline().tokenizer.encode(prefix),
    ];
    let shouldAbort = false;
    const abort = () => {
      shouldAbort = true;
    };
    let cur = await this.#engine?.forwardTokensAndSample(ids, false);
    if (!cur) {
      this.#engine?.resetChat();
      return "";
    }
    const output: number[] = [cur];
    for (let i = 0; i < 100; i++) {
      if (shouldAbort) {
        this.#engine?.resetChat();
        return (this.#engine as any).getPipeline().tokenizer.decode(output);
      }
      cur = await this.#engine?.forwardTokensAndSample([cur!], false);
      if (cur) {
        output.push(cur);
        const result: string = (this.#engine as any)
          .getPipeline()
          .tokenizer.decode(output);
        onUpdate(result, abort);
        if (result.endsWith(".")) {
          break;
        }
      } else {
        break;
      }
    }

    this.#engine?.resetChat();

    return (this.#engine as any).getPipeline().tokenizer.decode(output);
  }

  async request(
    request: webllm.ChatCompletionRequestStreaming,
    onUpdate: (v: string, abort: () => void) => void,
  ) {
    let shouldAbort = false;
    const abort = () => {
      shouldAbort = true;
    };
    const asyncChunkGenerator =
      await this.#engine?.chat.completions.create(request);
    if (!asyncChunkGenerator) {
      return;
    }
    let message = "";
    for await (const chunk of asyncChunkGenerator) {
      message += chunk.choices?.[0]?.delta?.content || "";
      onUpdate(message, abort);
      if (chunk.usage) {
        console.log(chunk.usage); // only last chunk has usage
      }
      if (shouldAbort) {
        this.#engine?.interruptGenerate();
      }
    }
  }
}
