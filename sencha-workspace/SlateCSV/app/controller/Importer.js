/*jslint browser: true, undef: true, laxcomma:true *//*global Ext */
Ext.define('SlateCSV.controller.Importer', {
    extend: 'Ext.app.Controller',

    views: ['Importer'],

    refs: [{
        ref: 'importer',
        selector: 'slatecsv-importer',
        autoCreate: true,

        xtype: 'slatecsv-importer',
        cls: 'inner'
    }],


    // template methods
    onLaunch: function() {
        var bodyEl = Ext.getBody();

        this.getImporter({
            renderTo: bodyEl.down('main.site') || bodyEl
        });
    }
});
