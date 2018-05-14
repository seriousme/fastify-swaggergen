const t = require("tap");
const test = t.test;

const path = require("path");
const Generator = require("../lib/generator");

// if you need new checksums (e.g. because you changed template or swaggerfile)
// run `node ..\generator.js -c test-swagger.v2.json > test-checksums.json`
const testChecksums = require("./test-checksums.json");

const specPath = path.join(__dirname, "test-swagger.v2.json");
const projectName = "generatedProject";
const dir = __dirname;
const checksumOnly = true;
const localPlugin = false;

const generator = new Generator(checksumOnly, localPlugin);
const handler = str => (checksumOnly ? JSON.stringify(str, null, 2) : str);

test("generator generates data matching checksums", t => {
  t.plan(1);
  generator
    .parse(specPath)
    .then(_ => {
      const checksums = generator.generateProject(dir, projectName);
      t.strictSame(checksums, testChecksums, "checksums match");
    })
    .catch(e => t.fail(e.message));
});
