# esbuild-plugin-css-modules

![Node.js CI](https://github.com/koluch/esbuild-plugin-css-modules/workflows/Node.js%20CI/badge.svg)

Plugin for [esbuild](https://esbuild.github.io/) to support css-modules

## Install

```bash
npm i -D esbuild esbuild-plugin-css-modules
```

## Usage example

Create file `src/test.module.css`:

```css
.localName {
  background: red;
}
```

Create file `src/index.js`:

```js
import s from "./test.module.css";
console.log(s.localName);
```

Create file `build.js`:

```js
const esbuild = require("esbuild");
const cssModulesPlugin = require("esbuild-plugin-css-modules");

esbuild
  .build({
    entryPoints: ["src/index.js"],
    bundle: true,
    outfile: "bundle.js",
    plugins: [
      cssModulesPlugin({
        localIdentName: "[local]--[hash:8:md5:hex]",
      }),
    ],
  })
  .catch((e) => console.error(e.message));
```

Run:

```bash
node build.js
```

File named `bundle.css` with following content will be created (actual hash can be different):

```css
.localName--hc2cb51f4 {
  background: red;
}
```

Import of this module in JS bundle will be resolved to class name map:

```js
  // ...
  var result = {localName: "localName--hc2cb51f4"};
  var test_module_default = result;
  // ...
```

## Options

When instantiating plugin you can pass an optional objects with options. This object has following type:

```typescript
interface Options {
  localIdentName?: string;
  extension?: string;
}
```

- `localIdentName` - pattern for renaming local CSS class names. Defaults to `[hash]`. Can contain following replacement tokens:

  - `[local]` - local class name
  - `[ext]` - original file name extension
  - `[name]` - original file local name (without path)
  - `[path]` - only path of full original file name
  - `[folder]` - local name of a parent folder of original file
  - `[hash], [hash:length], [hash:length:algorithm], [hash:length:algorithm:digest]` - cryptographic hash of string, built by pattern `full_css_file_path:local_class_name`, with specified hash algorithm, digest type and maximum result string length. For example, `[hash:8:md4:base64]`. Supported digest types: `base64` and `hex`. Supported algorithms: `md4`, `md5`, `sha256` and `sha512`. Default algorithm is `md4`, default digest is `hex`, default maximum length is `32`

- `extension` - file extension to enable CSS-modules for. Defaults to `.module.css`
