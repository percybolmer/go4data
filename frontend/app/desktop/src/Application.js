Ext.define('Workflow.Application', {
	extend: 'Ext.app.Application',
	name: 'Workflow',
	requires: ['Workflow.*'],
	defaultToken: 'homeview',

	removeSplash: function () {
		Ext.getBody().removeCls('launching')
		var elem = document.getElementById("splash")
		elem.parentNode.removeChild(elem)
	},

	launch: function () {
		this.removeSplash()
		var whichView = 'mainview'
		// We need to create the alert store object
		liveStore = Ext.create('Workflow.view.alerts.AlertsViewStore');
		liveStore.load();

		// Set a few Defaults
		template = localStorage.getItem("default_template");
		if (template === null){
			localStorage.setItem("default_template", "default");
		}
		
		Ext.Viewport.add([{xtype: whichView}])
	},

	onAppUpdate: function () {
		Ext.Msg.confirm('Application Update', 'This application has an update, reload?',
			function (choice) {
				if (choice === 'yes') {
					window.location.reload();
				}
			}
		);
	}
});
