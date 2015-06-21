/* jshint undef: true, unused: true, browser: true, quotmark: single, curly: true *//*global Ext*/
// @require-package slate-cbl
Ext.define('Site.page.CSVImporter', {
    singleton: true,
    requires: [
        'SlateCSV.importer.view.CSVImporter'
    ],

    constructor: function() {
        Ext.onReady(this.onDocReady, this);
    },

    onDocReady: function() {
        var me = this;

        // render importer component
        me.importer = Ext.create('SlateCSV.importer.view.CSVImporter', {
            renderTo: Ext.get('csvImportCt')
        });
    }
});