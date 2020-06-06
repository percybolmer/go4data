Ext.define('Workflow.view.settings.relationships.RelationshipTree', {
    extend: 'Ext.Panel',
    xtype: 'relationshiptree',

    viewModel: {
        type: 'relationshipviewmodel',
    },
    layout: 'fit',
    items: [
        { 
            xtype: 'd3-tree',
            bind: {
                store: '{tree}'
            },
            cls: 'relationship-tree',
            reference: 'd3-relationship-tree',
            height: '100%',
            width: '100%',
            nodeText: function (tree, node) {
                var record = node.data,
                    text = record.data.name;
                
                if (record.get('children') !== undefined && record.get('children') !== null){
                    text += ' (' + record.get('children').length + ')';
                }
        
                return text;
            },
            // initialize event is triggered whenever the item is renderd
            initialize: function(){
                this.loadTemplate(localStorage.getItem('default_template'));
            },
        }
    ],

    tbar: [
        {
            iconCls: 'x-fa fa-download',
            tooltip: {
                html: 'Copy real time alerts',
                trackMouse: true
            },
            handler: 'onDownloadLiveData'
        }, {
            iconCls: 'x-fa fa-minus-circle',
            tooltip: {
                html: 'Reset alerts',
                trackMouse: true
            },
            handler: 'onRemoveAll'
        },'->',{
            iconCls: 'x-fa fa-save',
            tooltip: {
                html: 'Save template settings',
                trackMouse: true
            },
            handler: 'onSaveTemplate'
        },{
            xtype: 'combobox',
            reference: 'template',
            triggerAction: 'query',
            queryMode: 'remote',
            picker: 'floated',
            placeholder: localStorage.getItem("default_template"),
            displayField: 'name',
            valueField: 'name',
            floatedPicker: {},
            bind: {
                store: '{template_store}'
            },
            listeners: {
                select: 'onTreeTemplateSelect'
            }
        }
    ]

})