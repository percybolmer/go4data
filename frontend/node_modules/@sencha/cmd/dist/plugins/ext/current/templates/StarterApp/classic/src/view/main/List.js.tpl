/**
 * This view is an example list of people.
 */
Ext.define('{appName}.view.main.List', {
    extend: 'Ext.grid.Panel',
    xtype: 'mainlist',

    requires: [
        '{appName}.store.Personnel'
    ],

    title: 'Personnel',

    store: {
        type: 'personnel'
    },

    columns: [
        \u007B text: 'Name',  dataIndex: 'name' },
        \u007B text: 'Email', dataIndex: 'email', flex: 1 },
        \u007B text: 'Phone', dataIndex: 'phone', flex: 1 }
    ],

    listeners: {
        select: 'onItemSelected'
    }
});
