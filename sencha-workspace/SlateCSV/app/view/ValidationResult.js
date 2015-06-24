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
                // TODO: remove debugging info
                '<tr><td colspan="2">Invalid Fields: {failures}</td></tr>',
                '<tr><td colspan="2">Time: {benchmark}ms</td></tr>',
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
        },{
            xtype: 'container',
            html: 'importing data...'
        }]
    }
});
