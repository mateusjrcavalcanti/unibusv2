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
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const docker_1 = __importStar(require("../../libs/docker"));
exports.default = (0, commander_1.createCommand)("coolwatcher")
    .description("Inicia o container de desenvolvimento do A9G")
    .action(async () => {
    const container = await (0, docker_1.findContainer)("unibus-a9g");
    if (container) {
        await docker_1.default.getContainer(container?.Id).exec({
            Cmd: ["/home/a9g/CSDTK/cooltools/coolwatcher"],
            User: "root",
            Tty: true,
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
        }, (err, exec) => {
            if (err) {
                console.error(err);
                process.exit(1);
            }
            if (exec) {
                exec.start({ stdin: true, hijack: true, Tty: true }, (err, stream) => {
                    if (err) {
                        console.error(err);
                        process.exit(1);
                    }
                    if (stream) {
                        process.stdin.pipe(stream);
                        stream.pipe(process.stdout);
                        stream.pipe(process.stderr);
                    }
                });
            }
        });
    }
});
