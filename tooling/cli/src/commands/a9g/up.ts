import { exec } from "child_process";
import fs from "fs";
import process from "process";
import chalk from "chalk";
import { createCommand } from "commander";

import {
  buildImage,
  CreateBindsDirectories,
  createContainer,
  findContainer,
  findImage,
} from "../../libs/docker";
import { verifyPackageJson } from "../../libs/paths";

export default createCommand("up")
  .description("Inicia o container de desenvolvimento do A9G")
  .action(async () => {
    await a9gContainer();
  });

export const a9gContainer = async () => {
  const { a9g } = await verifyPackageJson();

  const options = {
    name: "unibus-a9g",
    Image: "unibus-a9g",
    Tty: true,
    OpenStdin: true,
    HostConfig: {
      Binds: await CreateBindsDirectories([
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
      `DISPLAY=${process.env.DISPLAY || ":0"}`,
      "XAUTHORITY=/home/a9g/.Xauthority",
      "QT_X11_NO_MITSHM=1",
      `demo=${process.env.demo || ""}`,
    ],
    Entrypoint: ["/home/a9g/start.sh"],
  };

  const image = async () => await findImage({ name: options.Image });

  if (!(await image())) {
    await buildImage({
      name: options.Image,
      files: ["a9g.dockerfile", "a9g.sh"],
      dockerfile: "a9g.dockerfile",
      build: false,
    });
  }

  const container = await findContainer(options.name, false);

  if (!container) {
    await createContainer({
      func: createAuhorityFile,
      options,
    });
    const container = await findContainer(options.name, false);

    return container?.containerInfo;
  }

  if (container && container.containerInfo?.State == "running") {
    console.log(
      chalk.yellow(
        `Container ${container?.containerInfo?.Names[0].slice(1)} já está rodando`,
      ),
    );
    return container?.containerInfo;
  }

  if (container && container.containerInfo?.State == "exited") {
    await container.container.start();
    console.log(
      chalk.green(
        `Container ${container?.containerInfo?.Names[0].slice(1)} foi iniciado`,
      ),
    );
    return container?.containerInfo;
  }
};

const createAuhorityFile = async () => {
  const { a9g } = await verifyPackageJson();
  const authorityFile = `${a9g}/data/.Xauthority`;

  fs.writeFileSync(authorityFile, "");
  const command = `xauth nlist :0 | sed -e 's/^..../ffff/' | xauth -f '${authorityFile}' nmerge -`;

  exec(command, (error, stdout, stderr) => {
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
