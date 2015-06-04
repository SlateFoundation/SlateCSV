Ext.define('Slate.importer.view.field.ComboBox', {
	extend: 'Ext.form.field.ComboBox',
	xtype: 'csv-upload-combobox',

	forceSelection: true,
	editable: false,
	autoSelect: true,
	labelAlign: 'right',
	labelSeparator: ' ↔ ',
	displayField: 'label',
	valueField: 'fieldName',
	valueNotFoundText: 'None'
});