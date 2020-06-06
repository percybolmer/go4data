Ext.define('Workflow.view.settings.relationships.RelationshipViewController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.relationshipviewcontroller',

    viewModel: {
        type: 'relationshipviewmodel'
    },

    // onDownloadLiveData will reload the relationshipstore with fresh data from the Server
    onDownloadLiveData: function () {
        // Get TreeStore and new JSON data and add that JSON as new Root Node
        liveStore = Ext.getStore('alertstore');
        // Get currently Selected Template
        let template = this.lookupReference('template').getValue();
        if (template === "" || !template){
            template = "default"
        }
        // call selectTemplate to treeify
        this.lookupReference('d3-relationship-tree').selectTemplate(template, liveStore.getRange());

        
    },
    // onRemoveAll will clear all the currently loaded relationships 
    onRemoveAll: function () {
        d3tree = this.lookupReference('d3-relationship-tree')
        d3tree.getStore().getRoot().removeAll()
        d3tree.flatAlerts = new Array();
    },
    // onTooltip is used to display the HTML used when hovering over the hierarchy graph
    onTooltip: function (component, tooltip, node, element, event) {
        var record = node.data,
            name = record.get('name'),
            site = record.get('site'),
            text = record.get('text'),
            at = record.get('alert_type')
        tooltip.setTitle(name);
        tooltip.setHtml('<dl style="margin-bottom: 15px;"> ' +
                '<dt>site</dt>' +
                    '<dd>- ' + site + ' </dd>' +
                '<dt>Error</dt>' +
                    '<dd>- ' + at.message + '</dd>' +
            '</dl>'

        )
    },
    // spawnRandomId is used to generate a random ID based on Golangs UINT 
    spawnRandomId: function() {
                // 18446744073709551615 is the Maximum for a UINT in Golang
                // 17446744073709551615 is set by ous as a Minimum to only occupy the Max amount
        return Math.floor(Math.random() * (18446744073709551615 - 17446744073709551615 + 1)) + 17446744073709551615;
    },
    // onSpawnAlert will create a new alert based on fieldset 1 of relationshipForm
    onSpawnAlert: function () {
        view = this.getView();
        me = this;
        if (view.validate()) {
            // Add Alert to store
            formValues = view.getValues();
            if (formValues.alerttype == null) {
                this.lookup('alerttypeselection').setError("Please choose an alerttype");
                return
            }
            atStore = Ext.getStore('alert_type_store');

            let alert = {
                id: me.spawnRandomId(),
                name: formValues.name,
                site: "testing",
                alerttype_id: formValues.alerttype,
                alert_type: atStore.getById(formValues.alerttype).data
            }
            //okupReference('d3-relationship-tree').selectTemplate(template, liveStore.getRange());
            d3tree = view.up().lookupReference('d3-relationship-tree');
            d3tree.addFlatAlert(alert)
            let template = d3tree.up().up().lookupReference('template').getValue();
            if (template === "" || !template){
                template = "default"
            }

            d3tree.loadTemplate(template, d3tree.flatAlerts)

            //store.getRootNode().appendChild(alert);
        }
    },
    onSaveTemplate: function(){
        let template = this.getView().lookupReference('template').getValue();
        d3tree = this.getView().lookupReference('d3-relationship-tree');

        Ext.Ajax.request({
            scope: this,
            params: {
                template: template,
                alerts: Ext.encode(d3tree.flatAlerts)
            },
            method: 'POST',
            url: 'savetemplate',
            callback: function (options, success, response) {
                if (success) {
                    Ext.toast('Template saved');
                }else{
                    Ext.Msg.alert('Error', response.responseText);
                }
            }
        })
    },
    // onBindRelationship is used to create a Link between two alert types
    onBindRelationship: function() {
        view = this.getView()
        if (!view.validate()){
            return
        }
        formValues = view.getValues();
        if (formValues.parent == null){
            this.lookup('parentalert').setError("A parent is required");
            return
        }else if (formValues.child == null){
            this.lookup('childalert').setError("A child is required");
            return
        }else if (formValues.template == null){
            this.lookup('template').setError("A template has to be set");
            return
        }

        Ext.Ajax.request({
            scope: this,
            params: {
                template: formValues.template,
                parentID: formValues.parent,
                childID: formValues.child
            },
            method: 'POST',
            url: 'relationship',
            callback: function (options, success, response) {
                if (success) {
                    d3tree = view.up().lookupReference('d3-relationship-tree');
                    d3tree.loadTemplate(formValues.template, d3tree.flatAlerts)
                }else{
                    // Ext.Msg
                }
            }
        })
    },
    // onTreeTemplateSelect is used whenever a temlpate is selecetedd in the template dropdown, it will then load the alerts from that template
    onTreeTemplateSelect: function(combo, value){
        view = this.getView()
        d3tree = view.lookupReference('d3-relationship-tree');
        d3tree.loadTemplate(value.data.name, value.data.alerts);
    }
});