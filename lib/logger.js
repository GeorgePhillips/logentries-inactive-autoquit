var singleton = null;
var INACTIVE_TIME = 120000;

module.exports = function (token, level) {
	if (singleton) {
		return singleton;
	}

	if (!token || !level) {
		console.log("Logger not initialised and no token or level");
		process.exit(1);
	}

	var calls = ["warning", "debug", "info", "err"];
	var timeout = null;
	var logger = logentries.logger({
	  token: token
	});

	logger.level(level);

    function shutdownIfNeeded() {
        timeout = null;
        if (lastLogCall === null) {
            return;
        }

        var closeAt = lastLogCall + INACTIVE_TIME;
        if (closeAt > new Date().getTime()) {
            timeout = setTimeout(shutdownIfNeeded, closeAt - new Date().getTime());
            return;
        }

        logger.err("App has gone quiet, forcing shutdown");
        process.exit(1);
    }

	function update() {
		lastLogCall = new Date().getTime();
        if (timeout == null) {
            var interval = INACTIVE_TIME;
            timeout = setTimeout(shutdownIfNeeded, interval);
        }
	}
	
	var lastLogCall = null;
	function wrap(name) {
		return function () {
			update();

			return logger[name].apply(logger, arguments);
		}
	}
	
	var wrapper = {};
	for (var i = 0; i < calls.length; i++) {
		var name = calls[i];
		wrapper[name] = wrap(name);
	}

	singleton = wrapper;
	return wrapper
};