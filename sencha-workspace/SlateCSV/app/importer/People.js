/*jslint browser: true, undef: true */
Ext.define('SlateCSV.importer.People', {
    singleton: true,

    config: {
        requiredFields: [
            'FirstName',
            'LastName',
            'StudentID',
            'GraduationYear'
        ],
        importFields: [{
            'id': 'none',
            'label': 'None',
            'fieldName': null
        }, {
            'id': 'student-first-name-preserve-case',
            'label': 'student first name preserve case',
            'fieldName': 'FirstName',
            'vtype': 'required'
        }, {
            'id': 'student-first-name-autocapitalize',
            'label': 'student first name autocapitalize',
            'fieldName': 'FirstName',
            'vtype': 'required',
            'transform': Ext.util.Format.capitalize
        }, {
            'id': 'student-middle-name-preserve-case',
            'label': 'student middle name preserve case',
            'fieldName': 'MiddleName'
        }, {
            'id': 'student-middle-name-autocapitalize',
            'label': 'student middle name autocapitalize',
            'fieldName': 'MiddleName',
            'transform': Ext.util.Format.capitalize
        }, {
            'id': 'student-last-name-preserve-case',
            'label': 'student last name preserve case',
            'fieldName': 'LastName',
            'vtype': 'required'
        }, {
            'id': 'student-last-name-autocapitalize',
            'label': 'student-last-name-autocapitalize',
            'fieldName': 'LastName',
            'vtype': 'required',
            'transform': Ext.util.Format.capitalize
        }, {
            'id': 'graduation-year',
            'label': 'Graduation Year',
            'fieldName': 'GraduationYear',
            'vtype': 'year'
        }, {
            'id': 'student-id',
            'label': 'Student ID',
            'fieldName': 'StudentID'
        }, {
            'id': 'gender',
            'label': 'Gender',
            'fieldName': 'Gender'
        }, {
            'id': 'gender-full-word',
            'label': 'Gender - full word',
            'fieldName': 'Gender'
        }, {
            'id': 'advisor-first-name-preserve-case',
            'label': 'advisor first name preserve case',
            'fieldName': 'AdvisorFirstName'
        }, {
            'id': 'advisor-first-name-autocapitalize',
            'label': 'advisor first name autocapitalize',
            'fieldName': 'AdvisorFirstName',
            'transform': Ext.util.Format.capitalize
        }, {
            'id': 'advisor-middle-name-preserve-case',
            'label': 'advisor middle name preserve case',
            'fieldName': 'AdvisorMiddleName'
        }, {
            'id': 'advisor-middle-name-autocapitalize',
            'label': 'advisor middle name autocapitalize',
            'fieldName': 'AdvisorMiddleName',
            'transform': Ext.util.Format.capitalize
        }, {
            'id': 'advisor-last-name-preserve-case',
            'label': 'advisor last name preserve case',
            'fieldName': 'AdvisorLastName'
        }, {
            'id': 'advisor-last-name-autocapitalize',
            'label': 'advisor last name autocapitalize',
            'fieldName': 'AdvisorLastName',
            'transform': Ext.util.Format.capitalize
        }]
    }

});
