import esbuild from "esbuild";
import * as fs from "fs";
// import babel from "esbuild-plugin-babel";

async function main() {
  await esbuild.build({
    entryPoints: ["src/public-api.ts"],
    bundle: true,
    outfile: "build/module.js",
    format: "esm",
    // plugins: [babel()],
    platform: "neutral",
    target: "es2015",
    external: ["tslib", "rxjs"],
    // sourcemap: true,
    // target: ['es5'] // if you target es5 with babel, add this option
  });

  await esbuild.build({
    entryPoints: ["src/public-api.ts"],
    bundle: true,
    outfile: "build/main.js",
    format: "cjs",
    // plugins: [babel()],
    platform: "neutral",
    target: "es2015",
    external: ["tslib", "rxjs"],
    // sourcemap: true,
    // target: ['es5'] // if you target es5 with babel, add this option
  });

  const file = JSON.parse(
    fs.readFileSync("./package.json", { encoding: "utf8" })
  );

  file.main = "main.js";
  file.module = "module.js";
  file.types = "public-api.d.ts";
  delete file.scripts;

  fs.writeFileSync("./build/package.json", JSON.stringify(file), {
    encoding: "utf8",
  });
}

main().catch(() => process.exit(1));
