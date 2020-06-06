Ext.define('Workflow.view.main.MainViewModel', {
	extend: 'Ext.app.ViewModel',
	alias: 'viewmodel.mainviewmodel',
	data: {
		name: 'Workflow',
		version: 'v0.0.1',
		navCollapsed:       JSON.parse(localStorage.getItem("navCollapsed")),
		navview_max_width:    300,
		navview_min_width:     44,
		topview_height:        75,
		bottomview_height:     50,
		headerview_height:     50,
		footerview_height:     50,
		detailCollapsed:     true,
		detailview_width:      10,
		detailview_max_width: 300,
		detailview_min_width:   0,

	},
	formulas: {
		navview_width: function(get) {
			return get('navCollapsed') ? get('navview_min_width') : get('navview_max_width');
		},
		detailview_width: function(get) {
			return get('detailCollapsed') ? get('detailview_min_width') : get('detailview_max_width');
		}
	},
	stores: {
		menu: {
			"type": "tree",
			"root": {
				"expanded": true,
				"children": [
					{ "text": "Home", "iconCls": "x-fa fa-home", "xtype": "homeview", "leaf": true },
					{ "text": "Alerts", "iconCls": "x-fa fa-table", "xtype": "alertsview","leaf": true },
					{ "text": "Settings", "iconCls": "x-fa fa-cog", "xtype": "settingsview", "children": [
						{ "text": "Relationships", "iconCls": "x-fa fa-link", "xtype": "relationshipview", "leaf": true}
					]},
					

				]
			}
		}
	}
});
