/**
 * This view is an example list of people.
 */
Ext.define('{appName}.view.main.List', {
    extend: 'Ext.grid.Grid',
    xtype: 'mainlist',

    requires: [
        '{appName}.store.Personnel'
    ],

    title: 'Personnel',

    store: {
        type: 'personnel'
    },

    columns: [
        \u007B text: 'Name',  dataIndex: 'name', width: 100 },
        \u007B text: 'Email', dataIndex: 'email', width: 230 },
        \u007B text: 'Phone', dataIndex: 'phone', width: 150 }
    ],

    listeners: {
        select: 'onItemSelected'
    }
});
