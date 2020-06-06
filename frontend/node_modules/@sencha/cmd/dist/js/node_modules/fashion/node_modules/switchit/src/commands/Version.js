const chalk = require('chalk');

const Command = require('../Command');

class Version extends Command {
    beforeExecute (params) {
        super.beforeExecute(params);
        this.root().skipLogo();
    }

    execute() {
        let pkg = this.root().pkgConfig;
        if (pkg && pkg.version) { 
            console.log(pkg.version); 
        } else { 
            // No package.json? 
            throw new Error(`unknown (can't find package.json)`); 
        } 
    }
}

Version.define({
    help: 'Displays the current version'
});


module.exports = Version;
