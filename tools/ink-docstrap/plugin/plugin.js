/**
 * import builtin fs
 * external fs
 */
//const fs = require('fs');

let memberof = '';
let category = '';
let categories = new Map();

function defineCategory(value) {
    if (!categories.has(value.name)) {
        categories.set(value.name, {
            kind: "category",
            name: value.name,
            longname: value.name,
            memberof: value.type?.names[0] || memberof,
            scope: "global",
            description: value.description
        });
    } else {
        let cat = categories.get(value.name);
        if (!cat.memberof)
            cat.memberof = value.type?.names[0] || memberof;
    }
}

exports.defineTags = function (dictionary) {
    dictionary.defineTag('category', {
        mustHaveValue: true,
        canHaveType: true,
        canHaveName: true,
        mustNotHaveDescription: false,
        isNamespace: false,
        onTagged: function (doclet, tag) {
            doclet.category = tag.value.name;
            defineCategory(tag.value);
        }
    });
};

exports.handlers = {
    beforeParse: function () {
        memberof = '';
        category = '';
    },
    newDoclet: function (e) {
        // save file.memberof to apply to all file doclets
        if (e.doclet.kind === 'file' && e.doclet.memberof)
            memberof = e.doclet.memberof;

        // save file.category to apply to all file doclets
        if (e.doclet.kind === 'file' && e.doclet.category)
            category = e.doclet.category;

        // apply file category if not overridden of member of other doclet (property or member)
        if (!e.doclet.category && category && !e.doclet.memberof)
            e.doclet.category = category;

        // apply file memberof
        if (!e.doclet.memberof && memberof)
            e.doclet.memberof = memberof;
    },
    parseComplete: function () {
    },
    processingComplete: function (e) {
        e.doclets.push.apply(e.doclets, Array.from(categories.values()));
        /*
        var doclets = e.doclets
            .map(doc => {
                if (!doc.undocumented && !doc.ignore) {
                    return {
                        kind: doc.kind,
                        longname: doc.longname,
                        memberof: doc.memberof,
                        category: doc.category
                    };
                }
            })
            .filter(doc => doc !== null);
        fs.writeFileSync('doclets.json',
            JSON.stringify(doclets, null, 2),
            {
                encoding: 'utf8'
            });
        fs.writeFileSync('_doclets.json',
            JSON.stringify(e.doclets, null, 2),
            {
                encoding: 'utf8'
            }); 
        */
    }
};

//___ EOF ___
