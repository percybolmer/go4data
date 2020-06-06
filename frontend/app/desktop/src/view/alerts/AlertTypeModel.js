
 // AlerTypeModel is a representation of the AlertsTypes from the server 
Ext.define('Workflow.view.alerts.AlertTypeModel', {
    extend: 'Ext.data.Model',
    xtype: 'alert_type_model',

    fields: [
        { name: 'id' },
        { name: 'created_at' },
        { name: 'updated_at' },
        { name: 'deleted_at' },
        { name: 'system' },
        { name: 'message' },
        { name: 'related_ids' },
        { name: 'alert_type'}


    ]

});
