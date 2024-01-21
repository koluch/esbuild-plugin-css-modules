import fs from "fs-extra";
import util from "util";
import tmp from "tmp";
import path from "path";
import csstree from "css-tree";
import { Plugin } from "esbuild";
import { PathLike } from "fs";
import { Buffer } from "buffer";

import {
  escapeClassName,
  interpolatePattern,
  isSupportedHashDigest,
  isSupportedHashType,
  makeNameHash,
  SUPPORTED_DIGESTS,
  SUPPORTED_HASHES,
} from "./helpers";

const writeFile = util.promisify<PathLike, any>(fs.writeFile);
const readFile = util.promisify(fs.readFile);
const ensureDir = util.promisify(fs.ensureDir);

interface Options {
  localIdentName?: string;
  extension?: string;
}

export = (options: Options = {}): Plugin => ({
  name: "css-modules",
  setup: function (build) {
    const { extension = ".module.css", localIdentName = "[hash]" } = options;
    const filter = new RegExp(`.\/.+${extension.replace(/\./g, "\\.")}$`);

    const tmpDirPath = tmp.dirSync().name;

    build.onLoad({ filter }, async (args) => {
      const fileContent = (await readFile(args.path)) as Buffer;

      const baseName = path.basename(args.path, extension);
      const folderName = path.basename(path.dirname(args.path));
      const extName = extension;
      const preparedLocalIdentName = interpolatePattern(
        localIdentName,
        (name: string) => {
          switch (name) {
            case "ext":
              return escapeClassName(extName);
            case "name":
              return escapeClassName(baseName);
            case "path":
              return escapeClassName(args.path);
            case "folder":
              return escapeClassName(folderName);
          }
          return null;
        }
      );

      const ast = csstree.parse(fileContent.toString());
      const classMap: Record<string, string> = {};
      csstree.walk(ast, {
        visit: "ClassSelector",
        enter(node) {
          const newClassname = interpolatePattern(
            preparedLocalIdentName,
            (name: string, params: string[]) => {
              switch (name) {
                case "local":
                  return node.name;
                case "hash": {
                  const [lengthRaw, hashType, digestType] = params;

                  if (
                    hashType !== undefined &&
                    !isSupportedHashType(hashType)
                  ) {
                    throw new Error(
                      `Hash algorithm is not supported: ${hashType}. Supported algorithms: ${SUPPORTED_HASHES.join(
                        ", "
                      )}`
                    );
                  }
                  if (
                    digestType !== undefined &&
                    !isSupportedHashDigest(digestType)
                  ) {
                    throw new Error(
                      `Digest type is not supported: ${digestType}. Supported digests: ${SUPPORTED_DIGESTS.join(
                        ", "
                      )}`
                    );
                  }

                  const length: number | undefined =
                    parseInt(lengthRaw) || undefined;

                  return makeNameHash(
                    args.path + ":" + node.name,
                    length,
                    hashType,
                    digestType
                  );
                }
              }
              return null;
            }
          );
          classMap[node.name] = newClassname;
          node.name = newClassname;
        },
      });

      const baseFileName = path.basename(args.path, extension);
      const tmpFilePath = path.resolve(
        tmpDirPath,
        path.relative("/", path.dirname(args.path)),
        `${baseFileName}.css`
      );

      await ensureDir(path.dirname(tmpFilePath));
      // @ts-ignore
      await writeFile(tmpFilePath, csstree.generate(ast));

      let contents = `
        import "${tmpFilePath}";
        const result = ${JSON.stringify(classMap)};
        export default result;
      `;

      return {
        contents: contents,
      };
    });
  },
});
