// TODO install main dirs
// TODO gitignore && git
// TODO install other libs and commits

const pkg = require('./package.json');

function version() {
    console.log(`\n${pkg.description} v${pkg.version} - under ${pkg.license} license\n`);
}

exports.version = version;

version();

//___EOF___
