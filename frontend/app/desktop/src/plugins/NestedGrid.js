Ext.define('Ext.grid.plugin.NestedGrid',{
    extend: 'Ext.grid.plugin.RowExpander',
    requires: [
        'Ext.grid.plugin.RowExpander',
        'Ext.grid.RowBody'
    ],
    alias: 'plugin.nestedgrid',


    setCmp: function(parentgrid){
        var me = this;
        
        me.callParent(arguments);
    },
    init: function(parentgrid){
        var me = this;
        
        // Call RowExpander init function
        me.callParent(arguments);
        parentgrid.rowBodyTpl=new Ext.XTemplate('<div class="childrow"><h1>HEJ</h1></div>');
        //this.on('expandbody', me.AddChildRow, me);
        debugger;
    },

    addChildRow: function(rowNode, record, expandRow, eOpts){
        me = this;
        debugger;
    }
});