import { defineCommand } from "citty";
import list from "./list.js";
import get from "./get.js";

export default defineCommand({
  meta: {
    name: "ca",
    description: "Certificate Authority commands",
  },
  subCommands: {
    list,
    get,
  },
});
