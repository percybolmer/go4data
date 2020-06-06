Ext.define('Workflow.store.TemplateStore', {
    extend: 'Ext.data.Store',
    alias: 'store.template_store',
    autoLoad: false,
    proxy: {
        type: 'ajax',
        url: 'templates',
        reader: {
            type:'json',
        }
    }
});