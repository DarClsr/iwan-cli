#!/usr/bin/env node


// cli 配置
process.argv.push("--cwd");
process.argv.push(process.cwd());
process.argv.push("--gulpfile");
process.argv.push(require.resolve(".."));


require("gulp/bin/gulp") 