/*jslint browser: true, undef: true, laxcomma:true *//*global Ext, SlateCSV*/
Ext.define('SlateCSV.view.ImporterController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.slatecsv-importer',
    requires: [
        'SlateCSV.util.CSV',
        'SlateCSV.field.Importer'
    ],

    config: {
        // id: 'slate-importer-csv-importer', // workaround for http://www.sencha.com/forum/showthread.php?290043-5.0.1-destroying-a-view-with-ViewController-attached-disables-listen-..-handlers
        control: {
            '#': {
                render: 'onComponentRender',
                csvtextchange: 'onCSVTextChange',
                updateusefirstrowforcolumnnames: 'onUseFirstRowForColumnNamesChange'
            },
            'slatecsv-importerfield': {
                beforequery: 'onBeforeQueryComboBox',
                select: 'onComboBoxSelect'
            }
        }
    },

    //event handlers
    onComponentRender: function(importerView) {
        var me = this,
            inputEl = importerView.el.down('input[name=csv]').dom,
            firstRowRadiosQuery = importerView.el.query('input[name=first-row]'),
            firstRowRadiosLength = firstRowRadiosQuery.length,
            handleFileSelect = function(evt) {
                //TODO handle if user doesn't want to lose changes

                var files = evt.target.files,
                    reader = new FileReader();

                if (files.length > 0) {
                    reader.onload = function(e) {
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

    onCSVTextChange: function(newCsvText) {
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

    onBeforeQueryComboBox: function(queryPlan) {
        var view = this.getView(),
            comboBox = queryPlan.combo,
            comboBoxes = view.query('slatecsv-importerfield'),
            comboBoxesLength = comboBoxes.length,
            selectedValues = [],
            i = 0,
            store;

        for (; i < comboBoxesLength; i++) {
            if (comboBoxes[i] != comboBox && comboBoxes[i].getValue()) {
                selectedValues.push(comboBoxes[i].getValue());
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
                        fields: ['fieldName', 'importer', 'label'],
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
            mappedFields = view.getMappedFields(),
            mappedRequiredFields = Ext.Array.intersect(requiredFields, mappedFields),
            csvData = view.getCsvData(),
            selectedFields = selectedFields,
            status = {
                mappedFields: 0,
                requiredFields: 0,
                selectedColumns: 0,
                totalColumns: 0
            },
            cols;

        if (mappedRequiredFields) {
            status.mappedFields = mappedRequiredFields.length;
        }
        if (requiredFields) {
            status.requiredFields = requiredFields.length;
        }
        if (mappedFields) {
            status.selectedColumns = mappedFields.length;
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
            comboBox;

        for (; i < comboBoxesLength; i++) {
            comboBox = comboBoxes[i];
            if (comboBox.getValue()) {
                if(useFirstRowForColumnNames) {
                    object[comboBox.getValue()] = row[comboBox.getFieldLabel()];
                }
                else {
                    object[comboBox.getValue()] = row[cols[comboBox.dataIndex]];
                }
            }
        }

        return object;
    },

    updatePreviewGrid: function() {
        var me = this,
            view = me.getView(),
            importFields = view.getImportFields(),
            mappedFields = view.getMappedFields(),
            mappedFieldsLength = mappedFields.length,
            csvData = view.getCsvData(),
            csvDataLength = csvData.length,
            maxPreviewRows = view.getMaxPreviewRows(),
            previewGrid = view.down('#previewGrid'),
            gridColumns = [],
            gridStoreFields = [],
            i = 0,
            findFieldFn = function(fieldName) {
                return Ext.Array.findBy(importFields, function(item) {
                    return item.fieldName == fieldName;
                });
            },
            previewData = [],
            fieldData;

        for (; i < mappedFieldsLength; i++) {
            fieldData = findFieldFn(mappedFields[i]);

            if (fieldData) {
                gridStoreFields.push(mappedFields[i]);
                gridColumns.push({
                    dataIndex: mappedFields[i],
                    text: fieldData.label
                });
            }
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
    }
});