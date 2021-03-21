import * as Tokenizer from './tokenizer.js'


function createNode( parent = undefined, children = [], token = undefined ) {
    return { parent: parent, children: children, token: token }
}


function parseEnclosing( tokens, start, parent ) {

    if ( start >= tokens.length ) return;
    if ( tokens[start].type != Tokenizer.Types.OPEN ) {
        console.error( "missing binary function open" );
    }

    const res = parse( tokens, start + 1, parent );

    if ( res < 0 ) {
        console.error( "missing binary function close" );
    }

    return res;

}


function parse( tokens, start, parent, untilClosing = true ) {

    for ( let i = start; i < tokens.length; i++ ) {

        const token = tokens[i];

        if ( untilClosing && token.type == Tokenizer.Types.CLOSE ) {
            return i;
        }

        if ( token.type === Tokenizer.Types.OPEN ) {
            i = parseEnclosing( tokens, i, parent );
            continue;
        }

        if ( Tokenizer.isSymbol( token.type ) || token.type == Tokenizer.Types.SPACE ) {
            parent.children.push( createNode( parent, [], token ));
            continue;
        }

        if ( token.type == Tokenizer.Types.FRACTION ) {
            let frac = createNode( parent, [], token );
            let left = createNode( frac );
            let right = createNode( frac );
            i = parseEnclosing( tokens, i + 1, left );
            i = parseEnclosing( tokens, i + 1, right );
            parent.children.push( frac );
            parent = frac;
            continue;
        }

    }
}


export function buildAST( tokens ) {

    let root = createNode();
    const i = parse( tokens, 0, root, false );

    if ( i + 1 < tokens.length ) {
        console.log( "couldn't parse expression" );
        return undefined;
    }

    return root;

}