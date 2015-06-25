/*jslint browser: true, undef: true, plusplus: true */ /*global Ext*/
Ext.define('SlateCSV.view.ValidationResult', {
    extend: 'Ext.Container',
    xtype: 'slatecsv-view-validationresult',

    config: {
        layout: 'card',
        items: [{
            bodyPadding: 12,
            itemId: 'validation-summary',
            tpl: [
                '<table>',
                '<tpl if="failures &gt; 0">',
                    '<tpl for="validations">',
                        '<tpl if="invalidRows.length &gt; 0">',
                            '<tr>',
                            '<td>Mapping:</td><td>{label}  ↔  {fieldLabel}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>Warning:</td><td>{vtext}</td>',
                            '</tr>',
                            '<tr>',
                            '<td>Rows:</td><td>{[this.lineCount(values.invalidRows)]}</td>',
                            '</tr>',
                            '<tr><td colspan="2">&nbsp</td></tr>',
                        '</tpl>',
                    '</tpl>',
                '<tpl else>',
                    '<tr><td colspan="2">All validations passed</td></tr>',
                '</tpl>',
                '<tpl if="validRows &gt; 0">',
                    '<tr><td colspan="2">Click continue to import  {validRows} records.</td></tr>',
                    '<tpl if="inValidRows &gt; 0">',
                        '<tr><td colspan="2">{inValidRows} records will be discarded.</td></tr>',
                    '</tpl>',
                '</tpl>',
                '</table>',
                // TODO: remove debugging info
                //'<table border="1">',
                //'<tr><td>Total Rows: {totalRows}</td></tr>',
                //'<tr><td>Valid Rows: {validRows}</td></tr>',
                //'<tr><td>Invalid Rows: {inValidRows}</td></tr>',
                //'<tr><td>Invalid Fields: {failures}</td></tr>',
                //'<tr><td>Time: {benchmark}ms</td></tr>',
                //'</table>',
            {
                disableFormats: true,
                lineCount: function(lines){
                    if (lines.length > 10) {
                        return 'occurs on '+lines.length+' rows';
                    } else {
                        return lines.join();
                    }

                }
            }]
        },{
            xtype: 'container',
            html: 'importing data...'
        }]
    }
});
