Ext.define('Workflow.view.main.nav.NavViewController', {
	extend: "Ext.app.ViewController",
	alias: "controller.navviewcontroller",

	initViewModel: function(vm) {},

	onTopViewNavToggle: function () {
		var vm = this.getViewModel();
		localStorage.setItem('navCollapsed', !vm.get('navCollapsed'))
		vm.set('navCollapsed', !vm.get('navCollapsed'));
	},

	onMenuViewSelectionChange: function(tree, node) {
		if (!node) {
				return;
		}
		this.fireViewEvent("select", node);
	}
});
