
// create a setTimeout function to prevent the module system from trying
// to 'require' vertx
var setTimeout = function(){},
    _logger = com.sencha.logging.SenchaLogManager.getLogger('fashion'),
    consoleWas = console,
    console = {

        debug: function(message) {
            _logger.debug(message);
        },

        log: function(message) {
            _logger.info(message);
        },

        info: function(message) {
            _logger.info(message);
        },

        warn: function(message) {
            _logger.warn(message);
        },

        error: function(message) {
            _logger.error(message);
        }

    },
    require = function() {};

console.__proto__ = consoleWas;