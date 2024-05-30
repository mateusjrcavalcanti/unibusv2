import { exec } from "child_process";
import fs from "fs";
import process from "process";
import { createCommand } from "commander";

import { findImage } from "../../libs/docker";

export default createCommand("findImage")
  .description("Retorna sobre imagem")
  .action(async () => {
    const image = await findImage({ name: "unibus-a9g" });
    console.table({
      id: image?.imageInfo?.Id,
      tag: image?.imageInfo?.RepoTags && image?.imageInfo?.RepoTags[0],
    });
  });
