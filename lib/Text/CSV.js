/*********************************************************************
 *********************************************************************
 **  Text.CSV                                                       **
 *********************************************************************
 *********************************************************************/
/*

=pod

=head1 NAME 

Text.CSV - Create and Parse CSV data.

=head1 Synopsis

var attr = { };
var my_csv = new Text.CSV(attr);

=cut

*/

/* Setup the Namespace */
if (typeof Text == "undefined") var Text = { };

/*********************************************************************
 *********************************************************************
 **  Text.CSV Constructor                                           **
 *********************************************************************
 *********************************************************************/
/* 

=pod 

=head2 Text.CSV()

var attr = { };
var my_csv = new Text.CSV(attr);

    Available options for attr:
        quote_char
            The char used for quoting fields containing blanks, by
            default the double quote character ("""). A value of undef
            suppresses quote chars. (For simple cases only).

        eol     
            An end-of-line string to add to rows, usually "undef"
            (nothing, default), "\012" (Line Feed) or "\015\012" (Car-
            riage Return, Line Feed)

        escape_char
            The char used for escaping certain characters inside quoted
            fields, by default the same character. (""")

        sep_char
            The char used for separating fields, by default a comme.
            (",")

        binary
            If this attribute is TRUE, you may use binary characters in
            quoted fields, including line feeds, carriage returns and
            NUL bytes. (The latter must be escaped as ""0".) By default
            this feature is off.

        always_quote
            By default the generated fields are quoted only, if they
            need to, for example, if they contain the separator. If you
            set this attribute to a TRUE value, then all fields will be
            quoted. This is typically easier to handle in external
            applications. (Poor creatures who aren’t using 
            Text::CSV_XS. :-)

=cut

*/
Text.CSV = function(attr) {
    this._STATUS      = undefined;
    this._ERROR_INPUT = undefined;
    this._STRING      = undefined;
    this._FIELDS      = undefined;

    // Lets be compatible with the perl module Text::CSV_XS, sort of.
    // Here is a list of all options in Text::CSV_XS,
    // var options = [ "quote_char", "eol", "escape_char", "sep_char", "binary", "types", "always_quote" ];    
    // Here are the ones we support.
    var options = [ "quote_char", "eol", "escape_char", "sep_char", "binary", "always_quote" ];
    this.quote_char   = "\042";
    this.eol          = "";
    this.escape_char  = "\042";
    this.sep_char     = ",";
    this.always_quote = 0;

    if (typeof attr == "object") {
        for (var i in attr) {
            for (var j = 0; j < options.length; j++) {
                if (i == options[j]) {
                    this[i] = attr[i];
                }
            }
        }
        if (this.quote_char != this.escape_char && attr['escape_char'] == undefined) {
            this.escape_char = this.quote_char;
        }
    }

    var text = "";
    for (var i in this) {
        if (typeof this[i] == "string" ||
            typeof this[i] == "number" ||
            typeof this[i] == "undefined") {
            text += i + ": [" + this[i] + "]\n";
        }
    }
};

Text.CSV.VERSION = '0.01';

/********************************************************************
* Function: version()
********************************************************************/
/*

=pod

=head2 version()

    var my_csv  = new Text.CSV();
    var version = my_csv.version();

    It returns the current module version.

=cut

*/
Text.CSV.prototype.version = function() {
    return Text.CSV.VERSION;
};

/********************************************************************
* Function: status()
********************************************************************/
/*

=pod

=head2 status()

    var my_csv = new Text.CSV();
    var status = my_csv.status();

    This object function returns success (or failure) of "combine()" or
    "parse()", whichever was called more recently.

=cut

*/
Text.CSV.prototype.status = function() {
    return this._STATUS;
};

/********************************************************************
* Function: error_input()
********************************************************************/
/*

=pod

=head2 error_input()

    var my_csv = new Text.CSV();
    var bad_argument = my_csv.error_input();

    This object function returns the erroneous argument (if it exists)
    of "combine()" or "parse()", whichever was called more recently.

=cut

*/
Text.CSV.prototype.error_input = function() {
    return this._ERROR_INPUT;
};

