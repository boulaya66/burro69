/* eslint-disable semi */
/* eslint-disable no-setter-return */
/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable curly */
// Generated by CoffeeScript 1.12.7
(function() {
    var Derivation, XMLTypeInfo;

    Derivation = require('./Derivation');

    module.exports = XMLTypeInfo = (function() {
        function XMLTypeInfo(typeName, typeNamespace) {
            this.typeName = typeName;
            this.typeNamespace = typeNamespace;
        }

        XMLTypeInfo.prototype.isDerivedFrom = function(typeNamespaceArg, typeNameArg, derivationMethod) {
            throw new Error("This DOM method is not implemented.");
        };

        return XMLTypeInfo;

    })();

}).call(this);