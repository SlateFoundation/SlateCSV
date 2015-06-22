/*jslint browser: true, undef: true, plusplus: true */ /*global Ext*/
Ext.define('SlateCSV.view.ValidationResult', {
    extend: 'Ext.Container',
    xtype: 'slatecsv-view-validationresult',

    config: {
        bodyPadding: 12,
        tpl: [
            '<table>',
            // TODO: remove total failures... using it for debugging
            //'<tr><td colspan="2">Total Fails: {failures}</td></tr>',
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
            '</table>',
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
    }
});
