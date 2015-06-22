/*jslint browser: true, undef: true, laxcomma:true *//*global Ext,SlateCSV*/
/**
 * This class has been adapted from jQuery-csv (jQuery Plugin)
 * version: 0.71 (2012-11-19)
 * Copyrighted 2012 by Evan Plaice.
 */
Ext.define('SlateCSV.util.CSV', {
    singleton: true,

    config: {
        separator: ',',
        delimiter: '"',
        headers: true,
        start: 1
    },

    regExpEscape: function(s) {
        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    },

    parsers: {
        parse: function(csv, options) {
            // cache settings
            var me = this,
                separator = options.separator,
                delimiter = options.delimiter,
            // clear initial state
                data = [],
                entry = [],
                state = 0,
                value = '',
                exit = false;

            // set initial state if it's missing
            if (!options.state.rowNum) {
                options.state.rowNum = 1;
            }
            if (!options.state.colNum) {
                options.state.colNum = 1;
            }

            function endOfEntry() {
                // reset the state
                state = 0;
                value = '';

                // if 'start' hasn't been met, don't output
                if (options.start && options.state.rowNum < options.start) {
                    // update global state
                    entry = [];
                    options.state.rowNum++;
                    options.state.colNum = 1;
                    return;
                }

                if (options.onParseEntry === undefined) {
                    // onParseEntry hook not set
                    data.push(entry);
                } else {
                    var hookVal = options.onParseEntry(entry, options.state); // onParseEntry Hook
                    // false skips the row, configurable through a hook
                    if (hookVal !== false) {
                        data.push(hookVal);
                    }
                }
                //console.log('entry:' + entry);

                // cleanup
                entry = [];

                // if 'end' is met, stop parsing
                if (options.end && options.state.rowNum >= options.end) {
                    exit = true;
                }

                // update global state
                options.state.rowNum++;
                options.state.colNum = 1;
            }

            function endOfValue() {
                if (options.onParseValue === undefined) {
                    // onParseValue hook not set
                    entry.push(value);
                } else {
                    var hook = options.onParseValue(value, options.state); // onParseValue Hook
                    // false skips the row, configurable through a hook
                    if (hook !== false) {
                        entry.push(hook);
                    }
                }
                //console.log('value:' + value);
                // reset the state
                value = '';
                state = 0;
                // update global state
                options.state.colNum++;
            }

            // escape regex-specific control chars
            var escSeparator = SlateCSV.util.CSV.regExpEscape(separator);
            var escDelimiter = SlateCSV.util.CSV.regExpEscape(delimiter);

            // compile the regEx str using the custom delimiter/separator
            var match = /(D|S|\n|\r|[^DS\r\n]+)/;
            var matchSrc = match.source;
            matchSrc = matchSrc.replace(/S/g, escSeparator);
            matchSrc = matchSrc.replace(/D/g, escDelimiter);
            match = RegExp(matchSrc, 'gm');

            // put on your fancy pants...
            // process control chars individually, use look-ahead on non-control chars
            csv.replace(match, function(m0) {
                if (exit) {
                    return;
                }
                switch (state) {
                    // the start of a value
                    case 0:
                        // null last value
                        if (m0 === separator) {
                            value += '';
                            endOfValue();
                            break;
                        }
                        // opening delimiter
                        if (m0 === delimiter) {
                            state = 1;
                            break;
                        }
                        // null last value
                        if (m0 === '\n') {
                            endOfValue();
                            endOfEntry();
                            break;
                        }
                        // phantom carriage return
                        if (/^\r$/.test(m0)) {
                            break;
                        }
                        // un-delimited value
                        value += m0;
                        state = 3;
                        break;

                        // delimited input
                    case 1:
                        // second delimiter? check further
                        if (m0 === delimiter) {
                            state = 2;
                            break;
                        }
                        // delimited data
                        value += m0;
                        state = 1;
                        break;

                        // delimiter found in delimited input
                    case 2:
                        // escaped delimiter?
                        if (m0 === delimiter) {
                            value += m0;
                            state = 1;
                            break;
                        }
                        // null value
                        if (m0 === separator) {
                            endOfValue();
                            break;
                        }
                        // end of entry
                        if (m0 === '\n') {
                            endOfValue();
                            endOfEntry();
                            break;
                        }
                        // phantom carriage return
                        if (/^\r$/.test(m0)) {
                            break;
                        }
                        // broken paser?
                        throw new Error('CSVDataError: Illegal State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');

                        // un-delimited input
                    case 3:
                        // null last value
                        if (m0 === separator) {
                            endOfValue();
                            break;
                        }
                        // end of entry
                        if (m0 === '\n') {
                            endOfValue();
                            endOfEntry();
                            break;
                        }
                        // phantom carriage return
                        if (/^\r$/.test(m0)) {
                            break;
                        }
                        if (m0 === delimiter) {
                            // non-compliant data
                            throw new Error('CSVDataError: Illegal Quote [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                        }
                        // broken parser?
                        throw new Error('CSVDataError: Illegal Data [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                    default:
                        // shenanigans
                        throw new Error('CSVDataError: Unknown State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                }
                //console.log('val:' + m0 + ' state:' + state);
            });

            // submit the last entry
            // ignore null last line
            if (entry.length !== 0) {
                endOfValue();
                endOfEntry();
            }

            return data;
        },

        // a csv-specific line splitter
        splitLines: function(csv, options) {
            var // cache settings
                separator = options.separator,
                delimiter = options.delimiter,
                // clear initial state
                entries = [],
                state = 0,
                entry = '',
                exit = false;

            // set initial state if it's missing
            if (!options.state.rowNum) {
                options.state.rowNum = 1;
            }

            function endOfLine() {
                // reset the state
                state = 0;

                // if 'start' hasn't been met, don't output
                if (options.start && options.state.rowNum < options.start) {
                    // update global state
                    entry = '';
                    options.state.rowNum++;
                    return;
                }

                if (options.onParseEntry === undefined) {
                    // onParseEntry hook not set
                    entries.push(entry);
                } else {
                    var hookVal = options.onParseEntry(entry, options.state); // onParseEntry Hook
                    // false skips the row, configurable through a hook
                    if (hookVal !== false) {
                        entries.push(hookVal);
                    }
                }

                // cleanup
                entry = '';

                // if 'end' is met, stop parsing
                if (options.end && options.state.rowNum >= options.end) {
                    exit = true;
                }

                // update global state
                options.state.rowNum++;
            }

            // escape regex-specific control chars
            var escSeparator = SlateCSV.util.CSV.regExpEscape(separator);
            var escDelimiter = SlateCSV.util.CSV.regExpEscape(delimiter);

            // compile the regEx str using the custom delimiter/separator
            var match = /(D|S|\n|\r|[^DS\r\n]+)/;
            var matchSrc = match.source;
            matchSrc = matchSrc.replace(/S/g, escSeparator);
            matchSrc = matchSrc.replace(/D/g, escDelimiter);
            match = RegExp(matchSrc, 'gm');

            // put on your fancy pants...
            // process control chars individually, use look-ahead on non-control chars
            csv.replace(match, function(m0) {
                if (exit) {
                    return;
                }
                switch (state) {
                    // the start of a value/entry
                    case 0:
                        // null value
                        if (m0 === separator) {
                            entry += m0;
                            state = 0;
                            break;
                        }
                        // opening delimiter
                        if (m0 === delimiter) {
                            entry += m0;
                            state = 1;
                            break;
                        }
                        // end of line
                        if (m0 === '\n') {
                            endOfLine();
                            break;
                        }
                        // phantom carriage return
                        if (/^\r$/.test(m0)) {
                            break;
                        }
                        // un-delimit value
                        entry += m0;
                        state = 3;
                        break;

                        // delimited input
                    case 1:
                        // second delimiter? check further
                        if (m0 === delimiter) {
                            entry += m0;
                            state = 2;
                            break;
                        }
                        // delimited data
                        entry += m0;
                        state = 1;
                        break;

                        // delimiter found in delimited input
                    case 2:
                        // escaped delimiter?
                        var prevChar = entry.substr(entry.length - 1);
                        if (m0 === delimiter && prevChar === delimiter) {
                            entry += m0;
                            state = 1;
                            break;
                        }
                        // end of value
                        if (m0 === separator) {
                            entry += m0;
                            state = 0;
                            break;
                        }
                        // end of line
                        if (m0 === '\n') {
                            endOfLine();
                            break;
                        }
                        // phantom carriage return
                        if (m0 === '\r') {
                            break;
                        }
                        // broken paser?
                        throw new Error('CSVDataError: Illegal state [Row:' + options.state.rowNum + ']');

                        // un-delimited input
                    case 3:
                        // null value
                        if (m0 === separator) {
                            entry += m0;
                            state = 0;
                            break;
                        }
                        // end of line
                        if (m0 === '\n') {
                            endOfLine();
                            break;
                        }
                        // phantom carriage return
                        if (m0 === '\r') {
                            break;
                        }
                        // non-compliant data
                        if (m0 === delimiter) {
                            throw new Error('CSVDataError: Illegal quote [Row:' + options.state.rowNum + ']');
                        }
                        // broken parser?
                        throw new Error('CSVDataError: Illegal state [Row:' + options.state.rowNum + ']');
                    default:
                        // shenanigans
                        throw new Error('CSVDataError: Unknown state [Row:' + options.state.rowNum + ']');
                }
                //console.log('val:' + m0 + ' state:' + state);
            });

            // submit the last entry
            // ignore null last line
            if (entry !== '') {
                endOfLine();
            }

            return entries;
        },

        // a csv entry parser
        parseEntry: function(csv, options) {
            var me = this,
                // cache settings
                separator = options.separator,
                delimiter = options.delimiter,
                // clear initial state
                entry = [],
                state = 0,
                value = '';

            // set initial state if it's missing
            if (!options.state.rowNum) {
                options.state.rowNum = 1;
            }
            if (!options.state.colNum) {
                options.state.colNum = 1;
            }

            function endOfValue() {
                if (options.onParseValue === undefined) {
                    // onParseValue hook not set
                    entry.push(value);
                } else {
                    var hook = options.onParseValue(value, options.state); // onParseValue Hook
                    // false skips the value, configurable through a hook
                    if (hook !== false) {
                        entry.push(hook);
                    }
                }
                // reset the state
                value = '';
                state = 0;
                // update global state
                options.state.colNum++;
            }

            // checked for a cached regEx first
            if (!options.match) {
                // escape regex-specific control chars
                var escSeparator = SlateCSV.util.CSV.regExpEscape(separator);
                var escDelimiter = SlateCSV.util.CSV.regExpEscape(delimiter);

                // compile the regEx str using the custom delimiter/separator
                var match = /(D|S|\n|\r|[^DS\r\n]+)/;
                var matchSrc = match.source;
                matchSrc = matchSrc.replace(/S/g, escSeparator);
                matchSrc = matchSrc.replace(/D/g, escDelimiter);
                options.match = RegExp(matchSrc, 'gm');
            }

            // put on your fancy pants...
            // process control chars individually, use look-ahead on non-control chars
            csv.replace(options.match, function(m0) {
                switch (state) {
                    // the start of a value
                    case 0:
                        // null last value
                        if (m0 === separator) {
                            value += '';
                            endOfValue();
                            break;
                        }
                        // opening delimiter
                        if (m0 === delimiter) {
                            state = 1;
                            break;
                        }
                        // skip un-delimited new-lines
                        if (m0 === '\n' || m0 === '\r') {
                            break;
                        }
                        // un-delimited value
                        value += m0;
                        state = 3;
                        break;

                        // delimited input
                    case 1:
                        // second delimiter? check further
                        if (m0 === delimiter) {
                            state = 2;
                            break;
                        }
                        // delimited data
                        value += m0;
                        state = 1;
                        break;

                        // delimiter found in delimited input
                    case 2:
                        // escaped delimiter?
                        if (m0 === delimiter) {
                            value += m0;
                            state = 1;
                            break;
                        }
                        // null value
                        if (m0 === separator) {
                            endOfValue();
                            break;
                        }
                        // skip un-delimited new-lines
                        if (m0 === '\n' || m0 === '\r') {
                            break;
                        }
                        // broken paser?
                        throw new Error('CSVDataError: Illegal State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');

                        // un-delimited input
                    case 3:
                        // null last value
                        if (m0 === separator) {
                            endOfValue();
                            break;
                        }
                        // skip un-delimited new-lines
                        if (m0 === '\n' || m0 === '\r') {
                            break;
                        }
                        // non-compliant data
                        if (m0 === delimiter) {
                            throw new Error('CSVDataError: Illegal Quote [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                        }
                        // broken parser?
                        throw new Error('CSVDataError: Illegal Data [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                    default:
                        // shenanigans
                        throw new Error('CSVDataError: Unknown State [Row:' + options.state.rowNum + '][Col:' + options.state.colNum + ']');
                }
                //console.log('val:' + m0 + ' state:' + state);
            });

            // submit the last value
            endOfValue();

            return entry;
        }
    },

    /**
     * $.csv.toArray(csv)
     * Converts a CSV entry string to a javascript array.
     *
     * @param {Array} csv The string containing the CSV data.
     * @param {Object} [options] An object containing user-defined options.
     * @param {Character} [separator] An override for the separator character. Defaults to a comma(,).
     * @param {Character} [delimiter] An override for the delimiter character. Defaults to a double-quote(").
     *
     * This method deals with simple CSV strings only. It's useful if you only
     * need to parse a single entry. If you need to parse more than one line,
     * use $.csv2Array instead.
     */
    toArray: function(csv, options, callback) {
        var me = this,
            config = Ext.apply(me.config, options);

        var state = (options.state !== undefined ? options.state : {});

        // setup
        var options = {
            delimiter: config.delimiter,
            separator: config.separator,
            onParseEntry: options.onParseEntry,
            onParseValue: options.onParseValue,
            state: state
        }

        var entry = me.parsers.parseEntry(csv, options);

        // push the value to a callback if one is defined
        if (!config.callback) {
            return entry;
        } else {
            config.callback('', entry);
        }
    },

    toObjects: function(csv, options, callback) {
        var me = this,
            options = (options !== undefined ? options : {}),
            config = Ext.apply(me.config, options);

        options.start = 'start' in options ? options.start : 1;

        // account for headers
        if (config.headers) {
            options.start++;
        }
        if (options.end && config.headers) {
            options.end++;
        }

        // setup
        var lines = [];
        var data = [];

        var options = {
            delimiter: config.delimiter,
            separator: config.separator,
            onParseEntry: options.onParseEntry,
            onParseValue: options.onParseValue,
            start: options.start,
            end: options.end,
            state: {
                rowNum: 1,
                colNum: 1
            },
            match: false
        };

        // fetch the headers
        var headerOptions = {
            delimiter: config.delimiter,
            separator: config.separator,
            start: 1,
            end: 1,
            state: {
                rowNum: 1,
                colNum: 1
            }
        }
        var headerLine = me.parsers.splitLines(csv, headerOptions);
        var headers = me.toArray(headerLine[0], options);

        // fetch the data
        var lines = me.parsers.splitLines(csv, options);

        // reset the state for re-use
        options.state.colNum = 1;
        if (headers) {
            options.state.rowNum = 2;
        } else {
            options.state.rowNum = 1;
        }

        // convert data to objects
        for (var i = 0, len = lines.length; i < len; i++) {
            var entry = me.toArray(lines[i], options);
            var object = {};
            for (var j in headers) {
                object[headers[j]] = entry[j];
            }
            data.push(object);

            // update row state
            options.state.rowNum++;
        }

        // push the value to a callback if one is defined
        if (!config.callback) {
            return data;
        } else {
            config.callback('', data);
        }
    }
});
