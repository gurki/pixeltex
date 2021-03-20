import { GentFont, Sets } from "./font.js"


export const Types = {
    SPACE: "Space",
    SYMBOL: "Symbol",
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
    START: "Start",
    END: "End",
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

const Braces = [ '{', '}', '(', ')', '[', ']', '<', '>' ]

Object.freeze( Types );
Object.freeze( Commands );
Object.freeze( Braces );


export function isSymbol( type ) {
    return type in GentFont;
}


function keyType( key ) {
    if ( key in GentFont[ Types.SMILEY ] ) return Types.SMILEY;
    if ( key in GentFont[ Types.GREEK_LETTER ] ) return Types.GREEK_LETTER;
    if ( key in GentFont[ Types.EMOJI ] ) return Types.EMOJI;
    if ( key in GentFont[ Types.MATH ] ) return Types.MATH;
    if ( key in GentFont[ Types.PUNCTUATION ] ) return Types.PUNCTUATION;
    return undefined;
}


export function tokenize( text, codes ) {

    let tokens = [];

    for ( let i = 0; i < text.length; i++ ) {

        const c = text[ i ];

        if ( c == ' ' ) { tokens.push( { type: Types.SPACE, data: ' ' } ); continue; }
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
                    if ( Braces.includes( sym ) ) {
                        tokens.push( { type: Commands[ res ], data: sym } );
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

        if ( c in GentFont[ Types.LETTER ] ) tokens.push( { type: Types.LETTER, data: c } );
        else if ( c in GentFont[ Types.NUMERAL ] ) tokens.push( { type: Types.NUMERAL, data: c } );
        else if ( c in GentFont[ Types.PUNCTUATION ] ) tokens.push( { type: Types.PUNCTUATION, data: c } );
        else if ( c in GentFont[ Types.MATH ] ) tokens.push( { type: Types.MATH, data: c } );

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