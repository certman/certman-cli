import { defineCommand } from "citty";
import list from "./list.js";
import issue from "./issue.js";
import revoke from "./revoke.js";
import renew from "./renew.js";

export default defineCommand({
  meta: {
    name: "cert",
    description: "Certificate commands",
  },
  subCommands: {
    list,
    issue,
    revoke,
    renew,
  },
});
