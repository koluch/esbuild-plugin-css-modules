import { BinaryToTextEncoding, createHash } from "crypto";
import { Buffer } from "buffer";

export function interpolatePattern(
  string: string,
  replacer: (name: string, params: string[]) => string | null
) {
  let result = "";
  let rest = string;
  while (rest !== "") {
    let match = rest.match(/(\[.+?\])/);
    if (match != null) {
      const text = match[0];
      const index = match.index ?? 0;
      let match1 = text.match(/^\[(.+)\]$/);
      if (match1 == null) {
        // todo: could this happen?
        throw new Error(`Unexpected case`);
      }
      const [name, ...params] = match1[1].split(":");
      const replacedString = replacer(name, params);
      result +=
        rest.substr(0, index) +
        (replacedString == null ? text : replacedString);
      rest = rest.substr(index + text.length);
    } else {
      result += rest;
      rest = "";
    }
  }
  return result;
}

export function escapeClassName(string: string) {
  return string.replace(/^[^a-zA-Z_]/g, "").replace(/[^a-zA-Z0-9_-]/g, "-");
}

export const SUPPORTED_HASHES = ["md4", "md5", "sha256", "sha512"] as const;
export const SUPPORTED_DIGESTS = ["hex", "base64"] as const;

export type HashType = typeof SUPPORTED_HASHES[number];
export type HashDigest = typeof SUPPORTED_DIGESTS[number];

export function isSupportedHashType(raw: string): raw is HashType {
  return SUPPORTED_HASHES.indexOf(raw as HashType) !== -1;
}

export function isSupportedHashDigest(raw: unknown): raw is HashDigest {
  return SUPPORTED_DIGESTS.indexOf(raw as HashDigest) !== -1;
}

export function makeNameHash(
  name: string,
  maxLength: number = 32,
  type: HashType = "sha256",
  digest: HashDigest = "hex"
) {
  const buffer = Buffer.from(name, "utf8");

  const hash = createHash(type);
  hash.update(buffer);

  return `h${hash.digest(digest).substr(0, maxLength)}`;
}