/********************************************************************
* Function: string()
********************************************************************/
/*

=pod

=head2 string()

    var my_csv = new Text.CSV();
    var line = my_csv.string();

    This object function returns the input to "parse()" or the resul-
    tant CSV string of "combine()", whichever was called more recently.

=cut

*/
Text.CSV.prototype.string = function() {
    return this._STRING;
};

/********************************************************************
* Function: fields()
********************************************************************/
/*

=pod

=head2 fields()

    var my_csv = new Text.CSV();
    var columns = my_csv->fields();

    This object function returns the input to "combine()" or the resul-
    tant decomposed fields of "parse()", whichever was called more
    recently.

=cut

*/
Text.CSV.prototype.fields = function() {
    if (typeof this._FIELDS == "object") {
        return this._FIELDS;
    }
    return undefined;
};

/********************************************************************
* Function: combine()
********************************************************************/
/*

=pod

=head2 combine()

    var my_csv = new Text.CSV();
    var status = $csv->combine(columns);

    This object function constructs a CSV string from the arguments,
    returning success or failure.  Failure can result from lack of
    arguments or an argument containing an invalid character.  Upon
    success, "string()" can be called to retrieve the resultant CSV
    string.  Upon failure, the value returned by "string()" is unde-
    fined and "error_input()" can be called to retrieve an invalid
    argument.

=cut

*/
Text.CSV.prototype.combine = function(part) {
    this._FIELDS      = part;
    this._ERROR_INPUT = undefined;
    this._STATUS      = 0;
    this._STRING      = '';

    var column      = '';
    var combination = '';
    var skip_comma  = 1;

    var quote_regex = new RegExp(this.quote_char);
    var valid_regex = /[^\t\040-\176]/;

    var space_regex = /\s/;

    // binary.. shrug
    if (this.binary) {
        valid_regex = /^./;
    }

    if (typeof part == "object" && part.length > 0) {
        // at least one argument was given for "combining"...
        for (var i = 0; i < part.length; i++) {
            column = part[i];

            if (valid_regex.test(column)) {
                // an argument contained an invalid character...
                this._ERROR_INPUT = column;
                return this._STATUS;
            }

            if (skip_comma) {
                // do not put a comma before the first argument...
                skip_comma = 0;
            } else {
                // do put a comma before all arguments except the first argument...
                combination += ',';
            }

            if (this.always_quote || space_regex.test(column)) {
                column.replace(quote_regex, this.escape_char + this.quote_char);

                combination += this.quote_char;
                combination += column;
                combination += this.quote_char;
            } else {
                combination += column;
            }
        }

        this._STRING = combination;
        this._STATUS = 1;

        // handle eol option.
        if (this.eol.length) {
            this._STRING += this.eol;
        }
    }

    return this._STATUS;
};

/********************************************************************
* Function: parse()
********************************************************************/
/*

=pod

=head2 parse()

    var my_csv = new Text.CSV();
    var status = $csv->parse(line);

    This object function decomposes a CSV string into fields, returning
    success or failure.  Failure can result from a lack of argument or
    the given CSV string is improperly formatted.  Upon success,
    "fields()" can be called to retrieve the decomposed fields .  Upon
    failure, the value returned by "fields()" is undefined and
    "error_input()" can be called to retrieve the invalid argument.

=cut

*/
Text.CSV.prototype.parse = function(string) {
    this._STRING      = string;
    this._FIELDS      = undefined;
    this._ERROR_INPUT = this._STRING;
    this._STATUS      = 0;

    if (this._STRING == undefined) {
        return this._STATUS;
    }

    var keep_biting = 1;
    var palatable   = 0;
    var line        = this._STRING;

    var nlregex    = /\n$/;
    var nlcrregex  = /\r\n$/;
    var chop_count = 0;
    if (nlregex.test(line)) {
        chop_count++;
    }
    if (nlcrregex.test(line)) {
        chop_count++;
    }
    if (chop_count > 0) {
        line = line.substr(0, line.length - chop_count);
    }

    var mouthful = '';
    var part     = [ ];

    // Javascript can't pass by Strings or Numbers by reference. To get around this
    // we need to pass everyting as an array.
    line        = [ line ];
    mouthful    = [ mouthful ];
    keep_biting = [ keep_biting ];

    while (keep_biting[0] && (palatable = this._bite(line, mouthful, keep_biting))) {
        part.push(mouthful[0]);
    }

    if (palatable) {
        this._ERROR_INPUT = undefined;
        this._FIELDS      = part;
        this._STATUS      = 1;
    }

    return this._STATUS;
};

