/*jslint browser: true, undef: true, *//*global Ext*/
/**
 * The main application class. An instance of this class is created by app.js when it calls
 * Ext.application(). This is the ideal place to handle application launch and initialization
 * details.
 */
Ext.define('SlateCSV.Application', {
    extend: 'Ext.app.Application',

    name: 'SlateCSV',
    controllers: ['Importer']
});
