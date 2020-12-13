/* eslint-disable semi */
/* eslint-disable no-setter-return */
/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
/* eslint-disable curly */
// Generated by CoffeeScript 1.12.7
(function() {
    var NodeType, XMLCData, XMLCharacterData,
        extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
        hasProp = {}.hasOwnProperty;

    NodeType = require('./NodeType');

    XMLCharacterData = require('./XMLCharacterData');

    module.exports = XMLCData = (function(superClass) {
        extend(XMLCData, superClass);

        function XMLCData(parent, text) {
            XMLCData.__super__.constructor.call(this, parent);
            if (text == null) {
                throw new Error("Missing CDATA text. " + this.debugInfo());
            }
            this.name = "#cdata-section";
            this.type = NodeType.CData;
            this.value = this.stringify.cdata(text);
        }

        XMLCData.prototype.clone = function() {
            return Object.create(this);
        };

        XMLCData.prototype.toString = function(options) {
            return this.options.writer.cdata(this, this.options.writer.filterOptions(options));
        };

        require('./internal').set('XMLCData', XMLCData);

        return XMLCData;

    })(XMLCharacterData);

}).call(this);
