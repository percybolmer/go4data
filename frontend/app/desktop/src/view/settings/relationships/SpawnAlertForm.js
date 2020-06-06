Ext.define('Workflow.view.settings.relationships.SpawnAlertForm', {
    extend: 'Ext.form.Panel',
    xtype: 'spawnAlertForm',
    controller: { type: 'relationshipviewcontroller' },
    requires: [
        'Ext.field.*',
        'Ext.form.FieldSet'
    ],
    reference: 'spawnAlertForm',
    
    viewModel: {
        type: 'relationshipviewmodel'
    },

    scrollable: 'y',

    buttons: [{
        text: 'Spawn Alert',
        iconCls: 'x-fa fa-plus',
        handler: 'onSpawnAlert'
    }],

    items: [
        {
            xtype: 'fieldset',
            reference: 'addAlertSet',
            title: 'Spawn alert',
            items: [
                {
                    xtype: 'combobox',
                    label: 'Alert type',
                    name: 'alerttype',
                    reference: 'alerttypeselection',
                    triggerAction: 'query',
                    queryMode: 'remote',
                    editable: false,
                    picker: 'floated',
                    placeholder: 'Choose alert type to spawn',
                    displayField: 'message',
                    valueField: 'id',
                    forceSelection: true,
                    floatedPicker: {},
                    store: {
                        type: 'alert_type_store',
                    },
                    itemTpl: '<h3>Error: {message}</h3>System: {system}'
                },{
                    xtype: 'textfield',
                    label: 'Name',
                    reference: 'alertName',
                    name: 'name',
                    value: 'test-01',
                    required: true
                }
            ]
        }
    ]
});