/********************************************************************
* Function: _bite() ** INTERNAL ** used by parse()
********************************************************************/
Text.CSV.prototype._bite = function(line_ref, piece_ref, bite_again_ref) {
    var in_quotes = 0;
    var ok = 0;

    piece_ref[0]      = '';
    bite_again_ref[0] = 0;

    var single_quote_begin_regex     = new RegExp("^" + this.quote_char);
    var double_quote_begin_regex     = new RegExp("^" + this.escape_char + this.quote_char);
    var single_quote_comma_end_regex = new RegExp("^" + this.quote_char + this.sep_char);
    var comma_begin_regex            = new RegExp("^" + this.sep_char);
    var valid_regex                  = /^[\t\040-\176]/;

    // binary.. shrug
    if (this.binary) {
        valid_regex = /^./;
    }

    while (1) {
        if (line_ref[0].length < 1) {
            // end of string...
            if (in_quotes) {
                // end of string, missing closing double-quote...
                break;
            } else {
                // proper end of string...
                ok = 1;
                break;
            }
        } else if (single_quote_begin_regex.test(line_ref[0])) {
            // double-quote...
            if (in_quotes) {
                if (line_ref[0].length == 1) {
                    // closing double-quote at end of string...
                    line_ref[0] = '';
                    ok = 1;
                    break;
                } else if (double_quote_begin_regex.test(line_ref[0])) {
                    // an embedded double-quote...
                    piece_ref[0] += this.quote_char;
                    line_ref[0]   = line_ref[0].substr(2, line_ref[0].length - 1);
                } else if (single_quote_comma_end_regex.test(line_ref[0])) {
                    // closing double-quote followed by a comma...
                    line_ref[0] = line_ref[0].substr(2, line_ref[0].length - 1);
                    bite_again_ref[0] = 1;
                    ok = 1;
                    break;
                } else {
                    // double-quote, followed by undesirable character (bad character sequence)...
                    break;
                }
            } else {
                // Javascript can't have an empty string. It sets it to undefined.
                // Lets compensate fro that problem.
                if (piece_ref[0] == undefined || piece_ref[0].length < 1) {
                    in_quotes = 1;
                    line_ref[0] = line_ref[0].substr(1, line_ref[0].length - 1);
                } else {
                    // double-quote, outside of double-quotes (bad character sequence)...
                    break;
                }
            }
        } else if (comma_begin_regex.test(line_ref[0])) {
            // comma...
            if (in_quotes) {
                // a comma, inside double-quotes...
                piece_ref[0] += line_ref[0].substr(0 ,1);
                line_ref[0]   = line_ref[0].substr(1, line_ref[0].length - 1);
            } else {
                // a comma, which separates values...
                line_ref[0] = line_ref[0].substr(1, line_ref[0].length - 1);
                bite_again_ref[0] = 1;
                ok = 1;
                break;
            }
        } else if (valid_regex.test(line_ref[0])) {
            // a tab, space, or printable...
            piece_ref[0] += line_ref[0].substr(0, 1);
            line_ref[0]   = line_ref[0].substr(1, line_ref[0].length - 1);
        } else {
            // an undesirable character...
            break;
        }
    }

    return ok;
};

/*

=pod 

=head1 AUTHOR

Adam R. Schobelock <schobes@gmail.com>

=head1 COPYRIGHT

Copyright (c) 2006 by Teleperformance.

This program is free software; you can redistribute it and/or modify
it under the terms as Perl itself.

=cut

*/
