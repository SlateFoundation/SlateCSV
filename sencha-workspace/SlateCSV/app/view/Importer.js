/*jslint browser: true, undef: true */ /*global Ext*/
Ext.define('SlateCSV.view.Importer', {
    extend: 'Ext.Container',
    xtype: 'slatecsv-importer',
    requires: [
        'SlateCSV.view.ImporterController',
        'SlateCSV.view.ValidationResult'
    ],

    controller: 'slatecsv-importer',

    config: {
        entityTitle: '',
        csvText: null,
        csvData: null,
        useFirstRowForColumnNames: true,
        importStatus: null,
        importStore: null,
        maxPreviewRows: 5,
        validationToolTip: null,
        validationWindow: null,
        requiredFields: [],
        importFields: [],
        items: [{
            itemId: 'header',
            xtype: 'container',
            tpl: [
                '<header class="page-header">',
                '   <h1 class="header-title">{entityTitle} Upload Wizard</h1>',
                '</header>'
            ]
        },{
            itemId: 'instructions',
            xtype: 'component',
            html: [
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

    importData: function() {
        this.fireEvent('dataimportcontinue');
    },

    cancelImport: function() {
        this.fireEvent('dataimportcancel');
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
     * @return {Ext.window.Window} A window containing a SlateCSV.view.ValidationResult
     */
    getValidationWindow: function() {
        var me = this,
            win = me.validationWindow,
            view;

        // Create the window if it has not yet been created
        if (!win) {
            view = Ext.widget('slatecsv-view-validationresult');
            win = Ext.create('Ext.window.Window', {
                title: 'Data validation',
                xtype: 'slatecsv-validationwindow',
                minWidth: 360,
                importer: me,
                modal: true,
                closeAction: 'hide',
                bodyPadding: 12,
                layout: 'fit',
                items: [ view ],
                buttons: [{
                    text: 'cancel',
                    action: 'cancel',
                    handler: function(button) {
                        button.up('window').importer.cancelImport();
                    }
                },{
                    text: 'continue',
                    action: 'continue',
                    handler: function(button) {
                        button.up('window').importer.importData();
                    }
                }]
            });
            me.setValidationWindow(win);
        }

        return win;
    }
});
