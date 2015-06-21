/*jslint browser: true, undef: true */ /*global Ext*/
Ext.define('SlateCSV.overrides.CustomVTypes', {
    override: 'Ext.form.field.VTypes',

    // Required fields
    required: function(val) {
        return (val && val.length > 0);
    },
    requiredText: 'Field is required',

    // Year field
    year: function(val) {
        return this.yearRe.test(val);
    },
    yearRe: /\d{4}/,
    yearText: 'Field must be 4 digit number'

});
