// AlertsGrid uses AJAX to fetch and preview alerts
Ext.define('Workflow.view.alerts.AlertsPivot', {
    extend: 'Ext.Container',
    xtype: 'alertspivot',
    cls: 'alertsview',

    requires: [
        'Ext.pivot.Grid'
    ],
    layout:'fit',
    items: [{
        xtype: 'pivotgrid',
        shadow: 'true',
        reference: 'alertspivot',
        
        selectable: {
            cells: true
        },

        startRowGroupsCollapsed: true,
        startColGroupsCollapsed: true,

        matrix: {
            type: 'local',
            store: {
                type: 'alertsviewstore',
                autoLoad: true
            },

            viewLayoutType: 'tabular',

            leftAxis: [
                {
                    dataIndex:'name',
                    header: 'Name',
                    width: 150
                }, {
                    dataIndex:'site',
                    header: 'Site',
                    width: 150
                }
            ],
        }
    }]


});