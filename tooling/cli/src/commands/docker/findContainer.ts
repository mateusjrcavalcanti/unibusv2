import { exec } from "child_process";
import fs from "fs";
import process from "process";
import { createCommand } from "commander";

import { findContainer } from "../../libs/docker";
import { verifyPackageJson } from "../../libs/paths";

export default createCommand("findContainer")
  .description("Inicia o container de desenvolvimento do A9G")
  .action(async () => {
    const container = await findContainer("unibus-a9g");
    console.table({
      id: container?.containerInfo?.Id,
      name:
        container?.containerInfo?.Names &&
        container?.containerInfo?.Names[0].slice(1),
      state: container?.containerInfo?.State,
    });
  });
