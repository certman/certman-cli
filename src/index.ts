import { defineCommand, runMain } from "citty";
import login from "./commands/login.js";
import logout from "./commands/logout.js";
import whoami from "./commands/whoami.js";
import ca from "./commands/ca/index.js";
import cert from "./commands/cert/index.js";

declare const __VERSION__: string;

const main = defineCommand({
  meta: {
    name: "certman",
    version: __VERSION__,
    description: "CLI for Certman certificate management",
  },
  subCommands: {
    login,
    logout,
    whoami,
    ca,
    cert,
  },
});

runMain(main);
