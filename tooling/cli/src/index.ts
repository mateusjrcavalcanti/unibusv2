#!/usr/bin/env node
import fs from "fs/promises";
import path from "path";
import { program } from "commander";
import figlet from "figlet";

import { verifyPackageJson } from "./libs/paths";

async function importCommands(
  mainCommand = program,
  dirPath = path.resolve(__dirname, "commands"),
) {
  const fodlerName = dirPath.split("/").pop() as string;
  const files = await fs.readdir(dirPath);

  for await (const file of files) {
    const filePath = path.resolve(dirPath, file);
    const isDirectory = (await fs.stat(filePath)).isDirectory();
    const fileName = file.split(".").shift() as string;
    if (isDirectory) {
      const folderPath = path.resolve(filePath, `${fileName}.js`);
      const command = (await import(folderPath)).default;
      const newCommand = mainCommand
        .addCommand(command)
        .commands.find((command) => command.name() === fileName);
      await importCommands(newCommand, filePath);
    } else {
      if (!(fileName === fodlerName)) {
        const command = (await import(filePath)).default;
        const commandImported = mainCommand.addCommand(command);
      }
    }
  }
}

(async () => {
  try {
    await verifyPackageJson();
    await importCommands();
    program.addHelpText(
      "beforeAll",
      figlet.textSync("UNIBUS", {
        whitespaceBreak: true,
      }),
    );
    program.parse(process.argv);
  } catch (err) {
    console.error("Erro ao listar arquivos:", err);
  }
})();
