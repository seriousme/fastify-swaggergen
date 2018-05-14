// generator.js
// this could be extended to include examples mocks etc

const { mkdirSync, writeFileSync } = require("fs");
const path = require("path");
const crypto = require("crypto");
const parser = require("./parser");
const pluginPackage = require("../package.json");

function isObject(obj) {
  return typeof obj === "object" && obj !== null;
}

class generator {
  constructor(checksumOnly, localPlugin) {
    this.parser = parser();
    if (localPlugin) {
      // on windows the double backslash needs escaping to ensure it correctly shows up in printing
      this.localPlugin = path
        .join(__dirname, "..", "index.js")
        .replace(/\\/g, "\\\\");
      console.log("Using local plugin at:", this.localPlugin);
    }
    if (checksumOnly) {
      this.checksumOnly = true;
    }
    return this;
  }

  async parse(specification) {
    this.config = await this.parser.parse(specification);
    this.specification = this.parser.specification();
    return this;
  }

  generateService() {
    const makeService = require("./templates/service");
    return makeService(this.config);
  }

  generateCliRunner(specFile, service, pluginPackageName) {
    pluginPackageName =
      this.localPlugin || pluginPackageName || pluginPackage.name;
    const makeCliRunner = require("./templates/cli-runner");
    return makeCliRunner({ specFile, service, pluginPackageName });
  }

  generatePackage(opts) {
    if (!isObject(opts)) opts = {};
    const newPkg = require("./templates/package.json");
    const copyProps = (target, source, key) => {
      Object.keys(target[key]).forEach(
        item => (target[key][item] = source[key][item])
      );
    };

    const spec = {};
    const info = this.config.generic.info;
    if (info) {
      if (info.title) {
        spec.name = info.title
          .toLowerCase()
          .replace(/[^a-z0-9_]/, "")
          .substr(0, 214); //npm package name has maxlength of 214
      }
      if (info.description) {
        spec.description = info.description;
      }
    }

    newPkg.name = opts.name || spec.name || newPkg.name;
    newPkg.description =
      opts.description || spec.description || newPkg.description;
    copyProps(newPkg, pluginPackage, "scripts");
    copyProps(newPkg, pluginPackage, "dependencies");
    copyProps(newPkg, pluginPackage, "devDependencies");
    if (!this.localPlugin) {
      // add swaggergen as dependency for the generated code
      newPkg.dependencies[pluginPackage.name] = `^${pluginPackage.version}`;
    }
    return JSON.stringify(newPkg, null, 2);
  }

  generateTest(specFile, service, cliRunner) {
    const makeTest = require("./templates/test-plugin");
    return makeTest(
      Object.assign(this.config, { specFile, service, cliRunner })
    );
  }

  generateReadme(project, instructions) {
    const makeReadme = require("./templates/README.md");
    return makeReadme(project, instructions);
  }

  /**
   *
   * @param {string} dir Directory where the project has been generated
   */
  done(dir) {
    dir = dir || "this directory";
    return;
  }

  generateProject(dir, project) {
    const instructions = require("./templates/instructions.js");
    const contents = (dir, fileName, data) => {
      return {
        path: path.join(dir, fileName),
        data,
        fileName
      };
    };

    const projectDir = path.join(dir, project);
    const testDir = path.join(projectDir, "test");
    const dirMode = 0o755;

    const swaggerFile = "swagger.json";
    const serviceFile = "service.js";
    const cliRunnerFile = "cli-runner.js";
    const files = {
      swagger: contents(
        projectDir,
        swaggerFile,
        JSON.stringify(this.specification, null, 2)
      ),
      service: contents(projectDir, serviceFile, this.generateService()),
      cliRunner: contents(
        projectDir,
        cliRunnerFile,
        this.generateCliRunner(swaggerFile, serviceFile)
      ),
      package: contents(projectDir, "package.json", this.generatePackage()),
      readme: contents(
        projectDir,
        "README.md",
        this.generateReadme(project, instructions())
      ),
      testPlugin: contents(
        testDir,
        "test-plugin.js",
        this.generateTest(swaggerFile, serviceFile, cliRunnerFile)
      )
    };

    const fileOpts = {
      encoding: "utf8",
      mode: 0o644
    };

    const generated = { files: {} };
    if (!this.checksumOnly) {
      try {
        mkdirSync(projectDir, dirMode);
        mkdirSync(testDir, dirMode);
      } catch (error) {
        if (error.code !== "EEXIST") throw error;
      }
      generated.dirs = [];
      generated.dirs.push(testDir);
      generated.dirs.push(projectDir);
    }

    for (const key of Object.keys(files)) {
      const file = files[key];
      const hash = crypto.createHash("sha256");
      hash.update(file.data);
      generated.files[key] = {
        fileName: file.fileName,
        checksum: hash.digest("hex")
      };
      if (!this.checksumOnly) {
        generated.files[key].path = file.path;
        writeFileSync(file.path, file.data, fileOpts);
      }
    }

    if (this.checksumOnly) {
      return generated;
    }
    return `Your project has been generated in "${project}"
${instructions(project)}
`;
  }
}

module.exports = generator;
