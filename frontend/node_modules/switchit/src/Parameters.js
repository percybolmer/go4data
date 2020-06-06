"use strict";

const Items = require('./Items');
const Value = require('./Value');

/**
 * This class manages a case-insensitive collection of named positional parameters.
 * @private
 */
class Parameters extends Items {
    // empty
}

Parameters.kind = 'parameter';
Parameters.kinds = 'parameters';
Parameters.itemType = Parameters.prototype.itemType = Value;
Parameters.isParameters = Parameters.prototype.isParameters = true;

module.exports = Parameters;
