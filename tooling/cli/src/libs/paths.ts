import fs from "fs/promises";
import path from "path";
import chalk from "chalk";

export async function verifyPackageJson() {
  const packageJsonPath = path.resolve(process.cwd(), "package.json");
  try {
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    if (packageJson.name !== "unibus" && packageJson.name !== "@unibus/a9g") {
      console.log(
        chalk.red(
          "Este script só pode ser executado do diretório raiz 'unibus' ou dentro da aplicação '@unibus/cli'.",
        ),
      );

      process.exit(1);
    } else {
      const name = packageJson.name;
      const monorepo =
        packageJson.name == "unibus"
          ? process.cwd()
          : path.resolve(process.cwd(), "..", "..");
      const a9g = path.resolve(monorepo, "apps", "a9g");
      const cli = path.resolve(__dirname, "..");
      const dockerfiles = path.resolve(cli, "dockerfiles");
      const data = path.resolve(cli, "data");

      return { a9g, monorepo, cli, dockerfiles, data };
    }
  } catch (err) {
    console.error("Erro ao ler package.json:", err);
    process.exit(1);
  }
}
