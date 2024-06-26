"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.a9gContainer = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const process_1 = __importDefault(require("process"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const docker_1 = require("../../libs/docker");
const paths_1 = require("../../libs/paths");
exports.default = (0, commander_1.createCommand)("up")
    .description("Inicia o container de desenvolvimento do A9G")
    .action(async () => {
    await (0, exports.a9gContainer)();
});
const a9gContainer = async () => {
    const { a9g } = await (0, paths_1.verifyPackageJson)();
    const options = {
        name: "unibus-a9g",
        Image: "unibus-a9g",
        Tty: true,
        OpenStdin: true,
        HostConfig: {
            Binds: await (0, docker_1.CreateBindsDirectories)([
                `${a9g}/data/hex/:/home/a9g/GPRS_C_SDK/hex/`,
                `${a9g}/data/include/:/home/a9g/include/`,
                `${a9g}/data/libs/:/home/a9g/libs/`,
                `${a9g}/project:/home/a9g/GPRS_C_SDK/unibus/`,
                "/tmp/.X11-unix:/tmp/.X11-unix:rw",
                `${a9g}/data/.Xauthority:/home/a9g/.Xauthority:rw`,
            ]),
            Devices: [
                {
                    PathOnHost: "/dev/ttyUSB0",
                    PathInContainer: "/dev/ttyUSB0",
                    CgroupPermissions: "rwm",
                },
            ],
            NetworkMode: "none",
        },
        Env: [
            `DISPLAY=${process_1.default.env.DISPLAY || ":0"}`,
            "XAUTHORITY=/home/a9g/.Xauthority",
            "QT_X11_NO_MITSHM=1",
            `demo=${process_1.default.env.demo || ""}`,
        ],
        Entrypoint: ["/home/a9g/start.sh"],
    };
    const image = async () => await (0, docker_1.findImage)({ name: options.Image });
    if (!(await image())) {
        await (0, docker_1.buildImage)({
            name: options.Image,
            files: ["a9g.dockerfile", "a9g.sh"],
            dockerfile: "a9g.dockerfile",
            build: false,
        });
    }
    const container = await (0, docker_1.findContainer)(options.name, false);
    if (!container) {
        await (0, docker_1.createContainer)({
            func: createAuhorityFile,
            options,
        });
        const container = await (0, docker_1.findContainer)(options.name, false);
        return container?.containerInfo;
    }
    if (container && container.containerInfo?.State == "running") {
        console.log(chalk_1.default.yellow(`Container ${container?.containerInfo?.Names[0].slice(1)} já está rodando`));
        return container?.containerInfo;
    }
    if (container && container.containerInfo?.State == "exited") {
        await container.container.start();
        console.log(chalk_1.default.green(`Container ${container?.containerInfo?.Names[0].slice(1)} foi iniciado`));
        return container?.containerInfo;
    }
};
exports.a9gContainer = a9gContainer;
const createAuhorityFile = async () => {
    const { a9g } = await (0, paths_1.verifyPackageJson)();
    const authorityFile = `${a9g}/data/.Xauthority`;
    fs_1.default.writeFileSync(authorityFile, "");
    const command = `xauth nlist :0 | sed -e 's/^..../ffff/' | xauth -f '${authorityFile}' nmerge -`;
    (0, child_process_1.exec)(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Erro ao executar o comando: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Erro de execução: ${stderr}`);
            return;
        }
    });
};
