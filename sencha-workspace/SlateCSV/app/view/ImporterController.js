/*jslint browser: true, undef: true, eqeq: true, plusplus: true */ /*global Ext,SlateCSV*/
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

        console.log(mappedFieldNames);

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
            //mappedFieldsLength = mappedFields.length,
            csvData = view.getCsvData(),
            csvDataLength = csvData.length,
            maxPreviewRows = view.getMaxPreviewRows(),
            previewGrid = view.down('#previewGrid'),
            gridColumns = [],
            gridStoreFields = [],
            i = 0,
            previewData = [];

        Ext.Array.each(mappedFields, function(field) {
            gridStoreFields.push(field.get('fieldName'));
            gridColumns.push({
                dataIndex: field.get('fieldName'),
                text: field.get('label')
            });
        });

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
            view = me.getView(),
            useFirstRowForColumnNames = view.getUseFirstRowForColumnNames(),
            comboBoxes = me.getValidComboBoxes(),
            csvData = view.getCsvData(),
            cols = Ext.Object.getKeys(csvData[0]),
            vtypes = Ext.form.VTypes,
            validations = [],
            validationWindow = view.getValidationWindow(),
            failures = 0;

        Ext.Array.each(comboBoxes, function(combo) {
            field = combo.findRecordByValue(combo.getValue());

            if (field.get('vtype') && vtypes[field.get('vtype')] ) {
                validations.push({
                    fieldName: field.get('fieldName'),
                    fieldLabel: field.get('label'),
                    dataIndex: combo.dataIndex,
                    label: combo.getFieldLabel(),
                    vtype: field.get('vtype'),
                    vtext: (field.get('vtypeText') || vtypes[field.get('vtype') +'Text']),
                    invalidRows: []
                });
            }
        });

        Ext.Array.each(csvData, function(row,index) {
            Ext.Array.each(validations, function(v) {
                value = useFirstRowForColumnNames ? row[v.label] : row[cols[v.dataIndex]];

                if (!vtypes[v.vtype](value)) {
                    v.invalidRows.push(index);
                    failures++;
                }
            });

        });

        validationWindow.down('slatecsv-validation-view').update({
            failures: failures,
            validations: validations
        });

        validationWindow.show();

    },

    /**
     * Returns comboxes with a valid mapping
     * @private
     * @return {Array} An array of comboboxes that have a value set to an import field.
     */
    getValidComboBoxes: function() {
        var view = this.getView(),
            comboBoxes = view.query('slatecsv-importerfield');

        return Ext.Array.filter(comboBoxes, function(combo) {
            return (combo.getValue() && combo.getValue()!=="none");
        });
    }

});
