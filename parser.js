import * as Tokenizer from './tokenizer.js'


let id = 0;
let node = undefined;


function createNode( parent = undefined, children = [], token = undefined ) {
    return { parent: parent, children: children, token: token }
}

const NodeTypes = {
    SYMBOL: "Symbol",
    WORD: "Word",
    ARGUMENT: "Argument",
    GROUP: "Group",
    COMMAND: "Command",
    UNARY: "Unary",
    FRACTION: "Fraction",
    EXPRESSION: "Expression",
    TERMINAL: "Terminal"
}

const SymbolTypes = [
    Tokenizer.Types.LETTER,
    Tokenizer.Types.GREEK_LETTER,
    Tokenizer.Types.NUMERAL,
    Tokenizer.Types.PUNCTUATION,
    Tokenizer.Types.SMILEY,
    Tokenizer.Types.EMOJI,
    Tokenizer.Types.MATH,
    Tokenizer.Types.SPACE
];

const CommandTypes = [
    Tokenizer.Types.FUNCTION,
    Tokenizer.Types.SUBSCRIPT,
    Tokenizer.Types.SUPERSCRIPT,
    Tokenizer.Types.OVER,
    Tokenizer.Types.UNDER,
];

Object.freeze( SymbolTypes );
Object.freeze( CommandTypes );


function accept( tokens, type, subtype=undefined ) {

    if ( id >= tokens.length ) return false;

    const token = tokens[id];

    if ( ( token.type == type ) && ( ! subtype || token.subtype === subtype ) ) {
        node.children.push( createNode( node, [], token ) );
        id += 1;
        return true;
    }

    return false;

}


function expect( tokens, type, subtype=undefined ) {
    const token = tokens[id];
    if ( accept( tokens, type, subtype ) ) {
        return true;
    }
    console.error( "unexpected token:", token, id, type, subtype );
    return false;
}


function symbol( tokens ) {
    const res = SymbolTypes.some( type => accept( tokens, type ) );
    if ( res ) console.log( "symbol", id );
    return res;
}


function word( tokens ) {
    if ( ! symbol( tokens ) ) return false;
    while ( symbol( tokens ) ) {}
    console.log( "word", id );
    return true;
}


function argument( tokens ) {

    if ( ! accept( tokens, Tokenizer.Types.START ) ) return false;

    node = node.children[ node.children.length - 1 ];
    const nonempty = expression( tokens );
    node = node.parent;

    if ( expect( tokens, Tokenizer.Types.END ) ) {
        if ( nonempty ) console.log( "argument", id );
        else console.log( "empty argument", id );
        return true;
    }

    return false;

}


function group( tokens ) {

    if ( id >= tokens.length ) return false;
    if ( ! tokens[id].subtype ) return false;

    const subtype = tokens[id].subtype;
    if ( ! accept( tokens, Tokenizer.Types.OPEN, subtype ) ) return false;

    node = node.children[ node.children.length - 1 ];
    const nonempty = expression( tokens );
    node = node.parent;

    if ( expect( tokens, Tokenizer.Types.CLOSE, subtype ) ) {
        if ( nonempty ) console.log( "group", id );
        else console.log( "empty group", id );
        return true;
    }

    return false;

}


function command( tokens ) {
    const res = CommandTypes.some( type => accept( tokens, type ) );
    if ( res ) console.log( "command", id );
    return res;
}


function unary( tokens ) {
    if ( ! command( tokens ) ) return false;
    console.log( "unary", id );
    node = node.children[ node.children.length - 1 ];
    let res = false;
    if ( argument( tokens ) ) { res = true; }
    else if ( symbol( tokens ) ) { res = true };
    node = node.parent;
    return res;
}


function fraction( tokens ) {
    if ( ! accept( tokens, Tokenizer.Types.FRACTION ) ) return false;
    console.log( "fraction", id );
    node = node.children[ node.children.length - 1 ];
    let res = argument( tokens );
    node = node.parent;
    node = node.children[ node.children.length - 1 ];
    res &= argument( tokens );
    node = node.parent;
    return res;
}


function terminal( tokens ) {
    if ( id >= tokens.length ) return false;
    let res = false;
    if ( word( tokens ) ) res = true;
    else if ( argument( tokens ) ) res = true;
    else if ( group( tokens ) ) res = true;
    else if ( unary( tokens ) ) res = true;
    else if ( fraction( tokens ) ) res = true;
    if ( res ) console.log( "terminal", id );
    return res;
}


function expression( tokens ) {
    if ( ! terminal( tokens ) ) return false;
    console.log( "expression", id );
    while ( terminal( tokens ) ) {}
    return true;
}


export function buildAST( tokens ) {

    console.log( "buildAST", tokens );
    id = 0;
    node = createNode();

    if ( ! expression( tokens ) ) {
        console.log( "couldn't parse expression" );
        return undefined;
    }

    return node;

}