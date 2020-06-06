// AlertsModel is a representation of the Alerts from the server 
Ext.define('Workflow.view.alerts.AlertsModel', {
    extend: 'Ext.data.TreeModel',
    xtype: 'alertsmodel',

    fields: [
        { name: 'name' },
        { name: 'alerttype_id' },
        { name: 'site' },
        { name: 'system' },
        { name: 'children' },
        { name: 'alert_type'},
        {
            name: 'totalchildren',
            calculate: function (data) {
                amount = 0;
                if (data.children != null) {
                    amount += data.children.length;
                    amount += this.calculateChildren(amount, data.children);
                }
                return amount;
            },
            // calculateChildren will take an integer, and a Alert
            // and Itterate over all the children found return the total amount
            calculateChildren: function (amount, alert) {
                if (alert.children != null){
                    alert.children.forEach(function(a) {
                        amount += this.calculateChildren(a);
                    });
                }
                return amount;
            }
        }
    ],



});