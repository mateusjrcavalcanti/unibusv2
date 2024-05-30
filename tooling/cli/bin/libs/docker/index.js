"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContainer = exports.buildImage = exports.findImage = exports.findContainer = exports.CreateBindsDirectories = void 0;
const fs_1 = require("fs");
const chalk_1 = __importDefault(require("chalk"));
const dockerode_1 = __importDefault(require("dockerode"));
const paths_1 = require("../paths");
const docker = new dockerode_1.default();
exports.default = docker;
const CreateBindsDirectories = async (bindsList) => {
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
exports.CreateBindsDirectories = CreateBindsDirectories;
const findContainer = async (name, logs = true) => {
    const list = await docker.listContainers({ all: true });
    const filteredList = list.filter((container) => container.Names?.includes(`/${name}`));
    if (filteredList.length === 0) {
        logs && console.log(chalk_1.default.red(`Container ${name} not found`));
        return null;
    }
    else {
        return {
            containerInfo: filteredList[0],
            container: docker.getContainer(filteredList[0].Id),
        };
    }
};
exports.findContainer = findContainer;
const findImage = async ({ name, tag = "latest", }) => {
    const images = await docker.listImages();
    const filteredImages = images.filter((image) => image.RepoTags?.includes(`${name}:${tag}`));
    if (filteredImages.length === 0) {
        console.log(chalk_1.default.red(`Image ${name}:${tag} not found`));
        return null;
    }
    else {
        return {
            imageInfo: filteredImages[0],
            image: docker.getImage(filteredImages[0].Id),
        };
    }
};
exports.findImage = findImage;
async function buildImage({ name, tag = "latest", dockerfile, build = false, files, }) {
    const { dockerfiles } = await (0, paths_1.verifyPackageJson)();
    const finded = await (0, exports.findImage)({ name, tag });
    if (finded && !build) {
        console.log(chalk_1.default.yellow(`Image ${name}:${tag} already exists`));
        return;
    }
    const file = {
        context: dockerfiles,
        src: files,
    };
    const options = { t: `${name}:${tag}`, dockerfile };
    const stream = await docker.buildImage(file, options);
    for await (const chunk of stream) {
        const log = JSON.parse(chunk.toString("utf8"));
        if (log.stream) {
            process.stdout.write(log.stream);
        }
        else if (log.error) {
            process.stderr.write(log.error);
        }
        else {
            console.log(log);
        }
    }
}
exports.buildImage = buildImage;
const createContainer = async ({ func, options, }) => {
    if (func) {
        await func();
    }
    const container = await docker.createContainer({ ...options });
    await container.start();
    return container;
};
exports.createContainer = createContainer;
