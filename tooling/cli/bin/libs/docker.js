"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runningContainer = exports.createContainer = exports.createImage = exports.findImage = exports.Binds = exports.findContainer = void 0;
const fs_1 = require("fs");
const chalk_1 = __importDefault(require("chalk"));
const dockerode_1 = __importDefault(require("dockerode"));
const paths_1 = require("./paths");
const docker = new dockerode_1.default();
exports.default = docker;
const findContainer = async (name) => {
    return (await docker.listContainers({ all: true })).find((container) => container.Names?.includes(`/${name}`));
};
exports.findContainer = findContainer;
const Binds = async (bindsList) => {
    const filteredBinds = bindsList.filter((bind) => {
        const matches = bind.match(/:/g);
        return matches && (bind.startsWith(".") || bind.startsWith("/"));
    });
    const splitered = filteredBinds.map((bind) => bind.split(":"));
    for (const [directory] of splitered) {
        const splitDir = directory.split("/");
        if (splitDir[splitDir.length - 1].includes(".")) {
            await fs_1.promises.mkdir(directory.replace(splitDir[splitDir.length - 1], ""), {
                recursive: true,
            });
        }
        else {
            await fs_1.promises.mkdir(directory, { recursive: true });
        }
    }
    return bindsList;
};
exports.Binds = Binds;
const findImage = async ({ name, tag = "latest", prefix = "unibus", }) => {
    return (await docker.listImages()).find((image) => image.RepoTags?.includes(`${prefix}-${name}:${tag}`));
};
exports.findImage = findImage;
const createImage = async ({ prefix = "unibus", name, tag = "latest", dockerfile, build, files, }) => {
    const { dockerfiles } = await (0, paths_1.verifyPackageJson)();
    if (build || (await (0, exports.findImage)({ name, tag, prefix })) === undefined) {
        const image = await new Promise((resolve, reject) => {
            docker.buildImage({
                context: dockerfiles,
                src: files,
            }, { t: `${prefix}-${name}:${tag}`, dockerfile }, (err, response) => {
                if (err) {
                    console.log(chalk_1.default.red.bold(`Erro ao criar imagem:`), chalk_1.default.red(`${err.message}`));
                    reject(err);
                }
                response?.on("data", (chunk) => {
                    const log = JSON.parse(chunk.toString("utf8")).stream;
                    if (log)
                        console.log(log?.trim());
                });
                response?.on("error", (err) => {
                    console.log(chalk_1.default.red.bold(`Erro ao criar imagem:`), chalk_1.default.red(`${err.message}`));
                    reject(err);
                });
                response?.on("end", () => {
                    console.log(chalk_1.default.green(`Imagem ${prefix}-${name}:${tag} criada com sucesso`));
                    resolve(`${prefix}-${name}:${tag}`);
                });
            });
        });
        return image;
    }
    else {
        console.log("Imagem em cache");
        return `${prefix}-${name}:${tag}`;
    }
};
exports.createImage = createImage;
const createContainer = async ({ prefix = "unibus", preFunc, containerProps, }) => {
    const containerName = `${prefix}-${containerProps.name}`;
    // Run preFunc if exists
    if (preFunc)
        await preFunc();
    // Create container
    docker.createContainer({
        ...containerProps,
        name: `${prefix}-${containerProps.name}`,
    }, async (err, result) => {
        if (err) {
            console.log(chalk_1.default.red.bold(`Erro ao criar container ${containerName}:`), chalk_1.default.red(`${err.message}`));
            return;
        }
        result?.start((err) => {
            if (err) {
                console.log(chalk_1.default.red.bold(`Erro ao iniciar container ${containerName}:`), chalk_1.default.red(`${err.message}`));
            }
            else {
                console.log(chalk_1.default.green(`Container ${containerName} criado com sucesso`));
            }
        });
    });
};
exports.createContainer = createContainer;
const runningContainer = async ({ prefix, preFunc, image, containerProps, }) => {
    const container = await (0, exports.findContainer)(`${prefix || "unibus"}-${containerProps.name}`);
    const { tag, files, dockerfile, build } = image;
    if (container && container?.State == "running")
        await docker.getContainer(container?.Id).stop();
    if (container && container?.State == "exited")
        await docker.getContainer(container?.Id).remove();
    const imageExists = await (0, exports.findImage)({
        name: containerProps.name,
        tag,
        prefix,
    });
    if (!imageExists) {
        await (0, exports.createImage)({
            prefix,
            name: containerProps.name,
            files: files || ["Dockerfile"],
            dockerfile: dockerfile || "Dockerfile",
            build: build || false,
        });
        console.log("resolvido");
    }
    await (0, exports.createContainer)({
        prefix,
        preFunc,
        containerProps: {
            Image: `${prefix || "unibus"}-${containerProps.name}:${tag || "latest"}`,
            ...containerProps,
        },
    });
    return container;
};
exports.runningContainer = runningContainer;
