Ext.define('Workflow.view.settings.SettingsViewController',{
    extend: 'Ext.app.ViewController',
    alias: 'controller.settingsviewcontroller',


    // onSettingsSave takes care of all the actions that shoul happen when a user is pressing the settings button.
    // It will take care of localstorage memorizing
    onSettingsSave: function() {
        view = this.getView();
        template = view.lookupReference('default_template').getValue();

        localStorage.setItem('default_template', template);
        
    }
});