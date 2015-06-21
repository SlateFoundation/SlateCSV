Ext.define('SlateCSV.importer.view.CSVImporter', {
    extend: 'Ext.Container',
    xtype: 'slate-importer-csv-importer',
    requires: [
        'SlateCSV.importer.view.CSVImporterController'
    ],

    controller: 'slate-importer-csv-importer',

    config: {
        csvText: null,
        csvData: null,
        useFirstRowForColumnNames: true,
        importStatus: null,
        maxPreviewRows: 5,
        requiredFields: [
            'FirstName',
            'LastName',
            'StudentID',
            'GraduationYear'
        ],
        importFields: [{
            "label": "None",
            "fieldName": null
        }, {
            "label": "student first name preserve case",
            "fieldName": "FirstName",
            "importer": "name-preserve",
        }, {
            "label": "student first name autocapitalize",
            "fieldName": "FirstName",
            "importer": "name-autocapitalize"
        }, {
            "label": "student middle name preserve case",
            "fieldName": "MiddleName",
            "importer": "name-preserve"
        }, {
            "label": "student middle name autocapitalize",
            "fieldName": "MiddleName",
            "importer": "name-autocapitalize"
        }, {
            "label": "student last name preserve case",
            "fieldName": "LastName",
            "importer": "name-preserve"
        }, {
            "label": "student last name autocapitalize",
            "fieldName": "LastName",
            "importer": "name-autocapitalize"
        }, {
            "label": "Graduation Year",
            "fieldName": "GraduationYear",
            "importer": "year"
        }, {
            "label": "Student ID",
            "fieldName": "StudentID",
            "importer": "integer"
        }, {
            "label": "Gender",
            "fieldName": "Gender",
            "importer": "gender"
        }, {
            "label": "Gender - full word",
            "fieldName": "Gender",
            "importer": "gender-string"
        }, {
            "label": "advisor first name preserve case",
            "fieldName": "AdvisorFirstName",
            "importer": "name-preserve"
        }, {
            "label": "advisor first name autocapitalize",
            "fieldName": "AdvisorFirstName",
            "importer": "name-autocapitalize"
        }, {
            "label": "advisor middle name preserve case",
            "fieldName": "AdvisorMiddleName",
            "importer": "name-preserve"
        }, {
            "label": "advisor middle name autocapitalize",
            "fieldName": "AdvisorMiddleName",
            "importer": "name-autocapitalize"
        }, {
            "label": "advisor last name preserve case",
            "fieldName": "AdvisorLastName",
            "importer": "name-preserve"
        }, {
            "label": "advisor last name autocapitalize",
            "fieldName": "AdvisorLastName",
            "importer": "name-autocapitalize"
        }, {
            "label": "advisor last name autocapitalize",
            "fieldName": "AdvisorLastName",
            "importer": "name-autocapitalize"
        }],
        items: [{
            id: 'instructions',
            xtype: 'component',
            html: [
                '<header class="page-header">',
                '   <h1 class="header-title">Enrollments Upload Wizard</h1>',
                '</header>',
                '<ol class="wizard-steps">',
                '    <li class="wizard-step"><p>Download or compile a CSV file of all users and related data from your SIS, LMS, or spreadsheets. <a href="#">Example CSV</a></p></li>',
                '    <li class="wizard-step"><p>Upload your CSV file:</p>',
                '       <label class="field file-field  is-required ">',
                '           <input type="file" class="field-control " name="csv" required="" aria-required="true" value="">',
                '       </label>',
                '    </li>',
                '    <li class="wizard-step">',
                '        <p>Map your fields to match the Slate fields:</p>',
                '        <table class="form-table">',
                '            <thead>',
                '            </thead>',
                '            <tbody>',
                '                <tr>',
                '                    <th colspan="2" class="form-table-row-label for-compact-input"><label id="first-row">First row contents:</label></th>',
                '                    <td class="form-table-row-input">',
                '                        <ul class="radio-group" role="radiogroup" aria-labelledby="first-row">',
                '                            <li class="radio-group-item"><label><input type="radio" name="first-row" value="headings" checked="true">&nbsp;Field names</label></li>',
                '                            <li class="radio-group-item"><label><input type="radio" name="first-row" value="record">&nbsp;First record</label></li>',
                '                        </ul>',
                '                    </td>',
                '                    <td class="form-table-row-action"></td>',
                '                </tr>',
                '            </tbody>',
                '       </table>',
                '   </li>',
                '</ol>'
            ]
        }, {
            id: 'formMappingCt',
            xtype: 'container'
        }, {
            xtype: 'toolbar',
            itemId: 'statusToolbar',
            hidden: true,
            items: [{
                xtype: 'tbtext',
                itemId: 'requiredLabel',
                tpl: '{mappedFields} / {requiredFields} Required'
            }, {
                xtype: 'tbtext',
                itemId: 'columnsUsedLabel',
                tpl: '{selectedColumns} / {totalColumns} Columns Used'
            }, {
                xtype: 'tbfill'
            }, {
                xtype: 'button',
                text: 'Import'
            }]
        }, {
            xtype: 'gridpanel',
            itemId: 'previewGrid',
            flex: 1,
            title: 'Preview',
            hidden: true
        }]
    },

    updateCsvData: function(newCsvText, oldCsvText) {
        console.log('updateCsvData');
        this.fireEvent('csvtextchange', this, newCsvText, oldCsvText);
    },

    updateUseFirstRowForColumnNames: function(value, oldValue) {
        console.log('updateusefirstrowforcolumnnames', value);
        this.fireEvent('updateusefirstrowforcolumnnames', this, value, oldValue);
    },

    updateImportStatus: function(newStatus) {
        var me = this,
            statusToolbar = me.down('#statusToolbar');

        if (Ext.Object.isEmpty(newStatus)) {
            statusToolbar.setHidden(true);
        } else {
            statusToolbar.down('#requiredLabel').setData(newStatus);
            statusToolbar.down('#columnsUsedLabel').setData(newStatus);

            statusToolbar.setHidden(false);
        }

        //todo handle warning / error count and button state
    },

    getMappedFields: function() {
        var me = this,
            comboBoxes = me.query('csv-upload-combobox'),
            comboBoxesLength = comboBoxes.length,
            mappedFields = [],
            i = 0;

        for (; i < comboBoxesLength; i++) {
            if (comboBoxes[i].getValue()) {
                mappedFields.push(comboBoxes[i].getValue());
            }
        }

        return mappedFields;
    }
});