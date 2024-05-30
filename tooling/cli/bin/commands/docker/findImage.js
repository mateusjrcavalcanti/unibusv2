"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const docker_1 = require("../../libs/docker");
exports.default = (0, commander_1.createCommand)("findImage")
    .description("Retorna sobre imagem")
    .action(async () => {
    const image = await (0, docker_1.findImage)({ name: "unibus-a9g" });
    console.table({
        id: image?.imageInfo?.Id,
        tag: image?.imageInfo?.RepoTags && image?.imageInfo?.RepoTags[0],
    });
});
