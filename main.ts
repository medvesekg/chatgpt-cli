import "./src/loadEnv.ts";
import { AI } from "./src/ai.js";
import { CLIApp } from "./src/cli.js";
import {
  chatHandler,
  chatHistoryHandler,
  exitProgramHandler,
  resetChatHandler,
} from "./src/app.js";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

const argv = yargs(hideBin(process.argv)).parse();

const ai = new AI(process.env.API_KEY);

const systemPrompt = argv.s
  ? ``
  : `You are a helpful coding assistant. Your output will be directly streamed to a text terminal so use appropriate formatting. 
   Don't use code blocks and always use ANSI escape sequences for syntax highlighting - use \x1b as the escape sequence.  
   Write very short and concise answers. Answer only with code snippets if possible. Avoid overly explaining unless explicitly required.`;

const agent = ai.createAgent("gpt-4o", systemPrompt);

const app = new CLIApp({
  state: {
    filename: null,
    agent: agent,
  },
  bindings: [
    {
      inputs: ["exit", ":q"],
      handler: exitProgramHandler,
    },
    {
      inputs: [":reset", ":r"],
      handler: resetChatHandler,
    },
    {
      inputs: [":history", ":h"],
      handler: chatHistoryHandler,
    },
    {
      inputs: ["*"],
      handler: chatHandler,
    },
  ],
});

app.run();
