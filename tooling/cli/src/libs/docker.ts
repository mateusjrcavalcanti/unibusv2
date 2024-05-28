import { promises as fs } from "fs";
import chalk from "chalk";
import Docker, {
  ContainerCreateOptions as DockerNodeContainerCreateOptions,
} from "dockerode";

import { verifyPackageJson } from "./paths";

interface DockerNodeContainerCreateOptionsExtended
  extends DockerNodeContainerCreateOptions {
  name: string;
}

interface ContainerCreateOptions {
  prefix?: string;
  preFunc?: () => Promise<void>;
  containerProps: DockerNodeContainerCreateOptionsExtended;
}

interface ContainerStartOptions extends ContainerCreateOptions {
  image: {
    tag?: string;
    files?: string[];
    dockerfile?: string;
    build?: boolean;
  };
}

const docker = new Docker();

export default docker;

export const findContainer = async (name: string) => {
  return (await docker.listContainers({ all: true })).find((container) =>
    container.Names?.includes(`/${name}`),
  );
};

export const Binds = async (bindsList: string[]) => {
  const filteredBinds = bindsList.filter((bind) => {
    const matches = bind.match(/:/g);
    return matches && (bind.startsWith(".") || bind.startsWith("/"));
  });

  const splitered = filteredBinds.map((bind) => bind.split(":"));

  for (const [directory] of splitered) {
    const splitDir = directory.split("/");
    if (splitDir[splitDir.length - 1].includes(".")) {
      await fs.mkdir(directory.replace(splitDir[splitDir.length - 1], ""), {
        recursive: true,
      });
    } else {
      await fs.mkdir(directory, { recursive: true });
    }
  }

  return bindsList;
};

export const findImage = async ({
  name,
  tag = "latest",
  prefix = "unibus",
}: {
  name: string;
  tag?: string;
  prefix?: string;
}) => {
  return (await docker.listImages()).find((image) =>
    image.RepoTags?.includes(`${prefix}-${name}:${tag}`),
  );
};

export const createImage = async ({
  prefix = "unibus",
  name,
  tag = "latest",
  dockerfile,
  build,
  files,
}: {
  prefix?: string;
  tag?: string;
  name: string;
  files: string[];
  dockerfile: string;
  build: boolean;
}) => {
  const { dockerfiles } = await verifyPackageJson();
  if (build || (await findImage({ name, tag, prefix })) === undefined) {
    const image = await new Promise<string>((resolve, reject) => {
      docker.buildImage(
        {
          context: dockerfiles,
          src: files,
        },
        { t: `${prefix}-${name}:${tag}`, dockerfile },
        (err, response) => {
          if (err) {
            console.log(
              chalk.red.bold(`Erro ao criar imagem:`),
              chalk.red(`${err.message}`),
            );
            reject(err);
          }

          response?.on("data", (chunk) => {
            const log = JSON.parse(chunk.toString("utf8")).stream;
            if (log) console.log(log?.trim());
          });

          response?.on("error", (err) => {
            console.log(
              chalk.red.bold(`Erro ao criar imagem:`),
              chalk.red(`${err.message}`),
            );
            reject(err);
          });

          response?.on("end", () => {
            console.log(
              chalk.green(`Imagem ${prefix}-${name}:${tag} criada com sucesso`),
            );
            resolve(`${prefix}-${name}:${tag}`);
          });
        },
      );
    });
    return image;
  } else {
    console.log("Imagem em cache");
    return `${prefix}-${name}:${tag}`;
  }
};

export const createContainer = async ({
  prefix = "unibus",
  preFunc,
  containerProps,
}: ContainerCreateOptions) => {
  const containerName = `${prefix}-${containerProps.name}`;

  // Run preFunc if exists
  if (preFunc) await preFunc();

  // Create container
  docker.createContainer(
    {
      ...containerProps,
      name: `${prefix}-${containerProps.name}`,
    },
    async (err, result) => {
      if (err) {
        console.log(
          chalk.red.bold(`Erro ao criar container ${containerName}:`),
          chalk.red(`${err.message}`),
        );
        return;
      }
      result?.start((err) => {
        if (err) {
          console.log(
            chalk.red.bold(`Erro ao iniciar container ${containerName}:`),
            chalk.red(`${err.message}`),
          );
        } else {
          console.log(
            chalk.green(`Container ${containerName} criado com sucesso`),
          );
        }
      });
    },
  );
};

export const runningContainer = async ({
  prefix,
  preFunc,
  image,
  containerProps,
}: ContainerStartOptions) => {
  const container = await findContainer(
    `${prefix || "unibus"}-${containerProps.name}`,
  );
  const { tag, files, dockerfile, build } = image;

  if (container && container?.State == "running")
    await docker.getContainer(container?.Id as string).stop();
  if (container && container?.State == "exited")
    await docker.getContainer(container?.Id as string).remove();

  const imageExists = await findImage({
    name: containerProps.name,
    tag,
    prefix,
  });

  if (!imageExists) {
    await createImage({
      prefix,
      name: containerProps.name,
      files: files || ["Dockerfile"],
      dockerfile: dockerfile || "Dockerfile",
      build: build || false,
    });
    console.log("resolvido");
  }

  await createContainer({
    prefix,
    preFunc,
    containerProps: {
      Image: `${prefix || "unibus"}-${containerProps.name}:${tag || "latest"}`,
      ...containerProps,
    },
  });

  return container;
};
