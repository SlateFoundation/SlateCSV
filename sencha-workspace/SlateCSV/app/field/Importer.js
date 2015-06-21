/*jslint browser: true, undef: true, laxcomma:true *//*global Ext*/
Ext.define('SlateCSV.field.Importer', {
	extend: 'Ext.form.field.ComboBox',
	xtype: 'slatecsv-importerfield',

	forceSelection: true,
	editable: false,
	autoSelect: true,
	labelAlign: 'right',
	labelSeparator: ' ↔ ',
	displayField: 'label',
	valueField: 'fieldName',
	valueNotFoundText: 'None'
});