const fs = require("node:fs");
const path = require("node:path");

const writeFile = (targetPath, contents) => {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.writeFileSync(targetPath, contents);
};

writeFile(
  path.join(__dirname, "..", ".tmp-tests", "node_modules", "react-native", "index.js"),
  `"use strict";
const platform = {
  get OS() {
    return globalThis.__TEST_PLATFORM_OS ?? "web";
  },
};
module.exports = { Platform: platform, SafeAreaView: "SafeAreaView" };
`
);

writeFile(
  path.join(
    __dirname,
    "..",
    ".tmp-tests",
    "node_modules",
    "@react-native-async-storage",
    "async-storage",
    "index.js"
  ),
  `"use strict";
const defaultStorage = {
  async getItem() { return null; },
  async setItem() {},
  async removeItem() {},
};
module.exports = {
  __esModule: true,
  default: globalThis.__TEST_ASYNC_STORAGE_MODULE ?? defaultStorage,
};
`
);
