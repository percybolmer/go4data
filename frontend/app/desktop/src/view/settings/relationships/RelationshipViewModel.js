Ext.define('Workflow.view.settings.relationships.RelationshipViewModel', {
    extend: 'Ext.app.ViewModel',
    alias: 'viewmodel.relationshipviewmodel',

    stores: {
        alertypes: {
            type: 'alert_type_store',
            autoLoad: true
        },
        template_store: {
            type: 'template_store',
        },

        tree: {
            type: 'tree',
            storeId: 'tree_store',
            // TODO, replace with Currently selected Template
            root: {
                text: 'Alerts',
                expanded: true,
                
            },
            
        }
    },


}); 