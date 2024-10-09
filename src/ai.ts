import { input } from "@inquirer/prompts";
import OpenAI from "openai";
import { Stream } from "openai/streaming.mjs";

export class AI {
  private client;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
    });
  }

  createAgent(model: string, systemPrompt: string) {
    return new Agent(this.client, model, systemPrompt);
  }
}

export class CliChat {
  private agent;

  constructor(agent: Agent) {
    this.agent = agent;
    this.agent.setStreamHandler((chunk) => process.stdout.write(chunk));
  }

  async begin() {
    while (true) {
      let userInput = this.collectUserInput();
      await this.agent.ask(userInput);
      process.stdout.write("\n");
    }
  }

  async collectUserInput() {
    try {
      const userInput = await input({ message: ">" });
      if (userInput === "exit") {
        process.exit(0);
      }
      return userInput;
    } catch (e) {
      if (e.name === "ExitPromptError") {
        console.log("Goodbye");
        process.exit(0);
      }
    }
  }
}

export class Agent {
  private messages;
  private model;
  private client;

  constructor(client: typeof OpenAI, model: string, systemPrompt: string = "") {
    this.client = client;
    this.messages = [];
    this.model = model;
    if (systemPrompt) {
      this.addSystemMessage(systemPrompt);
    }
  }

  async ask(message: string, streamHandler: (chunk: string) => void) {
    this.addUserMessage(message);
    const stream = await this.sendMessages();
    const response = await this.handleStream(stream, streamHandler);
    this.addAssistantMessage(response);
    return response;
  }

  getMessages() {
    return this.messages;
  }

  resetMessages() {
    this.messages = this.messages.filter(
      (message) => message.role === "system"
    );
  }

  setMessages(messages) {
    this.messages = messages;
  }

  popMessage() {
    return this.messages.pop();
  }

  private async handleStream(
    stream: Stream<OpenAI.Chat.Completions.ChatCompletionChunk> & {
      _request_id?: string | null;
    },
    streamHandler: (chunk: string) => void | null = null
  ) {
    const responseParts = [];
    for await (const chunk of stream) {
      let part = chunk.choices[0]?.delta?.content || "";
      if (streamHandler) {
        streamHandler(part);
      }
      responseParts.push(part);
    }
    return responseParts.join("");
  }

  private addSystemMessage(message: string) {
    this.messages.push({
      role: "system",
      content: message,
    });
  }

  private addAssistantMessage(message: string) {
    this.messages.push({
      role: "assistant",
      content: message,
    });
  }

  private addUserMessage(message: string) {
    this.messages.push({
      role: "user",
      content: message,
    });
  }

  private sendMessages() {
    return this.client.chat.completions.create({
      model: this.model,
      messages: this.messages,
      stream: true,
    });
  }
}
