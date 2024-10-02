import "dotenv/config";
import OpenAI from "openai";
import { input } from "@inquirer/prompts";
import { marked } from "marked";
import { markedTerminal } from "marked-terminal";
import fs from "fs";

marked.use(markedTerminal());

async function main() {
  const client = new OpenAI({
    apiKey: process.env["API_KEY"],
  });

  const messages = [];

  while (true) {
    const question = await input({ message: ">" });
    if (question === "exit") {
      return;
    }

    messages.push({
      role: "user",
      content: question,
    });

    const stream = await client.chat.completions.create({
      model: "gpt-4o",
      messages: messages,
      stream: true,
    });

    const response = [];
    for await (const chunk of stream) {
      let part = chunk.choices[0]?.delta?.content || "";

      response.push(part);
      process.stdout.write(part);
    }

    process.stdout.write(
      "\n\n=======================================================================================\n\n"
    );

    const responseText = response.join("");

    messages.push({
      role: "assistant",
      content: responseText,
    });
    const parsed = marked.parse(responseText);
    process.stdout.write(typeof parsed === "string" ? parsed : "");
  }
}

main();
