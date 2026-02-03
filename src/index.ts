import { defineCommand, runMain } from "citty";
import login from "./commands/login.js";
import logout from "./commands/logout.js";
import whoami from "./commands/whoami.js";
import ca from "./commands/ca/index.js";
import cert from "./commands/cert/index.js";

const main = defineCommand({
  meta: {
    name: "certman",
    version: "1.0.0",
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
