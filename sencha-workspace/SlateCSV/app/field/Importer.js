/*jslint browser: true, undef: true, laxcomma:true *//*global Ext*/
Ext.define('SlateCSV.field.Importer', {
    extend: 'Ext.form.field.ComboBox',
    xtype: 'slatecsv-importerfield',

    // TODO: style this with sass rather than using widths here?
    width: 400,
    labelWidth: 160,

    forceSelection: true,
    editable: false,
    autoSelect: true,
    labelAlign: 'right',
    labelSeparator: ' ↔ ',
    displayField: 'label',
    valueField: 'id',
    valueNotFoundText: 'None'
});
