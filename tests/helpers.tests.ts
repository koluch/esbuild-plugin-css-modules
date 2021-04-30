import test from "tape";
import { escapeClassName, interpolatePattern, makeNameHash } from "../helpers";

test("helpers: escapeClassName", function (t) {
  t.equals(escapeClassName(""), "");
  t.equals(escapeClassName("test"), "test");
  t.equals(escapeClassName("-leading_special_char"), "leading_special_char");
  t.equals(escapeClassName("handle empty spaces"), "handle-empty-spaces");
  t.end();
});

test("helpers: makeNameHash", function (t) {
  t.equals(
    makeNameHash("default-hash-md4"),
    "h154498c8f95283c6db4ebbc94bc80e69"
  );
  t.equals(
    makeNameHash("hash-sha256", 32, "sha256"),
    "h0b898639d69f46781ba500798ac5e5c7"
  );
  t.equals(
    makeNameHash("hash-sha256-base64", 32, "sha256", "base64"),
    "hIML7za+3iaClQZj7tYUFlFAORWPxyMB8"
  );
  t.end();
});

test("helpers: interpolatePattern", function (t) {
  t.equals(
    interpolatePattern("", () => ""),
    ""
  );
  t.equals(
    interpolatePattern("anything", () => "this string should never be used"),
    "anything"
  );
  t.equals(
    interpolatePattern("test", () => ""),
    "test"
  );
  t.equals(
    interpolatePattern("[name]", () => "value"),
    "value"
  );
  t.equals(
    interpolatePattern("[first][second]", (name) =>
      name === "first" ? "111" : "222"
    ),
    "111222"
  );
  t.equals(
    interpolatePattern("[first:p1:p2]", (name, params) => name + ' -> ' + params.join(',')),
    "first -> p1,p2"
  );
  t.end();
});
