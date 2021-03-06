import * as Tokenizer from './tokenizer.js'


export const NodeTypes = {
    SYMBOL: "Symbol",
    WORD: "Word",
    ARGUMENT: "Argument",
    GROUP: "Group",
    UNARY: "Unary",
    SUB: "Sub",
    SUP: "Sup",
    SCRIPT: "Script",
    FRACTION: "Fraction",
    EXPRESSION: "Expression",
    LINES: "Lines",
}

export const SymbolTypes = [
    Tokenizer.Types.LETTER,
    Tokenizer.Types.GREEK_LETTER,
    Tokenizer.Types.NUMERAL,
    Tokenizer.Types.PUNCTUATION,
    Tokenizer.Types.SMILEY,
    Tokenizer.Types.EMOJI,
    Tokenizer.Types.MATH,
    Tokenizer.Types.LOGIC,
    Tokenizer.Types.GEOMETRY,
    Tokenizer.Types.CURRENCY,
    Tokenizer.Types.SPACE,
];

export const CommandTypes = [
    Tokenizer.Types.FUNCTION,
    Tokenizer.Types.OVER,
    Tokenizer.Types.UNDER,
];

Object.freeze( NodeTypes );
Object.freeze( SymbolTypes );
Object.freeze( CommandTypes );


let id = 0;
let currNode = undefined;


////////////////////////////////////////////////////////////////////////////////
function createNode( type, parent=undefined ) {
    return {
        type: type,
        parent: parent,
        children: [],
    };
}


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
function expect( tokens, type, subtype=undefined ) {

    const token = tokens[id];

    if ( accept( tokens, type, subtype ) ) {
        return true;
    }

    console.error( "expected token:", type, token, id, subtype );
    return false;

}


////////////////////////////////////////////////////////////////////////////////
function symbol( tokens ) {
    const res = SymbolTypes.some( type => accept( tokens, type, undefined, NodeTypes.SYMBOL ) );
    // if ( res ) console.log( "symbol", id );
    return res;
}


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
function operand( tokens ) {
    if ( id >= tokens.length ) return false;
    let res = false;
    if ( symbol( tokens ) ) res = true;
    else if ( argument( tokens ) ) res = true;
    // if ( res ) console.log( "operand", id );
    return res;
}


////////////////////////////////////////////////////////////////////////////////
function unary( tokens ) {

    if ( id >= tokens.length ) return false;

    const data = tokens[id].data;
    const command = CommandTypes.find( type => accept( tokens, type, undefined ) );

    if ( ! command ) {
        return false;
    }

    let unaryNode = createNode( NodeTypes.UNARY, currNode );
    unaryNode.subtype = ( command === Tokenizer.Types.FUNCTION ) ? data : command;
    currNode = unaryNode;

    let res = false;
    if ( operand( tokens ) ) res = true;

    currNode = currNode.parent;
    currNode.children.push( unaryNode );

    // if ( res ) console.log( "unary", id );
    return true;

}


////////////////////////////////////////////////////////////////////////////////
function subscript( tokens ) {

    if ( ! accept( tokens, Tokenizer.Types.SUBSCRIPT ) ) {
        return false;
    }

    const subNode = createNode( NodeTypes.SUB, currNode );
    currNode = subNode;

    if ( ! operand( tokens ) ) {
        currNode = currNode.parent;
        return false;
    }

    currNode = currNode.parent;
    currNode.children.push( subNode );
    return true;

}


////////////////////////////////////////////////////////////////////////////////
function superscript( tokens ) {

    if ( ! accept( tokens, Tokenizer.Types.SUPERSCRIPT ) ) {
        return false;
    }

    const supNode = createNode( NodeTypes.SUP, currNode );
    currNode = supNode;

    if ( ! operand( tokens ) ) {
        currNode = currNode.parent;
        return false;
    }

    currNode = currNode.parent;
    currNode.children.push( supNode );
    return true;

}


////////////////////////////////////////////////////////////////////////////////
function base( tokens ) {

    let res = false;
    if ( word( tokens ) ) res = true;
    else if ( argument( tokens ) ) res = true;
    else if ( group( tokens ) ) res = true;
    else if ( fraction( tokens ) ) res = true;
    else if ( unary( tokens ) ) res = true;
    return res;

}


////////////////////////////////////////////////////////////////////////////////
function script( tokens ) {

    const currId = id;
    const scriptNode = createNode( NodeTypes.SCRIPT, currNode );
    currNode = scriptNode;

    if ( ! base( tokens ) ) {
        id = currId;
        currNode = currNode.parent;
        return false;
    }


    if ( subscript( tokens ) ) {
        superscript( tokens );
    }
    else if ( superscript( tokens ) ) {
        subscript( tokens );
    }
    else {
        id = currId;
        currNode = currNode.parent;
        return false;
    }

    currNode = currNode.parent;
    currNode.children.push( scriptNode );
    return true;

}


////////////////////////////////////////////////////////////////////////////////
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


////////////////////////////////////////////////////////////////////////////////
function terminal( tokens ) {
    if ( id >= tokens.length ) return false;
    let res = false;
    if ( script( tokens ) ) res = true;
    else if ( word( tokens ) ) res = true;
    else if ( argument( tokens ) ) res = true;
    else if ( group( tokens ) ) res = true;
    else if ( fraction( tokens ) ) res = true;
    else if ( unary( tokens ) ) res = true;
    return res;
}


////////////////////////////////////////////////////////////////////////////////
function expression( tokens ) {
    if ( ! terminal( tokens ) ) return false;
    // console.log( "expression", id );
    while ( terminal( tokens ) ) {}
    return true;
}


////////////////////////////////////////////////////////////////////////////////
function lines( tokens ) {

    const lineNode = createNode( NodeTypes.EXPRESSION, currNode );
    currNode = lineNode;

    if ( ! expression( tokens ) ) {

        //  empty line
        if ( accept( tokens, Tokenizer.Types.BREAK ) ) {
            currNode = currNode.parent;
            currNode.children.push( lineNode );
            return true;
        }

        currNode = currNode.parent;
        return false;
    }

    if ( ! accept( tokens, Tokenizer.Types.BREAK ) ) {}

    currNode = currNode.parent;
    currNode.children.push( lineNode );

    while ( lines( tokens ) ) {}
    return true;

}


////////////////////////////////////////////////////////////////////////////////
export function parse( tokens ) {

    if ( ! tokens ) return undefined;
    // console.log( "buildAST", tokens );
    id = 0;
    currNode = createNode( NodeTypes.LINES );
    if ( tokens.length === 0 ) return currNode;

    if ( ! lines( tokens ) ) {
        console.error( "couldn't parse expression" );
        return undefined;
    }

    return currNode;

}


////////////////////////////////////////////////////////////////////////////////
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