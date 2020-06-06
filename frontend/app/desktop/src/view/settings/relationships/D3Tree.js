// d3-relationship-tree is a overridden HorizontalTree from the D3 package
// The reason to override the Original d3 is to be able to modify the internal
// d3 functions to abide to our will
// Example is the onNodeSelect function that we want to add functionally to.
// @author Perbol
// @version 1.0 
Ext.define('Workflow.view.settings.relationships.D3Tree', {
    override: 'Ext.d3.hierarchy.tree.HorizontalTree',

    requires: [
        'Ext.d3.hierarchy.tree.HorizontalTree',
        'Ext.d3.interaction.PanZoom',
    ],
    centered:true,
    rootVisible: false,
    
    interactions: {
        type: 'panzoom',
            zoom: {
                extent: [0.3, 3],
                doubleTap: false
            }
    },
    tooltip: {
        renderer: 'onTooltip'
    },
    padding: 10,
    nodeRadius: 10,
    nodeSize: [200, 30],
    platformConfig: {
        desktop: {
            nodeSize: [250, 20],
            nodeRadius: 5
        }
    },
    // flatAlerts is used to store a flat structure of all the currently loaded alerts
    flatAlerts: null,
    // addFlatAlert is used to push a new item into the flatAlerts array. 
    // flatAlerts are used to update the template etc after adding new items
    // since backend cannot be sent a Tree, it wants a flat struct to treeify
    addFlatAlert: function(alert){
        if (this.flatAlerts === null){
            this.flatAlerts = new Array();
        }
        this.flatAlerts.push(alert);
    },
    // selectTemplate is used to load the stores current Alerts into the store with the given
    // @template is the name of the template to use
    // @records it the records to treeify
    selectTemplate: function(template, records){
        me = this;
        me.flatAlerts = new Array();
        var data = new Array();
        // We need to extract only the data from the records, since we dont want to send Objects/Records to Backend
        records.forEach(function(item){
           data.push(item.data);
           me.addFlatAlert(item.data);
        });
        me.loadTemplate(template, data)
        
    },
    // loadTemplate is used to alerts with a temlpate apllied to them as a tree
    // @template string - name of the template to use
    // @alerts Array - array of alerts.
    loadTemplate: function(template, alerts){
        me = this;
        Ext.Ajax.request({
            scope: this,
            params: {
                template: template,
                alerts: Ext.encode(alerts),
            },
            method: 'POST',
            url: 'tree',
            callback: function (options, success, response) {
                if (success) {
                    var json = Ext.util.JSON.decode(response.responseText);
                    store = me.getStore()
                    if (store === undefined || store === null){
                        // Get viewModel and control store, this only happens first time opening the view
                        // Since this method sometimes is triggered before the store is fully created
                        store = Ext.getStore('tree_store');
                    }
                    store.setRoot(json.tree);
                    me.flatAlerts = json.alerts;
                    me.performLayout();
                    

                }
            }
        });
    },

    // onNodeSelect will trigger the Origianl Node selection first, then also update the Form panel that contains Alert info
    onNodeSelect: function (node, el) {
        me = this;
        me.callParent(arguments);

        at = node.get('alert_type');
        relationform = this.up().up().lookupReference('spawnAlertForm');
        //alertTypeSelection = relationform.lookupReference('alerttypeselection');
        //alertTypeSelection.setSelection(at);
        name = node.get('name');
        nameField = relationform.lookupReference('alertName')
        nameField.setValue(name);
    },    
});