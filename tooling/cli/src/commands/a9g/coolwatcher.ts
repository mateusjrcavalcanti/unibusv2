import chalk from "chalk";
import { createCommand } from "commander";
import Dockerode from "dockerode";

import docker, { findContainer } from "../../libs/docker";
import { a9gContainer } from "./up";

export default createCommand("coolwatcher")
  .description("Inicia o container de desenvolvimento do A9G")
  .action(async () => {
    const container = await a9gContainer();

    container && (await coolwatcher(container));
  });

const coolwatcher = async (container: Dockerode.ContainerInfo) =>
  docker.getContainer(container?.Id).exec(
    {
      Cmd: ["/home/a9g/CSDTK/cooltools/coolwatcher"],
      User: "root",
      Tty: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
    },
    (err, exec) => {
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
    },
  );
