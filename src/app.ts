import fs from "fs";
import { select } from "@inquirer/prompts";
import { dirname } from "./dir.js";

export function exitProgramHandler() {
  process.stdout.write("Goodbye.\n");
  process.exit(0);
}

export function resetChatHandler(_, state) {
  state.agent.resetMessages();
  state.filename = null;
}

export async function chatHistoryHandler(_, state) {
  const files = fs.readdirSync(dirname + "/log");

  const selectedFilename = (await select({
    message: "Select a previous conversation",
    choices: files.filter((file) => file !== ".gitignore"),
  })) as string;

  const fileContents = fs.readFileSync(`${dirname}/log/${selectedFilename}`, {
    encoding: "utf8",
    flag: "r",
  });
  const selectedConversation = JSON.parse(fileContents);
  state.agent.setMessages(selectedConversation);
  state.filename = selectedFilename;
  process.stdout.write("\n");
  for (let message of selectedConversation) {
    if (message.role === "user") {
      process.stdout.write(`\x1b[32m✔\x1b[39m > ${message.content}\n\n`);
    } else if (message.role === "assistant") {
      process.stdout.write(`${message.content}\n\n`);
    }
  }
}

export async function chatHandler(userInput, state) {
  await state.agent.ask(userInput, (chunk) => {
    process.stdout.write(chunk);
  });
  process.stdout.write("\n");

  if (!state.filename) {
    const response = await state.agent.ask(
      "Please come up with a filesystem safe name for the file that will store this conversation. Don't include any date information and don't include the file extension. Respond only with the filename."
    );
    state.agent.popMessage();
    state.agent.popMessage();
    const date = new Date().toISOString().replaceAll(":", "-");
    const filename = response.replace(/[a-z]0-9_-/gi, "");
    state.filename = `${filename}_${date}.json`;
  }

  fs.writeFileSync(
    `${dirname}/log/${state.filename}`,
    JSON.stringify(state.agent.getMessages(), null, 2)
  );
}
