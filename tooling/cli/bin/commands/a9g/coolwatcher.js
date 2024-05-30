"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const docker_1 = __importDefault(require("../../libs/docker"));
const up_1 = require("./up");
exports.default = (0, commander_1.createCommand)("coolwatcher")
    .description("Inicia o container de desenvolvimento do A9G")
    .action(async () => {
    const container = await (0, up_1.a9gContainer)();
    container && (await coolwatcher(container));
});
const coolwatcher = async (container) => docker_1.default.getContainer(container?.Id).exec({
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
