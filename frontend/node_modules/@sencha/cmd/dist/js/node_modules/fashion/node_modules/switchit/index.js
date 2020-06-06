module.exports = {
    Arguments: require('./src/Arguments'),
    Command: require('./src/Command'),
    Container: require('./src/Container'),
    ResponseFile: require('./src/ResponseFile'),
    Type: require('./src/Type'),

    // For backwards compatibility
    Help: require('./src/commands/Help'),

    commands: {
        Help: require('./src/commands/Help'),
        Version: require('./src/commands/Version')
    },

    // Internal stuff
    Cmdlet: require('./src/Cmdlet'),
    Item: require('./src/Item'),
    Items: require('./src/Items'),
    Commands: require('./src/Commands'),
    Parameters: require('./src/Parameters'),
    Switches: require('./src/Switches'),
    Value: require('./src/Value')
};
