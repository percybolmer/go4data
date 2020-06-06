Ext.define('Workflow.view.alerts.AlertsViewStore', {
    extend: 'Ext.data.Store',
    alias: 'store.alertsviewstore',
    storeId: 'alertstore',

    model: 'Workflow.view.alerts.AlertsModel',
    autoLoad: false,

    proxy: {
        type: 'ajax',
        url: 'alerts',
        reader: {
            type:'json',
            rootProperty: 'alerts',
        }
    }
});