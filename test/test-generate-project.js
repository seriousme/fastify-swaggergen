const t = require("tap");
const test = t.test;

const path = require("path");
const Generator = require("../lib/generator");

const specPath = path.join(__dirname, "petstore-swagger.v2.json");
const projectName = "generatedProject";
const dir = path.resolve(__dirname, "../examples");
const checksumOnly = false;
const localPlugin = true;

const generator = new Generator(checksumOnly, localPlugin);
const handler = str => (checksumOnly ? JSON.stringify(str, null, 2) : str);

test("generator generates project without error", t => {
  t.plan(1);
  generator
    .parse(specPath)
    .then(_ => {
      generator.generateProject(dir, projectName);
      t.pass("no error occurred");
    })
    .catch(e => t.fail(e.message));
});
