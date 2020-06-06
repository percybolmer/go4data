// AlertView uses AJAX to fetch and preview alerts
Ext.define('Workflow.view.alerts.AlertsView', {
    extend: 'Ext.Panel',
    xtype: 'alertsview',
    cls: 'alertsview',
    controller: {type: 'alertsviewcontroller'},
    viewModel: {type: 'alertsviewmodel'},
    layout: 'fit',
    items: [
        {
            xtype: 'alertsgrid',

        }
    ]
});