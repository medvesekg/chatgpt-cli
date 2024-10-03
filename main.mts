import dotenv from "dotenv";
dotenv.config({ path: import.meta.dirname + "/.env" });
import OpenAI from "openai";
import { input } from "@inquirer/prompts";
import fs from "fs";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import { Stream } from "openai/streaming.mjs";

const date = new Date().toISOString();

const client = new OpenAI({
  apiKey: process.env["API_KEY"],
});

const CONFIG = {
  model: "gpt-4o",
  systemPrompt: `You are a helpful coding assistant. Your output will be directly streamed to a text terminal so use appropriate formatting. 
      Don't use code blocks and always use ANSI escape sequences for syntax highlighting - use \x1b as the escape sequence.  
      Write very short and concise answers. Answer only with code snippets if possible. Avoid overly explaining unless explicitly required.
      `,
};

const messages: ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: CONFIG.systemPrompt,
  },
];

async function main() {
  if (process.argv.length === 3) {
    const cliQuestion = process.argv[2];
    await chat(cliQuestion);
  }

  while (true) {
    await chat(await prompt());
  }
}

async function chat(text: string) {
  messages.push({
    role: "user",
    content: text,
  });
  await handleStreamResponse(await sendMessages());
}

async function prompt() {
  let userInput = "";
  try {
    userInput = await input({ message: ">" });
  } catch (e) {
    if (e.name === "ExitPromptError") {
      console.log("Goodbye");
      process.exit(0);
    }
  }

  if (["exit", "q"].includes(userInput)) {
    process.exit(0);
  }

  return userInput;
}

async function sendMessages() {
  return client.chat.completions.create({
    model: CONFIG.model,
    messages: messages,
    stream: true,
  });
}

async function handleStreamResponse(
  stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
    _request_id?: string | null;
  }
) {
  const response = [];
  for await (const chunk of stream) {
    let part = chunk.choices[0]?.delta?.content || "";

    response.push(part);
    process.stdout.write(part);
  }
  process.stdout.write("\n");

  messages.push({
    role: "assistant",
    content: response.join(""),
  });

  fs.writeFileSync(
    `${import.meta.dirname}/log/${date}.json`,
    JSON.stringify(messages, null, 2)
  );
}

main();
