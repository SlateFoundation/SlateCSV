/*jslint browser: true, undef: true, eqeq: true, plusplus: true */ /*global Ext,SlateCSV*/
Ext.define('SlateCSV.view.ImporterController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.slatecsv-importer',
    requires: [
        'SlateCSV.util.CSV',
        'SlateCSV.field.Importer',
        'Ext.data.Store',
        'Slate.model.person.Person'
    ],

    config: {
        // id: 'slate-importer-csv-importer', // workaround for http://www.sencha.com/forum/showthread.php?290043-5.0.1-destroying-a-view-with-ViewController-attached-disables-listen-..-handlers
        control: {
            '#': {
                render: 'onComponentRender',
                afterrender: 'onComponentAfterRender',
                csvtextchange: 'onCSVTextChange',
                updateusefirstrowforcolumnnames: 'onUseFirstRowForColumnNamesChange',
                dataimportcontinue: 'onContinueButtonClick',
                dataimportcancel: 'onCancelButtonClick'
            },
            'slatecsv-importerfield': {
                beforequery: 'onBeforeQueryComboBox',
                select: 'onComboBoxSelect'
            }
        }
    },

    //event handlers
    onComponentRender: function(importerView) {
        var inputEl = importerView.el.down('input[name=csv]').dom,
            firstRowRadiosQuery = importerView.el.query('input[name=first-row]'),
            firstRowRadiosLength = firstRowRadiosQuery.length,
            handleFileSelect = function(evt) {
                //TODO handle if user doesn't want to lose changes

                var files = evt.target.files,
                    reader = new FileReader();

                if (files.length > 0) {
                    reader.onload = function() {
                        var csvText = reader.result,
                            useFirstRowForColumnNames = importerView.getUseFirstRowForColumnNames(),
                            data = SlateCSV.util.CSV.toObjects(csvText, {
                            headers: useFirstRowForColumnNames
                        });
                        importerView.setCsvText(csvText);
                        importerView.setCsvData(data);
                    };

                    reader.readAsText(files[0]);
                }
            },
            handleRadioChange = function(evt) {
                importerView.setUseFirstRowForColumnNames(evt.target.value != "record");
            },
            i = 0;

        inputEl.addEventListener('change', handleFileSelect, false);
        for (; i < firstRowRadiosLength; i++) {
            firstRowRadiosQuery[i].addEventListener('change', handleRadioChange, false);
        }
    },

    /**
     * Event Handler. Set the header title based on the value for entityTitle in the importer class
     * @param {SlateCSV.view.Importer} importerView
     * @return null
     */
    onComponentAfterRender: function(importerView) {
        var header = importerView.down('#header'),
            title = {
                entityTitle:importerView.getEntityTitle()
            };

        header.update(title);
    },

    onCSVTextChange: function() {
        this.populateMappingForm();
    },

    onUseFirstRowForColumnNamesChange: function(value) {
        var me = this,
            view = me.getView(),
            csvText = view.getCsvText(),
            data = [];

        if (csvText) {
            data = SlateCSV.util.CSV.toObjects(csvText, {
                headers: value
            });
        }

        view.setCsvData(data);
        me.populateMappingForm();
        me.updatePreviewGrid();
    },

    /**
     * Event Handler. Before combo options are shown, this compiles a list of selected values in other
     * combo boxes and removes them as options in this combo.
     * @param {Object} queryPlan An object containing details about the query to be executed.
     * @param {Ext.form.field.ComboBox} queryPlan.combo A reference to this ComboBox.
     */
    onBeforeQueryComboBox: function(queryPlan) {
        var view = this.getView(),
            comboBox = queryPlan.combo,
            comboBoxes = view.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            selectedValues = [],
            i = 0,
            rec;

        for (; i < comboBoxesLength; i++) {
            if (comboBoxes[i] != comboBox && comboBoxes[i].getValue() && comboBoxes[i].getValue()!=="none") {
                rec = comboBoxes[i].findRecordByValue(comboBoxes[i].getValue());
                selectedValues.push(rec.get('fieldName'));
            }
        }

        comboBox.getStore().clearFilter();
        comboBox.getStore().filterBy(function(item) {
            return !Ext.Array.contains(selectedValues, item.get('fieldName'));
        });

        queryPlan.cancel = true;

        comboBox.expand();
    },

    onComboBoxSelect: function() {
        var me = this;

        me.updateStatusToolbar();
        me.updatePreviewGrid();
    },

    populateMappingForm: function() {
        var me = this,
            view = me.getView(),
            csvData = view.getCsvData(),
            importerFields = view.getImportFields(),
            useFirstRowForColumnNames = view.getUseFirstRowForColumnNames(),
            formMappingCt = view.down('#formMappingCt'),
            fields = [],
            i = 0,
            cols, colCount;

        formMappingCt.removeAll();

        if (csvData && csvData.length > 0) {
            cols = Ext.Object.getKeys(csvData[0]);
            colCount = cols.length;

            for (; i < colCount; i++) {
                fields.push({
                    xtype: 'slatecsv-importerfield',
                    dataIndex: i,
                    fieldLabel: useFirstRowForColumnNames ? cols[i] : 'Column ' + (i + 1),
                    store: {
                        xclass: 'Ext.data.Store',
                        fields: ['id', 'fieldName', 'transform', 'label', 'vtype'],
                        data: importerFields
                    }
                });
            }

            formMappingCt.add(fields);
        }

        me.updateStatusToolbar();
    },

    updateStatusToolbar: function() {
        var me = this,
            view = me.getView(),
            requiredFields = view.getRequiredFields(),
            mappedFieldNames = view.getMappedFieldNames(),
            mappedRequiredFields = Ext.Array.intersect(requiredFields, mappedFieldNames),
            unmappedRequiredFields = Ext.Array.difference(requiredFields, mappedRequiredFields),
            csvData = view.getCsvData(),
            selectedFields = selectedFields,
            status = {
                mappedFields: 0,
                unmappedFields: 0,
                requiredFields: 0,
                selectedColumns: 0,
                totalColumns: 0,
                unmappedRequiredFields: unmappedRequiredFields
            },
            cols;

        if (mappedRequiredFields) {
            status.mappedFields = mappedRequiredFields.length;
        }
        if (requiredFields) {
            status.requiredFields = requiredFields.length;
        }
        status.unmappedFields = status.requiredFields - status.mappedFields;
        if (mappedFieldNames) {
            status.selectedColumns = mappedFieldNames.length;
        }
        if (csvData && csvData.length > 0) {
            cols = Ext.Object.getKeys(csvData[0]);
            status.totalColumns = cols.length;
            view.setImportStatus(status);
        }
        else {
            view.setImportStatus(null);
        }
    },

    buildPreviewDataRow: function(row) {
        var me = this,
            view = me.getView(),
            useFirstRowForColumnNames = view.getUseFirstRowForColumnNames(),
            comboBoxes = view.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            cols = Ext.Object.getKeys(row),
            i = 0,
            object = {},
            comboBox,
            rec,
            val,
            fn;

        for (; i < comboBoxesLength; i++) {
            comboBox = comboBoxes[i];
            if (comboBox.getValue() && comboBox.getValue()!=="none") {
                rec = comboBox.findRecordByValue(comboBoxes[i].getValue());
                val = useFirstRowForColumnNames ? row[comboBox.getFieldLabel()] : row[cols[comboBox.dataIndex]];
                fn = rec.get('transform');

                if (fn && typeof(fn) === 'function') {
                    val = fn(val);
                }

                object[rec.get('fieldName')] = val;
            }
        }

        return object;
    },

    updatePreviewGrid: function() {
        var me = this,
            view = me.getView(),
            mappedFields = view.getMappedFields(),
            mappedFieldsLength = mappedFields.length,
            csvData = view.getCsvData(),
            csvDataLength = csvData.length,
            maxPreviewRows = view.getMaxPreviewRows(),
            previewGrid = view.down('#previewGrid'),
            gridColumns = [],
            gridStoreFields = [],
            i = 0,
            previewData = [],
            field;

        for (; i < mappedFieldsLength; i++) {
            field = mappedFields[i];
            gridStoreFields.push(field.get('fieldName'));
            gridColumns.push({
                dataIndex: field.get('fieldName'),
                text: field.get('label')
            });
        }

        for (i = 0; i < Math.min(csvDataLength, maxPreviewRows); i++) {
            previewData.push(me.buildPreviewDataRow(csvData[i]));
        }

        if (previewData.length > 0) {
            previewGrid.setStore({
                xclass: 'Ext.data.Store',
                fields: gridStoreFields,
                data: previewData
            });
            previewGrid.setColumns(gridColumns);
            previewGrid.setHidden(false);
        } else {
            previewGrid.setHidden(true);
        }
    },

    onImportButtonClick: function() {
        var me = this,
            start = (new Date()).getTime(), //benchmark
            view = me.getView(),
            useFirstRowForColumnNames = view.getUseFirstRowForColumnNames(),
            comboBoxes = view.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            csvData = view.getCsvData(),
            csvDataLength = csvData.length,
            cols = Ext.Object.getKeys(csvData[0]),
            fieldMeta = new Ext.util.Collection(),
            errorSummary = new Ext.util.Collection(),
            validationWindow = view.getValidationWindow(),
            validRows = 0,
            inValidRows = 0,
            failures = 0,
            i = 0,
            j = 0,
            row,
            fields = [],
            fieldsLength,
            comboRecord,
            data,
            store;

        for (; i < comboBoxesLength; i++) {
            combo = comboBoxes[i];

            if (combo.getValue() && combo.getValue()!=="none") {
                comboRecord = combo.findRecordByValue(combo.getValue());

                fields.push({
                    fieldName: comboRecord.get('fieldName'),
                    fieldLabel: comboRecord.get('label'),
                    dataIndex: combo.dataIndex,
                    label: combo.getFieldLabel(),
                    vtype: comboRecord.get('vtype'),
                    transform: comboRecord.get('transform')
                });

                fieldMeta.add({
                    id: comboRecord.get('fieldName'),
                    fieldLabel: comboRecord.get('label'),
                    label: combo.getFieldLabel()
                });
            }
        }

        fieldsLength = fields.length;

        store = Ext.create('Ext.data.Store', {
            model: 'Slate.model.person.Person',
            proxy: {
                type: 'slaterecords',
                url: '/people',
                timeout: 5 * 60 * 1000
            }
        });

        for (i = 0; i < csvDataLength; i++) {
            row = csvData[i];
            rowValid = true;
            data = {};

            for (j = 0; j < fieldsLength; j++) {
                field = fields[j];
                value = useFirstRowForColumnNames ? row[field.label] : row[cols[field.dataIndex]];
                fn = field.transform;

                // transform the value if the importRecord transform attribute is set to a function
                if (fn && typeof(fn) === 'function') {
                    value = fn(value);
                }

                data[field.fieldName] = value;

            }

            rec = Ext.create('Slate.model.person.Person',data);
            rec.set('Class','Slate\\People\\Student');

            if (rec.isValid()) {
                store.add(rec);
                validRows++;
            } else {
                errors = rec.getValidation().getData();
                inValidRows++;

                for (var key in errors) {
                    if (errors.hasOwnProperty(key)) {
                        error = errors[key];

                        if (error!==true) { // field in error data object set to true means no error
                            summaryItem = errorSummary.getByKey(key+'|'+error);
                            failures++;

                            if (!summaryItem) {
                                meta = fieldMeta.getByKey(key);
                                if (!meta) {
                                    //shouldn't arrive here, but just in case....
                                    meta = {fieldLabel: 'unknown', label: 'unknown'};
                                }
                                summaryItem = {
                                    id: key+'|'+error,
                                    fieldLabel: meta.fieldLabel,
                                    label: meta.label,
                                    vtext: error,
                                    invalidRows: []
                                };
                            }
                            summaryItem.invalidRows.push(i+2);
                            errorSummary.add(summaryItem);
                        }
                    }
                }
            }
        }
        view.setImportStore(store);


        validationWindow.down('slatecsv-view-validationresult #validation-summary').update({
            totalRows: csvDataLength,
            validRows: validRows,
            inValidRows: inValidRows,
            failures: failures,
            validations: errorSummary.getRange(),
            benchmark: (new Date()).getTime() - start
        });

        if (validRows === 0) {
            validationWindow.down('button[action="continue"]').disable();
        }

        validationWindow.show();

    },

    onContinueButtonClick: function() {
        var me = this,
            view = me.getView(),
            store = view.getImportStore(),
            validationWindow = view.getValidationWindow();

        // disable button and show loading message
        validationWindow.down('slatecsv-view-validationresult').setActiveItem(1);
        validationWindow.down('button[action="continue"]').disable();
        validationWindow.down('button[action="cancel"]').disable();

        console.log(store.getProxy());

        store.sync({
            callback: function(batch, options) {
                me.resetValidationWindow();
            },
            failure: function(batch, options) {
                var operation = batch.getOperations()[0],
                    response = operation.getResponse(),
                    responseText,
                    failures,
                    message;

                if (response && responseText && responseText.failed) {
                    responseText = Ext.decode(response.responseText,true),
                    failures = responseText.failed.length,
                    message = responseText.message;
                    Ext.Msg.alert('Import Failed', message);
                } else {
                    Ext.Msg.alert('Import Failed', 'Data could not be imported');
                }

            },
            success: function(batch, options) {
                var operation = batch.getOperations()[0],
                    response = operation.getResponse(),
                    message ='',
                    resText;

                me.resetValidationWindow();

                if (response && response.responseText) {
                    resText = Ext.decode(response.responseText,true);

                    if (resText) {
                        if (resText.message) {
                            message += '<p>'+resText.message+'</p>';
                        }
                        if (resText.data && resText.data.length) {
                            message += '<p>Rows successfully imported: '+resText.data.length+'</p>';
                        }
                        if (resText.data && resText.failed.length) {
                            message += '<p>Rows unable to be imported: : '+resText.failed.length+'</p>';
                        }
                    }
                    Ext.Msg.alert('Import Successful', message);
                } else {
                    Ext.Msg.alert('Unknown Result', 'The server indicated that the import was successful, but did not send a message');
                }
            }
        });
    },

    onCancelButtonClick: function() {
        var me = this,
            view = me.getView();

        view.setImportStore(null);
        me.resetValidationWindow();
    },

    resetValidationWindow: function() {
        var me = this,
            view = me.getView(),
            validationWindow = view.getValidationWindow();

        validationWindow.hide();
        validationWindow.down('slatecsv-view-validationresult #validation-summary').update('');
        validationWindow.down('slatecsv-view-validationresult').setActiveItem(0);
        validationWindow.down('button[action="continue"]').enable();
        validationWindow.down('button[action="cancel"]').enable();
    }
});
