import * as Tokenizer from './tokenizer.js'


export const NodeTypes = {
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

export const SymbolTypes = [
    Tokenizer.Types.LETTER,
    Tokenizer.Types.GREEK_LETTER,
    Tokenizer.Types.NUMERAL,
    Tokenizer.Types.PUNCTUATION,
    Tokenizer.Types.SMILEY,
    Tokenizer.Types.EMOJI,
    Tokenizer.Types.MATH,
    Tokenizer.Types.SPACE
];

export const CommandTypes = [
    Tokenizer.Types.FUNCTION,
    Tokenizer.Types.SUBSCRIPT,
    Tokenizer.Types.SUPERSCRIPT,
    Tokenizer.Types.OVER,
    Tokenizer.Types.UNDER,
];

Object.freeze( NodeTypes );
Object.freeze( SymbolTypes );
Object.freeze( CommandTypes );


let id = 0;
let currNode = undefined;

function createNode( type, parent=undefined ) {
    return {
        type: type,
        parent: parent,
        children: [],
    };
}


function accept( tokens, type, subtype=undefined, nodeType=undefined ) {

    if ( id >= tokens.length ) return false;

    const token = tokens[id];

    if ( ( token.type == type ) && ( ! subtype || token.subtype === subtype ) ) {

        if ( nodeType ) {
            const child = createNode( nodeType, currNode );
            child.token = tokens[id];
            if ( subtype ) child.subtype = subtype;
            currNode.children.push( child );
        }

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

    console.error( "expected token:", type, token, id, subtype );
    return false;

}


function symbol( tokens ) {
    const res = SymbolTypes.some( type => accept( tokens, type, undefined, NodeTypes.SYMBOL ) );
    // if ( res ) console.log( "symbol", id );
    return res;
}


function word( tokens ) {

    const wordNode = createNode( NodeTypes.WORD, currNode );
    currNode = wordNode;

    if ( ! symbol( tokens ) ) {
        currNode = wordNode.parent;
        return false;
    }

    while ( symbol( tokens ) ) {}
    currNode = currNode.parent;
    currNode.children.push( wordNode );

    // console.log( "word", id );
    return true;
}


function argument( tokens ) {

    if ( ! accept( tokens, Tokenizer.Types.START ) ) return false;

    const argNode = createNode( NodeTypes.ARGUMENT, currNode );
    // console.log( argNode, currNode );
    currNode.children.push( argNode );
    currNode = argNode;

    const nonempty = expression( tokens );
    currNode = currNode.parent;

    if ( expect( tokens, Tokenizer.Types.END ) ) {
        // if ( nonempty ) console.log( "argument", id );
        // else console.log( "empty argument", id );
        return true;
    }

    return false;

}


function group( tokens ) {

    if ( id >= tokens.length ) return false;
    if ( ! tokens[id].subtype ) return false;

    const subtype = tokens[id].subtype;

    if ( ! accept( tokens, Tokenizer.Types.OPEN, subtype, NodeTypes.GROUP ) ) {
        return false;
    }

    currNode = currNode.children[ currNode.children.length - 1 ];
    const nonempty = expression( tokens );
    currNode = currNode.parent;

    if ( expect( tokens, Tokenizer.Types.CLOSE, subtype ) ) {
        // if ( nonempty ) console.log( "group", id );
        // else console.log( "empty group", id );
        return true;
    }

    return false;

}


function command( tokens ) {
    const res = CommandTypes.some( type => accept( tokens, type, undefined, NodeTypes.COMMAND ) );
    // if ( res ) console.log( "command", id );
    return res;
}


function unary( tokens ) {

    const unaryNode = createNode( NodeTypes.UNARY, currNode );
    currNode = unaryNode;

    if ( ! command( tokens ) ) {
        currNode = currNode.parent;
        return false;
    }

    let res = false;
    if ( argument( tokens ) ) { res = true; }
    else if ( symbol( tokens ) ) { res = true };

    currNode = currNode.parent;
    currNode.children.push( unaryNode );

    // if ( res ) console.log( "unary", id );
    return res;

}


function fraction( tokens ) {

    if ( ! accept( tokens, Tokenizer.Types.FRACTION, undefined, NodeTypes.FRACTION ) ) {
        return false;
    }

    // console.log( "fraction", id );

    currNode = currNode.children[ currNode.children.length - 1 ];
    let res = argument( tokens );
    res &= argument( tokens );
    currNode = currNode.parent;

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
    // if ( res ) console.log( "terminal", id );
    return res;
}


function expression( tokens ) {
    if ( ! terminal( tokens ) ) return false;
    // console.log( "expression", id );
    while ( terminal( tokens ) ) {}
    return true;
}


export function parse( tokens ) {

    // console.log( "buildAST", tokens );
    id = 0;
    currNode = createNode( NodeTypes.EXPRESSION );

    if ( ! expression( tokens ) ) {
        console.error( "couldn't parse expression" );
        return undefined;
    }

    return currNode;

}


export function toString( node, indent=0 ) {

    if ( ! node ) return '';

    const spacing = ' '.repeat( indent );
    let str = spacing + node.type;
    if ( node.subtype ) str += "(" + node.subtype + ")";
    else if ( node.type == NodeTypes.COMMAND ) str += "(" + node.token.type + ")";
    else if ( node.token && node.token.data ) str += "(" + node.token.data + ")";
    else if ( node.type != NodeTypes.FRACTION && node.token && node.token.type ) str += "(" + node.token.type + ")";

    if ( node.children.length === 0 ) return str;

    str += " -> [ \n";
    for ( let i = 0; i < node.children.length; i++ ) {
        str += toString( node.children[i], indent + 2 );
        if ( i < node.children.length - 1 ) str += ",\n";
    }
    str += "\n" + spacing + "]";

    return str;
}