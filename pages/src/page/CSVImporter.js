/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true *//*global Ext*/
// @require-package slate-cbl
Ext.define('Site.page.CSVImporter', {
    singleton: true,
    requires: [
        // 'Slate.csvImport.view.Importer'
    ],

    constructor: function() {
        Ext.onReady(this.onDocReady, this);
    },

    onDocReady: function() {
        var me = this;
            // siteEnv = window.SiteEnvironment || {};

        // render importer component
        // me.importer = Ext.create('Slate.cbl.view.student.Dashboard', {
        //     renderTo: Ext.get('studentDashboardCt')
        // });

        Ext.Msg.alert('Status', '!!!');
    }
});