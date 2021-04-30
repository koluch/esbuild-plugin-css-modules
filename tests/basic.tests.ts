import test from "tape";

const path = require("path");
const fs = require("fs-extra");
const esbuild = require("esbuild");
const { spawn } = require("child_process");

process.chdir(path.resolve(__dirname));

const cssModulesPlugin = require("../index.ts");

async function getBundleOutput(path: string): Promise<string> {
  const ls = spawn("node", [path]);

  return new Promise((resolve, reject) => {
    let result = "";
    ls.stdout.on("data", (data: string) => {
      result += data;
    });

    let error = "";
    ls.stderr.on("data", (data: string) => {
      error += data;
    });

    ls.on("close", (code: number) => {
      if (code === 0) {
        resolve(result);
      } else {
        reject(error);
      }
    });
  });
}

test("simplest case", function (t) {
  (async () => {
    fs.removeSync(".output");

    await esbuild.build({
      entryPoints: ["basic/index.js"],
      bundle: true,
      outfile: ".output/bundle.js",
      plugins: [
        cssModulesPlugin({
          localIdentName: "[folder]__[name]__[local]",
        }),
      ],
    });

    t.ok(fs.existsSync("./.output/bundle.js"), "Bundled js file should exist");
    t.ok(
      fs.existsSync("./.output/bundle.css"),
      "Bundled css file should exist"
    );

    const output = await getBundleOutput("./.output/bundle.js");
    t.equals(output.trim(), "basic__example__root");

    // const fileContent = fs.readFileSync('./.output/bundle.css').toString();
    //
    // t.ok(fileContent.indexOf(`body.isRed`) !== -1, 'Should contain compiled selector');

    t.end();
  })().catch((e) => t.fail(e.message));
});
