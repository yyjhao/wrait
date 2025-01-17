# Wrait

Wrait is a text editor that uses local, in-browser AI with the [WebLLM](https://webllm.mlc.ai/) technology.

<img width="829" alt="Screenshot 2025-01-16 at 5 04 59 PM" src="https://github.com/user-attachments/assets/fb1e795b-89e3-4cbc-8ffe-e9618136a9e0" />

It depends on support for WebGPU in the browser, so e.g., it doesn't work on Safari.

Online demo: https://editor.yyjhao.com/

## Getting Started

To run the development server:

```bash
pnpm vite
```

## Main Entry Point

Go to `src/app/components/TextEditorWrapper.tsx` to see how the editor works.

This project also uses the UI library from [Combini](https://combini.dev/). You can check out the UI components [here](https://combini.dev/workspace/14349b68-63b5-4223-b5ee-b8d12ee27538/).
