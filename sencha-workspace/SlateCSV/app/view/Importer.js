/*jslint browser: true, undef: true, plusplus: true */ /*global Ext*/
Ext.define('SlateCSV.view.Importer', {
    extend: 'Ext.Container',
    xtype: 'slatecsv-importer',
    requires: [
        'SlateCSV.view.ImporterController',
        'Slate.importer.overrides.CustomVTypes',
        'SlateCSV.view.Validation'
    ],

    controller: 'slatecsv-importer',

    config: {
        csvText: null,
        csvData: null,
        useFirstRowForColumnNames: true,
        importStatus: null,
        maxPreviewRows: 5,
        validationToolTip: null,
        validationWindow: null,
        requiredFields: [
            'FirstName',
            'LastName',
            'StudentID',
            'GraduationYear'
        ],
        importFields: [{
            "id": "none",
            "label": "None",
            "fieldName": null
        }, {
            "id": "student-first-name-preserve-case",
            "label": "student first name preserve case",
            "fieldName": "FirstName",
            "vtype": "required"
        }, {
            "id": "student-first-name-autocapitalize",
            "label": "student first name autocapitalize",
            "fieldName": "FirstName",
            "vtype": "required",
            "transform": Ext.util.Format.capitalize
        }, {
            "id": "student-middle-name-preserve-case",
            "label": "student middle name preserve case",
            "fieldName": "MiddleName"
        }, {
            "id": "student-middle-name-autocapitalize",
            "label": "student middle name autocapitalize",
            "fieldName": "MiddleName",
            "transform": Ext.util.Format.capitalize
        }, {
            "id": "student-last-name-preserve-case",
            "label": "student last name preserve case",
            "fieldName": "LastName",
            "vtype": "required"
        }, {
            "id": "student-last-name-autocapitalize",
            "label": "student-last-name-autocapitalize",
            "fieldName": "LastName",
            "vtype": "required",
            "transform": Ext.util.Format.capitalize
        }, {
            "id": "graduation-year",
            "label": "Graduation Year",
            "fieldName": "GraduationYear",
            "vtype": "year"
        }, {
            "id": "student-id",
            "label": "Student ID",
            "fieldName": "StudentID"
        }, {
            "id": "gender",
            "label": "Gender",
            "fieldName": "Gender"
        }, {
            "id": "gender-full-word",
            "label": "Gender - full word",
            "fieldName": "Gender"
        }, {
            "id": "advisor-first-name-preserve-case",
            "label": "advisor first name preserve case",
            "fieldName": "AdvisorFirstName"
        }, {
            "id": "advisor-first-name-autocapitalize",
            "label": "advisor first name autocapitalize",
            "fieldName": "AdvisorFirstName",
            "transform": Ext.util.Format.capitalize
        }, {
            "id": "advisor-middle-name-preserve-case",
            "label": "advisor middle name preserve case",
            "fieldName": "AdvisorMiddleName"
        }, {
            "id": "advisor-middle-name-autocapitalize",
            "label": "advisor middle name autocapitalize",
            "fieldName": "AdvisorMiddleName",
            "transform": Ext.util.Format.capitalize
        }, {
            "id": "advisor-last-name-preserve-case",
            "label": "advisor last name preserve case",
            "fieldName": "AdvisorLastName"
        }, {
            "id": "advisor-last-name-autocapitalize",
            "label": "advisor last name autocapitalize",
            "fieldName": "AdvisorLastName",
            "transform": Ext.util.Format.capitalize
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
                xtype: 'tbtext',
                itemId: 'validationWarning',
                // TODO: set style with css/sass
                style: {
                    padding: 6,
                    color: 'white',
                    background: 'red'
                },
                tpl: '{unmappedFields:plural("required field")} not mapped'
            }, {
                xtype: 'button',
                itemId: 'importButton',
                text: 'Import',
                listeners: {
                    click: 'onImportButtonClick',
                    scope: 'controller'
                }
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
        this.fireEvent('csvtextchange', this, newCsvText, oldCsvText);
    },

    updateUseFirstRowForColumnNames: function(value, oldValue) {
        this.fireEvent('updateusefirstrowforcolumnnames', this, value, oldValue);
    },

    updateImportStatus: function(newStatus) {
        var me = this,
            statusToolbar = me.down('#statusToolbar'),
            valid = (newStatus.unmappedFields <= 0);

        if (Ext.Object.isEmpty(newStatus)) {
            statusToolbar.setHidden(true);
        } else {
            statusToolbar.down('#requiredLabel').setData(newStatus);
            statusToolbar.down('#columnsUsedLabel').setData(newStatus);
            statusToolbar.down('#validationWarning').setData(newStatus);

            statusToolbar.setHidden(false);
        }

        // hide
        statusToolbar.down('#validationWarning').setHidden(valid);
        statusToolbar.down('#importButton').setHidden(!valid);
        statusToolbar.down('#importButton').setDisabled(!valid);

        // show a tooltip with the names of the missing fields
        if (!valid) {
            me.updateValidationTooltip(statusToolbar.down('#validationWarning').el, newStatus);
        }
    },

    getMappedFields: function() {
        var me = this,
            comboBoxes = me.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            mappedFields = [],
            i = 0,
            rec;

        for (; i < comboBoxesLength; i++) {
            if (comboBoxes[i].getValue() && comboBoxes[i].getValue()!=="none") {
                rec = comboBoxes[i].findRecordByValue(comboBoxes[i].getValue());
                mappedFields.push(rec);
            }
        }
        return mappedFields;
    },

    getMappedFieldNames: function() {
        var me = this,
            comboBoxes = me.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            mappedFields = [],
            i = 0,
            rec;

        for (; i < comboBoxesLength; i++) {
            if (comboBoxes[i].getValue() && comboBoxes[i].getValue()!=="none") {
                rec = comboBoxes[i].findRecordByValue(comboBoxes[i].getValue());
                mappedFields.push(rec.get('fieldName'));
            }
        }

        return mappedFields;
    },

    /**
     * Add a tooltip to the validation warning which shows the names of required missing fields
     * @param {Ext.dom.Element} el The element of the toolbar warning message
     * @param {Object} status The informational object created in the controller's updateStatusToolbar function
     * @return void
     */
    updateValidationTooltip: function(el, status) {
        var tip = this.getValidationToolTip();

        // Create the ToolTip component if it has not yet been created
        if (!tip) {
            tip = Ext.create('Ext.tip.ToolTip', {
                target: el,
                html: ''
            });
            this.setValidationToolTip(tip);
        }

        if (status && status.unmappedRequiredFields && status.unmappedRequiredFields.length > 0) {
            tip.update('required fields: ' + status.unmappedRequiredFields.join());
        } else {
            tip.update('');
        }
    },

    /**
     * Returns validation window object or creates one if it had not yet been created
     * @return {Array} An array of comboboxes that have a value set to an import field.
     */
    getValidationWindow: function() {
        var win = this.validationWindow,
            view;

        // Create the ToolTip component if it has not yet been created
        if (!win) {
            console.log('no win, creating');
            view = Ext.widget('slatecsv-validation-view');
            win = Ext.create('Ext.window.Window', {
                title: 'Data validation warning',
                closeAction: 'hide',
                bodyPadding: 12,
                layout: 'fit',
                items: [ view ]
            });
            this.setValidationWindow(win);
        }
        else {
            console.log('had win, no need to create');
        }

        console.log(win);

        return win;
    }
});
