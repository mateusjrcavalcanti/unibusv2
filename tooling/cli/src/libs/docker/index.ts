import { promises as fs } from "fs";
import chalk from "chalk";
import Docker, { ContainerCreateOptions } from "dockerode";

import { verifyPackageJson } from "../paths";

interface ContainerCreateOptionsWithName extends ContainerCreateOptions {
  name: string;
}

const docker = new Docker();

export default docker;

export const CreateBindsDirectories = async (bindsList: string[]) => {
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

export const findContainer = async (name: string, logs = true) => {
  const list = await docker.listContainers({ all: true });
  const filteredList = list.filter((container) =>
    container.Names?.includes(`/${name}`),
  );
  if (filteredList.length === 0) {
    logs && console.log(chalk.red(`Container ${name} not found`));
    return null;
  } else {
    return {
      containerInfo: filteredList[0],
      container: docker.getContainer(filteredList[0].Id),
    };
  }
};

export const findImage = async ({
  name,
  tag = "latest",
}: {
  name: string;
  tag?: string;
  prefix?: string;
}) => {
  const images = await docker.listImages();

  const filteredImages = images.filter((image) =>
    image.RepoTags?.includes(`${name}:${tag}`),
  );

  if (filteredImages.length === 0) {
    console.log(chalk.red(`Image ${name}:${tag} not found`));
    return null;
  } else {
    return {
      imageInfo: filteredImages[0],
      image: docker.getImage(filteredImages[0].Id),
    };
  }
};

export async function buildImage({
  name,
  tag = "latest",
  dockerfile,
  build = false,
  files,
}: {
  tag?: string;
  name: string;
  files: string[];
  dockerfile: string;
  build: boolean;
}) {
  const { dockerfiles } = await verifyPackageJson();

  const finded = await findImage({ name, tag });

  if (finded && !build) {
    console.log(chalk.yellow(`Image ${name}:${tag} already exists`));
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
    } else if (log.error) {
      process.stderr.write(log.error);
    } else {
      console.log(log);
    }
  }
}

export const createContainer = async ({
  func,
  options,
}: {
  func?: () => Promise<void>;
  options: ContainerCreateOptionsWithName;
}) => {
  if (func) {
    await func();
  }

  const container = await docker.createContainer({ ...options });
  await container.start();

  return container;
};
