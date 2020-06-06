Ext.define('Workflow.view.alerts.AlertTypeStore', {
    extend: 'Ext.data.Store',
    alias: 'store.alert_type_store',
    storeId: 'alert_type_store',

    model: 'Workflow.view.alerts.AlertTypeModel',
    autoLoad: false,

    proxy: {
        type: 'ajax',
        url: 'alerts',
        reader: {
            type:'json',
            rootProperty: 'alert_types',
        }
    }
});