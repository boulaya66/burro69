/* eslint-disable semi */
/* eslint-disable no-setter-return */
/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable curly */
// Generated by CoffeeScript 1.12.7
(function() {
    var NodeType, XMLDocumentFragment, XMLNode,
        extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        hasProp = {}.hasOwnProperty;

    XMLNode = require('./XMLNode');

    NodeType = require('./NodeType');

    module.exports = XMLDocumentFragment = (function(superClass) {
        extend(XMLDocumentFragment, superClass);

        function XMLDocumentFragment() {
            XMLDocumentFragment.__super__.constructor.call(this, null);
            this.name = "#document-fragment";
            this.type = NodeType.DocumentFragment;
        }

        return XMLDocumentFragment;

    })(XMLNode);

}).call(this);
