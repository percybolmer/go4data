// SettingsView is used to show the currently used settings
// And allow for the user to set new settings
Ext.define('Workflow.view.settings.SettingsView', {
    extend: 'Ext.Container',
    xtype: 'settingsview',
    cls: 'settingsview',
    controller: {type: 'settingsviewcontroller'},
    viewModel: {type: 'settingsviewmodel'},

    requires: [
        'Ext.field.*',
        'Ext.form.FieldSet'
    ],

    layout: 'fit',
    items: [
        {
            extend: 'Ext.form.Panel',
            items: [
                {
                    xtype: 'textfield',
                    name: 'default_template',
                    reference: 'default_template',
                    width: '20%',
                    margin: '10px',
                    label: 'Default Template',
                    value: localStorage.getItem('default_template'),
                    placeholder: 'default',
                    required: true
                },{
                    xtype: 'button',
                    name: 'save_settings',
                    text: 'Save',
                    handler: 'onSettingsSave'
                }
            ]
        }
    ]


});