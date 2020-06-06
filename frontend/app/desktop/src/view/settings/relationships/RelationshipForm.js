Ext.define('Workflow.view.settings.relationships.RelationshipForm', {
    extend: 'Ext.form.Panel',
    xtype: 'relationshipform',
    controller: { type: 'relationshipviewcontroller' },
    requires: [
        'Ext.field.*',
        'Ext.form.FieldSet'
    ],
    reference: 'relationshipform',
    
    viewModel: {
        type: 'relationshipviewmodel'
    },

    scrollable: 'y',

    buttons: [{
        text: 'Bind relationship',
        iconCls: 'x-fa fa-link',
        handler: 'onBindRelationship'
    }],

    items: [
        {
            xtype: 'fieldset',
            reference: 'bindAlertSet',
            title: 'Bind relationship',
            items: [
                {
                    xtype: 'combobox',
                    label: 'Template',
                    name: 'template',
                    reference: 'template',
                    triggerAction: 'query',
                    queryMode: 'remote',
                    picker: 'floated',
                    placeholder: 'Template Name',
                    displayField: 'name',
                    valueField: 'name',
                    floatedPicker: {},
                    bind: {
                        store: '{template_store}'
                    }
                },
                {
                    xtype: 'combobox',
                    label: 'Parent',
                    name: 'parent',
                    reference: 'parentalert',
                    triggerAction: 'query',
                    queryMode: 'remote',
                    editable: false,
                    picker: 'floated',
                    placeholder: 'Parent alert',
                    displayField: 'message',
                    valueField: 'id',
                    forceSelection: true,
                    floatedPicker: {},
                    bind: {
                        store: '{alertypes}'
                    },
                    itemTpl: '<h3>Error: {message}</h3>System: {system}'
                },{
                    xtype: 'combobox',
                    label: 'Child',
                    name: 'child',
                    reference: 'childalert',
                    triggerAction: 'query',
                    queryMode: 'remote',
                    editable: false,
                    picker: 'floated',
                    placeholder: 'Child alert',
                    displayField: 'message',
                    valueField: 'id',
                    forceSelection: true,
                    floatedPicker: {},
                    bind: {
                        store: '{alertypes}'
                    },
                    itemTpl: '<h3>Error: {message}</h3>System: {system}'
                }
            ]
        }
    ]
});