import { GentFont } from "./font.js"


const Types = {
    RESERVED: "Reserved",
    LETTER: "Latin Alphabet",
    GREEK_LETTER: "Greek Alphabet",
    NUMERAL: "Numerals",
    PUNCTUATION: "Punctuation Marks",
    SMILEY: "Smileys",
    EMOJI: "Various Emojis",
    MATH: "Math Symbols",
    INDEX_LETTERS: "Index Letters",
    INDEX_NUMERALS: "Index Numerals",
};

Object.freeze( Types );


function keyType( key ) {
    if ( key in GentFont[ Types.SMILEY ] ) return Types.SMILEY;
    if ( key in GentFont[ Types.GREEK_LETTER ] ) return Types.GREEK_LETTER;
    if ( key in GentFont[ Types.EMOJI ] ) return Types.EMOJI;
    if ( key in GentFont[ Types.MATH ] ) return Types.MATH;
    return undefined;
}


export function tokenize( text, codes ) {

    let tokens = [];

    for ( let i = 0; i < text.length; i++ ) {

        const c = text[ i ];

        if ( c == ':' ) {

            const res = findCode( text, Object.keys( codes ), i );

            if ( res ) {

                const key = res.substring( 1, res.length - 1 );
                const type = keyType( key );
                tokens.push( { type: type, data: key } );

                i += codes.length;
                continue;

            }

        }

        if ( c == '\\' ) {
            //  look for code
        }

        if ( c in GentFont[ Types.LETTER ] ) {
            tokens.push( { type: Types.LETTER, data: c } );
        }
        else if ( c in GentFont[ Types.NUMERAL ] ) {
            tokens.push( { type: Types.NUMERAL, data: c } );
        }
        else if ( c in GentFont[ Types.PUNCTUATION ] ) {
            tokens.push( { type: Types.PUNCTUATION, data: c } );
        }
        else if ( c in GentFont[ Types.MATH ] ) {
            tokens.push( { type: Types.MATH, data: c } );
        }

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