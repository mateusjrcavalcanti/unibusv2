"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const docker_1 = require("../../libs/docker");
exports.default = (0, commander_1.createCommand)("findContainer")
    .description("Inicia o container de desenvolvimento do A9G")
    .action(async () => {
    const container = await (0, docker_1.findContainer)("unibus-a9g");
    console.table({
        id: container?.containerInfo?.Id,
        name: container?.containerInfo?.Names &&
            container?.containerInfo?.Names[0].slice(1),
        state: container?.containerInfo?.State,
    });
});
