This command will be deprecated in a future version of CMD. Please see information on setting up a multi-build via app.json instead of running these commands.

Sencha Cmd works together with the PhoneGap CLI to package your application for native platforms.
PhoneGap CLI allows native application building locally and remotely via PhoneGap Build. You can
find more information on PhoneGap Build here
    
    https://build.phonegap.com/

To add PhoneGap support to your application simply run the following command within your application directory

    // Initialize PhoneGap Support 
    sencha phonegap init {APP_ID} {APP_NAME}

    // Build the application and attempt to run it on a Device or in the Emulator
    sencha app build -run native

For more information on using Sencha Cmd with PhoneGap, consult the guides found here:

http://docs.sencha.com/touch/2.3.0/#!/guide/cordova
