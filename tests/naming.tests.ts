import test from "tape";

const path = require("path");
const fs = require("fs-extra");
const esbuild = require("esbuild");
const { spawn } = require("child_process");

process.chdir(path.resolve(__dirname));

const cssModulesPlugin = require("../index.ts");
const { escapeClassName } = require("../helpers.ts");

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

async function run(localIdentName: string) {
  fs.removeSync(".output");
  await esbuild.build({
    entryPoints: ["naming/index.js"],
    bundle: true,
    outfile: ".output/bundle.js",
    plugins: [
      cssModulesPlugin({
        localIdentName,
      }),
    ],
  });

  const output = await getBundleOutput("./.output/bundle.js");
  return output.trim();
}

test("naming: folder", function (t) {
  (async () => {
    t.equals(await run("[folder]"), "naming");
    t.end();
  })().catch((e) => t.fail(e.message));
});

test("naming: name", function (t) {
  (async () => {
    t.equals(await run("[name]"), "example");
    t.end();
  })().catch((e) => t.fail(e.message));
});

test("naming: ext", function (t) {
  (async () => {
    t.equals(await run("[ext]"), "module-css");
    t.end();
  })().catch((e) => t.fail(e.message));
});

test("naming: path", function (t) {
  (async () => {
    let cssFilePath = path.resolve(__dirname, "./naming/example.module.css");
    t.equals(await run("[path]"), escapeClassName(cssFilePath));
    t.end();
  })().catch((e) => t.fail(e.message));
});

// todo: test hashing

test("naming: complex pattern", function (t) {
  (async () => {
    t.equals(await run("[folder]__[name]__[local]"), "naming__example__root");
    t.end();
  })().catch((e) => t.fail(e.message));
});
