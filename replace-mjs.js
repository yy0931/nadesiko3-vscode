const fs = require("fs")
const path = require("path")

const dir = path.join(__dirname, "nadesiko3-plugins")
for (const f of fs.readdirSync(dir)) {
    fs.writeFileSync(path.join(dir, f), fs.readFileSync(path.join(dir, f)).toString().replace(/require\("([^"]+).mjs"\)/g, `require("$1.js")`))
}
