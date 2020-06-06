{% if(parseInt(values.enableViewJson, 10)) { %}/*
 * DO NOT EDIT
 * This file is automatically updated by Sencha Cmd based on the content of 
 * {viewFileName}.view.json
 */{% } %}
Ext.define('{appName}.view.{viewName}',{
    extend: '{viewBaseClass}',

    requires: [
        '{appName}.view.{viewName}Controller',
        '{appName}.view.{viewName}Model'
    ],

    controller: '{viewMvcName}',
    viewModel: {
        type: '{viewMvcName}'
    },

    html: 'Hello, World!!'
});
