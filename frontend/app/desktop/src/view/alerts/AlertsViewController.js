Ext.define('Workflow.view.alerts.AlertsViewController',{
    extend: 'Ext.app.ViewController',
    alias: 'controller.alertsviewcontroller',

    onItemSeleced: function(sender,record) {
        Ext.Msg.confirm('Confirm', 'Are you sure', 'onConfirm', this);
    },

    onConfirm: function(choice){
        if (choice === 'yes'){
            console.log(choice);
        }
    }
});