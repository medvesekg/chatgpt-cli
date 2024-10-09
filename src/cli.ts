import { input } from "@inquirer/prompts";

export class CLIApp {
  private state;
  private bindings;

  constructor({ state, bindings }) {
    this.state = state;
    this.bindings = bindings.reduce((bindingsObject, binding) => {
      for (let input of binding.inputs) {
        bindingsObject[input] = binding.handler;
      }
      return bindingsObject;
    }, {});
  }

  async run() {
    while (true) {
      const userInput = await input({ message: ">" });
      let handler = this.bindings[userInput] || this.bindings["*"];
      await Promise.resolve(handler(userInput, this.state));
    }
  }
}
