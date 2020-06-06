Ext.define('Workflow.view.main.nav.NavView', {
	extend: 'Ext.Panel',
	xtype: 'navview',
	controller: "navviewcontroller",
	cls: 'navview',
	layout: 'fit',
	tbar: {xtype: 'topview', height: 50},
	items: [ 
		{
			xtype: 'menuview', 
			reference: 'menuview', 
			bind: {width: '{menuview_width}'}, 
			listeners: { 
				selectionchange: "onMenuViewSelectionChange"
			}
		}
	],
	bbar: {xtype: 'bottomview', bind: {height: '{bottomview_height}'}}
});
