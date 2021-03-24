import { MiniGent } from "../minigent.js"


export const Types = {
    SPACE: "Space",
    LETTER: "Latin Alphabet",
    GREEK_LETTER: "Greek Alphabet",
    NUMERAL: "Numerals",
    PUNCTUATION: "Punctuation Marks",
    SMILEY: "Smileys",
    EMOJI: "Various Emojis",
    MATH: "Math Symbols",
    FRACTION: "Fraction",
    OPEN: "Open",
    CLOSE: "Close",
    SUBSCRIPT: "Subscript",
    SUPERSCRIPT: "Superscript",
    OVER: "Over",
    UNDER: "Under",
    // SQRT: "Squareroot",
    START: "Start",
    END: "End",
    FUNCTION: "Function"
};

export const SubTypes = {
    ROUND: "Round",
    CURLY: "Curly",
    SQUARE: "Square",
    ANGLE: "Angle",
    LINE: "Line",
    TILDE: "Tilde",
    BRACE: "Brace",
    ARROW: "Arrow",
    HAT: "Hat",
};

const Commands = {
    "\\left": Types.OPEN,
    "\\right": Types.CLOSE,
    "\\frac": Types.FRACTION,
    "\\overline": Types.OVER,
    "\\overtilde": Types.OVER,
    "\\overbrace": Types.OVER,
    "\\overarrow": Types.OVER,
    "\\overhat": Types.OVER,
    "\\underline": Types.UNDER,
    "\\undertilde": Types.UNDER,
    "\\underbrace": Types.UNDER,
    "\\underarrow": Types.UNDER,
    "\\underhat": Types.UNDER,
}

const Functions = [
    "\\cos", "\\sin", "\\tan",
    "\\cosh", "\\sinh", "\\tanh",
    "\\acos", "\\asin", "\\atan",
    "\\ln", "\\log", "\\ld", "\\exp",
    "\\sqrt", "\\sum", "\\prod", "\\int",
    "\\lim"
];

export const BracketLookup = {
    '(': SubTypes.ROUND,
    ')': SubTypes.ROUND,
    '{': SubTypes.CURLY,
    '}': SubTypes.CURLY,
    '[': SubTypes.SQUARE,
    ']': SubTypes.SQUARE,
    '<': SubTypes.ANGLE,
    '>': SubTypes.ANGLE,
};

Object.freeze( Types );
Object.freeze( SubTypes );
Object.freeze( Commands );
Object.freeze( Functions );
Object.freeze( BracketLookup );


export function isSymbol( type ) {
    return type in MiniGent;
}


export function isVariable( type ) {
    return [
        Types.LETTER,
        Types.GREEK_LETTER,
        Types.SMILEY,
        Types.EMOJI
    ].includes( type );
}


function keyType( key ) {
    if ( key in MiniGent[ Types.SMILEY ] ) return Types.SMILEY;
    if ( key in MiniGent[ Types.GREEK_LETTER ] ) return Types.GREEK_LETTER;
    if ( key in MiniGent[ Types.EMOJI ] ) return Types.EMOJI;
    if ( key in MiniGent[ Types.MATH ] ) return Types.MATH;
    if ( key in MiniGent[ Types.PUNCTUATION ] ) return Types.PUNCTUATION;
    return undefined;
}


export function tokenize( text, codes ) {

    let tokens = [];

    for ( let i = 0; i < text.length; i++ ) {

        const c = text[ i ];

        if ( c == ' ' ) { tokens.push( { type: Types.SPACE } ); continue; }
        else if ( c == '{' ) { tokens.push( { type: Types.START } ); continue; }
        else if ( c == '}' ) { tokens.push( { type: Types.END } ); continue; }
        else if ( c == '^' ) { tokens.push( { type: Types.SUPERSCRIPT } ); continue; }
        else if ( c == '_' ) { tokens.push( { type: Types.SUBSCRIPT } ); continue; }
        else if ( c == ':' ) {

            const res = findCode( text, Object.keys( codes ), i );

            if ( res ) {

                const key = res.substring( 1, res.length - 1 );
                const type = keyType( key );
                tokens.push( { type: type, data: key } );

                i += res.length - 1;
                continue;

            }

        }
        else if ( c == '\\' ) {

            //  tex commands

            let res = findCode( text, Object.keys( Commands ), i );

            if ( res ) {

                const key = res.substring( 1 );

                //  left/right
                if ( [ "left", "right" ].includes( key ) ) {
                    //  only valid if followed by actual brace symbol
                    const sym = text[ i + res.length ];
                    if ( sym in BracketLookup ) {
                        tokens.push( { type: Commands[ res ], data: sym, subtype: BracketLookup[ sym ] } );
                        i += res.length;
                        continue;
                    }
                }
                //  frac/over/under
                else {
                    let data = undefined;
                    if ( key.includes( "line" ) ) data = '-';
                    else if ( key.includes( "tilde" ) ) data = '~';
                    else if ( key.includes( "hat" ) ) data = '^';
                    else if ( key.includes( "brace" ) ) data = '{';
                    else if ( key.includes( "arrow" ) ) data = '>';
                    tokens.push( { type: Commands[ res ], data: data } );

                    i += res.length - 1;
                    continue;
                }

            }

            //  functions

            res = findCode( text, Functions, i );

            if ( res ) {
                const key = res.substring( 1 );
                tokens.push( { type: Types.FUNCTION, data: key } );
                i += res.length - 1;
                continue;
            }

            //  font commands (e.g. \alpha)

            res = findCode( text, Object.keys( codes ), i );

            if ( res ) {

                const key = res.substring( 1 );
                const type = keyType( key );
                tokens.push( { type: type, data: key } );

                i += res.length - 1;
                continue;

            }

            continue;

        }

        if ( c in MiniGent[ Types.LETTER ] ) tokens.push( { type: Types.LETTER, data: c } );
        else if ( c in MiniGent[ Types.NUMERAL ] ) tokens.push( { type: Types.NUMERAL, data: c } );
        else if ( c in MiniGent[ Types.PUNCTUATION ] ) tokens.push( { type: Types.PUNCTUATION, data: c } );
        else if ( c in MiniGent[ Types.MATH ] ) tokens.push( { type: Types.MATH, data: c } );

    }

    return tokens;

}


function isSubMatch( text, search, textStart = 0 ) {

    if ( textStart + search.length > text.length ) return false;

    for ( let i = 0; i < search.length; i++ ) {
        if ( text[ textStart + i ] !== search[ i ] ) return false;
    }

    return true;

}


function findCode( text, codes, textStart = 0 ) {
    return codes.find( code => isSubMatch( text, code, textStart ) );
}