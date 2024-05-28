import { exec } from "child_process";
import fs from "fs";
import process from "process";
import { createCommand } from "commander";

import { Binds, runningContainer } from "../../libs/docker";
import { verifyPackageJson } from "../../libs/paths";

export default createCommand("up")
  .description("Inicia o container de desenvolvimento do A9G")
  .action(async () => await a9gContainer());

export const a9gContainer = async () => {
  const { a9g } = await verifyPackageJson();

  await runningContainer({
    image: {
      files: ["a9g.dockerfile", "a9g.sh"],
      dockerfile: "a9g.dockerfile",
      build: false,
    },
    preFunc: createAuhorityFile,
    containerProps: {
      name: "a9g",
      Tty: true,
      OpenStdin: true,
      HostConfig: {
        Binds: await Binds([
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
    },
  });
};

const createAuhorityFile = async () => {
  const { a9g } = await verifyPackageJson();
  const authorityFile = `${a9g}/data/.Xauthority`;
  // verifica que o arquivo de autoridade existe
  if (!fs.existsSync(authorityFile)) {
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
  }
};
