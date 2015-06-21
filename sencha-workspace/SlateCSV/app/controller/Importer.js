/*jslint browser: true, undef: true, laxcomma:true *//*global Ext, SlateCSV*/
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
        this.getImporter({
            renderTo: Ext.getBody().down('main.site')
        });
    }
});