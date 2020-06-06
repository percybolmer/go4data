// AlertsGrid uses AJAX to fetch and preview alerts
Ext.define('Workflow.view.alerts.AlertsGrid', {
    extend: 'Ext.grid.Grid',
    xtype: 'alertsgrid',
    cls: 'alertsview',

    requires: [
        'Ext.grid.filters.*',
        'Ext.pivot.Grid',

    ],

    plugins:{
        gridfilters: true,
    },    

    controller: { type: 'alertsviewcontroller' },
    viewModel: { type: 'alertsviewmodel' },
    store: { type: 'alertsviewstore', autoLoad: true },
    columns: [
        {
            text: 'Name',
            dataIndex: 'name',
            width: 100,
            cell: { userCls: 'bold' }
        }, {
            text: 'Site',
            dataIndex: 'site'
        }, {
            text: 'AlertType ID',
            dataIndex: 'alerttype_id',
        }, {
            text: 'Children',
            dataIndex: 'totalchildren'
        },{
            text:'Error',
            dataIndex: 'alert_type',
            flex: 1,
            renderer: function(value){
                return value.message;
            }
        }
    ]
});