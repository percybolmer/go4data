![switchit logo](assets/switchit_logo.png)  
  
[![Build Status](https://travis-ci.org/dongryphon/switchit.svg?branch=master)](https://travis-ci.org/dongryphon/switchit)
[![Coverage Status](https://coveralls.io/repos/github/dongryphon/switchit/badge.svg?branch=master)](https://coveralls.io/github/dongryphon/switchit?branch=master)
[![Dependencies Status](https://david-dm.org/dongryphon/switchit/status.svg)](https://david-dm.org/dongryphon/switchit)
[![npm version](https://badge.fury.io/js/switchit.svg)](https://badge.fury.io/js/switchit)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)   

# switchit
A no-nonsense framework for command-line switch parsing and command dispatching.

`switchit` enables you to write modern command-line applications using a straightforward API and features _including_:

* [x] [Robust command definition using a simple object-oriented API](#getting-started) 
* [x] [Effortless switch and positional argument parsing](#support-for-positional-arguments) 
* [x] [Promise based command dispatching](#promises-switchit-has-those-too) 
* [x] [Interactive prompt for missing values](#interactive-prompt-for-missing-values)
* [x] [Required and optional switches and parameters](docs/features/Switches-and-arguments.md#required-and-optional-values) 
* [x] [Variadic switches and parameters](docs/features/Switches-and-arguments.md#variadic-switches-and-parameters) 
* [x] [Nested command hierarchy (like `git remote add {args}`)](docs/features/Commands-and-subcommands.md#commands-and-sub-commands) 
* [x] [Advanced command chaining using `and` and `then`](docs/features/Commands-and-subcommands.md#command-chaining) 
* [x] [Shortest unique prefix matching for switches and commands](docs/features/Commands-and-subcommands.md#shortest-unique-prefix) 
* [x] [Custom command aliases and default sub-command](docs/features/Commands-and-subcommands.md#sub-command-aliases) 
* [x] [Complex command invocation using response files](docs/features/Response-file-processing.md#response-file-processing) 
* [x] [Comprehensive built-in help command](docs/features/Help-command.md#built-in-help-command) 

There are so many features and functionality to describe that they got [its own document](docs/features#feature-overview) 
just to outline them all!

## Getting Started

**Quick Start**

Install `switchit` into your project:

    $ npm install switchit --save

Create a `.js` file and add the following:
 
    const Command = require('switchit').Command;
    
    class SayHi extends Command {
        execute (params) {
            console.log(`Hi, ${params.name}!`);
        }
    }
    
    SayHi.define({
        switches: 'name'
    });
    
    new SayHi().run();

Run your project file, don't forget to pass `--name`:

    $ node examples/sayhi.js --name John
    Hi, John!

### Support for positional arguments 

You can also accept positional arguments as parameters in your command: 

    ...
    
    SayHi.define({
        parameters: 'name'  // changed this from "switches" to "parameters"
    });
    
    ...
   
Look ma, no switches!

    $ node examples/parameter.js Paul
    Hi, Paul!

Do you want to read a parameter form either positional arguments or switches? 
[`switchit` supports it too!](docs/features/Switches-and-arguments.md#switchy-parameters) 

### Promises? `switchit` has those too! 

The `.run()` method returns a promise! 

    ...
    
    new SayHi().run().then(() => { 
        console.log("Success!"); 
    },(e) => { 
        console.error(`Oh no! ${e.message}`) 
    });
    
Check it out:

    $ node examples/promise.js
    Oh no! Missing value for parameter: "name"
    $ node examples/promise.js George 
    Hi, George!
    Success!

### Interactive prompt for missing values

Wanna see somethiing awesome? Just add `interactive: true` to your command definition:

    ....
    
    SayHi.define({
        parameters: 'name',
        interactive: true,
        // Optionally add some help texts to improve the UI
        //  more info at docs/Features.md#built-in-help
        help: {
            '': 'This is a command that says hi!',
            'name': 'Your name'
        }
    });
    
    ...
    
Run it with no arguments to see it in action:

    $ node interactive.js
    This is a command that says hi!
    Press ^C at any time to quit.
    
    Your name
    ? name: 

Check [docs/Features.md](docs/features/Interactive.md#interactive-mode) for more information
on how to take advantage of this feature.

## More examples and API

Once you get the hang of the examples above, make sure to check our [examples](examples/)
directory or our complete [docs](docs/) for more information and API docs.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct, and the
process for submitting pull requests.

## Versioning

`switchit` uses [SemVer](http://semver.org/) for versioning. For the versions available, see the
[tags on this repository](https://github.com/dongryphon/switchit/tags). 

## Authors

* **Don Griffin** - *Author* - [dongryphon](https://github.com/dongryphon)

See also the list of [contributors](https://github.com/dongryphon/switchit/contributors)
who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
