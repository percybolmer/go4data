// RelationshipView is used to virtualize and display a graphical view over the relationships
// And allow for the user to set new relationships and rules
Ext.define('Workflow.view.settings.relationships.RelationshipView', {
    extend: 'Ext.Panel',
    xtype: 'relationshipview',
    cls: [
        'relationshipview',
        'base-color-panel'
    ],
    controller: { type: 'relationshipviewcontroller' },
    viewModel: { type: 'relationshipviewmodel' },
    defaults: {
        shadow: true
    },
    items: [
        {
            xtype: 'relationshiptree',
            userCls: 'small-60 relationshipview-item',
            height: '70%'
        }, {
            xtype: 'spawnAlertForm',
            userCls: 'small-20 relationshipview-item'
        },{
            xtype: 'relationshipform',
            userCls: 'small-20 relationshipview-item'
        }
    ]



});