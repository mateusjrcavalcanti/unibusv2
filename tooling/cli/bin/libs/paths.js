"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPackageJson = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
async function verifyPackageJson() {
    const packageJsonPath = path_1.default.resolve(process.cwd(), "package.json");
    try {
        const packageJson = JSON.parse(await promises_1.default.readFile(packageJsonPath, "utf-8"));
        if (packageJson.name !== "unibus" && packageJson.name !== "@unibus/a9g") {
            console.log(chalk_1.default.red("Este script só pode ser executado do diretório raiz 'unibus' ou dentro da aplicação '@unibus/cli'."));
            process.exit(1);
        }
        else {
            const name = packageJson.name;
            const monorepo = packageJson.name == "unibus"
                ? process.cwd()
                : path_1.default.resolve(process.cwd(), "..", "..");
            const a9g = path_1.default.resolve(monorepo, "apps", "a9g");
            const cli = path_1.default.resolve(__dirname, "..");
            const dockerfiles = path_1.default.resolve(cli, "dockerfiles");
            const data = path_1.default.resolve(cli, "data");
            return { a9g, monorepo, cli, dockerfiles, data };
        }
    }
    catch (err) {
        console.error("Erro ao ler package.json:", err);
        process.exit(1);
    }
}
exports.verifyPackageJson = verifyPackageJson;
