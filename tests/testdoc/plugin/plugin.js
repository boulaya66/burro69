/**
 * import builtin fs
 * @external fs
 */
const fs = require('fs');

let memberof = '';

exports.handlers = {
    beforeParse: function (e) {
        console.log(`FILE BEGIN => ${e.filename}`);
        memberof = '';
    },
    newDoclet: function (e) {
        if (e.doclet.kind === 'file' && e.doclet.memberof) {
            memberof = e.doclet.memberof;
        }
        if (!e.doclet.memberof && memberof) {
            e.doclet.memberof = memberof;
        }
    },
    processingComplete: function (e) {
        var doclets = e.doclets.map(doc => ({
            kind: doc.kind,
            name: doc.name,
            longname: doc.longname,
            description: doc.description,
            memberof: doc.memberof,
            scope: doc.scope,
            filename: doc.meta?.filename,
            ignore: doc.ignore,
            external: doc.external
        }));
        fs.writeFileSync('doclets.json',
            JSON.stringify(doclets, null, 2),
            {
                encoding: 'utf8'
            });
    }
}