#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const commander_1 = require("commander");
const figlet_1 = __importDefault(require("figlet"));
const paths_1 = require("./libs/paths");
async function importCommands(mainCommand = commander_1.program, dirPath = path_1.default.resolve(__dirname, "commands")) {
    const fodlerName = dirPath.split("/").pop();
    const files = await promises_1.default.readdir(dirPath);
    for await (const file of files) {
        const filePath = path_1.default.resolve(dirPath, file);
        const isDirectory = (await promises_1.default.stat(filePath)).isDirectory();
        const fileName = file.split(".").shift();
        if (isDirectory) {
            const folderPath = path_1.default.resolve(filePath, `${fileName}.js`);
            const command = (await Promise.resolve(`${folderPath}`).then(s => __importStar(require(s)))).default;
            const newCommand = mainCommand
                .addCommand(command)
                .commands.find((command) => command.name() === fileName);
            await importCommands(newCommand, filePath);
        }
        else {
            if (!(fileName === fodlerName)) {
                const command = (await Promise.resolve(`${filePath}`).then(s => __importStar(require(s)))).default;
                const commandImported = mainCommand.addCommand(command);
            }
        }
    }
}
(async () => {
    try {
        await (0, paths_1.verifyPackageJson)();
        await importCommands();
        commander_1.program.addHelpText("beforeAll", figlet_1.default.textSync("UNIBUS", {
            whitespaceBreak: true,
        }));
        commander_1.program.parse(process.argv);
    }
    catch (err) {
        console.error("Erro ao listar arquivos:", err);
    }
})();
