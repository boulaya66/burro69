
// TODO: doc#003 test doc over sadex

// TODO: doc#004 remove testdoc

const pkg = require('./package.json');

function version() {
    console.log(`\n${pkg.description} v${pkg.version} - under ${pkg.license} license\n`);
}

exports.version = version;

version();

//___EOF___
