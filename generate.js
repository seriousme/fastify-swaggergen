const path = require("path");
const Generator = require("./lib/generator");
const argvParser = require("minimist");

function usage() {
  console.log(`Usage: ${path.basename(__filename)} <swagger specification>`);
  process.exit(1);
}

const spec = process.argv[2];
if (!spec) {
  usage();
}

const specPath = path.join(__dirname, spec);
const projectName = "generatedProject";
const dir = __dirname;
const checksumOnly = true;
const localPlugin = false;

const generator = new Generator({ checksumOnly, localPlugin });
const handler = str => (checksumOnly ? JSON.stringify(str, null, 2) : str);

generator
  .parse(specPath)
  .then(_ => console.log(handler(generator.generateProject(dir, projectName))))
  .catch(e => console.log(e.message));
