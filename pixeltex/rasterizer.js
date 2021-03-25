import { MiniGent } from '../font/minigent.js'
import * as Parser from './parser.js'
import * as Tokenizer from './tokenizer.js'
import BoundingRect from './boundingrect.js'


const spacing = 1;
const lineSpacing = 2;
const ignoreWhitespace = false;
const limits = true;

const VerticalScripts = [ "lim", "sum", "prod" ];
Object.freeze( VerticalScripts );


////////////////////////////////////////////////////////////////////////////////
function createPixmapNode( nodeType ) {
    return {
        rect: new BoundingRect(),
        coords: [],
        children: [],
        nodeType: nodeType,
        tokenType: undefined,
    }
}


////////////////////////////////////////////////////////////////////////////////
function hcenter( node ) {
    if ( ! node ) return;
    const dx = -Math.floor( 0.5 * node.rect.width ) - node.rect.x;
    translateAll( node, dx, 0 );
}


////////////////////////////////////////////////////////////////////////////////
function placeBelow( child, parent ) {
    const dx = parent.rect.hcenter - child.rect.hcenter;
    const dy = parent.rect.bottom - child.rect.miny + 2;
    translateAll( child, dx, dy );
}


////////////////////////////////////////////////////////////////////////////////
function placeAbove( child, parent ) {
    const dx = parent.rect.hcenter - child.rect.hcenter;
    const dy = parent.rect.top - child.rect.height - 2;
    translateAll( child, dx, dy );
}


////////////////////////////////////////////////////////////////////////////////
function placeRightOf( child, parent ) {
    const dx = parent.rect.maxx - child.rect.minx + 2;
    translateAll( child, dx, 0 );
}


////////////////////////////////////////////////////////////////////////////////
export function translateAll( node, dx, dy ) {
    if ( ! node ) return;
    node.rect.translate( dx, dy );
    for ( const child of node.children ) {
        translateAll( child, dx, dy );
    }
}


////////////////////////////////////////////////////////////////////////////////
function removeTranslation( node ) {
    if ( ! node ) return;
    translateAll( node, -node.rect.x, -node.rect.y );
}


////////////////////////////////////////////////////////////////////////////////
function rasterizeChildren( node ) {

    if ( ! node ) return undefined;
    let pixmap = createPixmapNode( node.type );
    let x = 0;

    for ( const child of node.children ) {

        if ( ignoreWhitespace && child.token && child.token.type === Tokenizer.Types.SPACE ) {
            continue;
        }

        const childPixmap = rasterize( child );
        if ( ! childPixmap ) continue;

        translateAll( childPixmap, x - childPixmap.rect.x, 0 );
        x += childPixmap.rect.width + spacing;

        pixmap.children.push( childPixmap );
        pixmap.rect.includeRect( childPixmap.rect );

    }

    if ( ignoreWhitespace && pixmap.rect.empty ) {
        return undefined;
    }

    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeToken( token ) {

    let pixmap = createPixmapNode( Parser.NodeTypes.SYMBOL );

    if ( token.type == Tokenizer.Types.SPACE ) {
        pixmap.rect.translate( 0, 2 );   //  move to baseline
        return pixmap;
    }

    //  invalid symbol
    if ( ! ( token.type in MiniGent ) ) return pixmap;

    pixmap.tokenType = token.type;

    const letter = (
        // ( token.data in MiniGent[ "Index Numbers" ] ) ? MiniGent[ "Index Numbers" ][ token.data ] :
        ( token.data in MiniGent[ token.type ] ) ? MiniGent[ token.type ][ token.data ] :
        undefined
    );

    if ( ! letter ) return pixmap;

    const cols = (
        ( letter.bits.length < 12 ) ? 2 :   //  2x4, 2x5
        ( letter.bits.length === 16 ) ? 4 : //  4x4 arrows
        ( letter.bits.length === 20 ) ? 5 : //  5x4 infinity
        3                                   //  3x4, 3x5
    );

    const rows = ( letter.bits.length / cols );

    for ( let dy = 0; dy < rows; dy++ ) {
        for ( let dx = 0; dx < cols; dx++ ) {
            const id = dy * cols + dx;
            if ( ! letter.bits[ id ] ) continue;
            pixmap.coords.push( { x: dx, y: dy} );
            pixmap.rect.include( dx, dy );
        }
    }

    const ox = pixmap.rect.x;
    const oy = pixmap.rect.y;
    pixmap.coords = pixmap.coords.map( c => { return { x: c.x - ox, y: c.y - oy }; } );
    pixmap.token = token;

    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeSymbol( node ) {
    return rasterizeToken( node.token );
}


////////////////////////////////////////////////////////////////////////////////
function rasterizeWord( node ) {
    return rasterizeChildren( node );
}


////////////////////////////////////////////////////////////////////////////////
function wrapRoundBrackets( pixmap ) {

    for ( const child of pixmap.children ) {
        translateAll( child, 3, 0 );
    }

    pixmap.rect.maxx += 6;
    pixmap.rect.maxy = Math.max( pixmap.rect.maxy, 3 );
    pixmap.rect.miny = Math.min( pixmap.rect.miny, 0 );

    pixmap.coords.push( { x: 1, y: 0 } );
    pixmap.coords.push( { x: pixmap.rect.right - 1, y: 0 } );

    for ( let y = 1; y < pixmap.rect.height - 1; y++ ) {
        pixmap.coords.push( { x: 0, y: y } );
        pixmap.coords.push( { x: pixmap.rect.right, y: y } );
    }

    pixmap.coords.push( { x: 1, y: pixmap.rect.height - 1 } );
    pixmap.coords.push( { x: pixmap.rect.right - 1, y: pixmap.rect.height - 1 } );

    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeGroup( node ) {

    const pixmap = rasterizeChildren( node );

    if ( node.subtype === Tokenizer.SubTypes.ROUND ) {
        return wrapRoundBrackets( pixmap );
    }

    console.error( "bracket type", node.subtype, "not implemented yet" );
    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeArgument( node ) {
    return rasterizeChildren( node );
}


////////////////////////////////////////////////////////////////////////////////
function wrapSqrt( pixmap ) {

    pixmap.rect.minx -= 3;
    pixmap.rect.miny -= 2;
    pixmap.rect.maxx += 1;

    for ( let x = 1; x < pixmap.rect.width; x++ ) {
        pixmap.coords.push( { x: x, y: 0 } );
    }

    for ( let y = 1; y < pixmap.rect.height; y++ ) {
        pixmap.coords.push( { x: 1, y: y } );
    }

    pixmap.coords.push( { x: 0, y: pixmap.rect.height - 2 } );
    pixmap.nodeType = Parser.NodeTypes.UNARY;
    pixmap.tokenType = Tokenizer.Types.SQRT;
    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function wrapOver( pixmap ) {
    pixmap.rect.miny -= 2;
    for ( let x = 0; x < pixmap.rect.width; x++ ) {
        pixmap.coords.push( { x: x, y: 0 } );
    }
    pixmap.nodeType = Parser.NodeTypes.UNARY;
    pixmap.tokenType = Tokenizer.Types.OVER;
    return pixmap;
}


////////////////////////////////////////////////////////////////////////////////
function wrapUnder( pixmap ) {
    pixmap.rect.maxy += 2;
    for ( let x = 0; x < pixmap.rect.width; x++ ) {
        pixmap.coords.push( { x: x, y: pixmap.rect.height - 1 } );
    }
    pixmap.nodeType = Parser.NodeTypes.UNARY;
    pixmap.tokenType = Tokenizer.Types.UNDER;
    return pixmap;
}


////////////////////////////////////////////////////////////////////////////////
function setChildType( node, type ) {

    if ( node.children.length === 0 ) {
        node.tokenType = type;
        return;
    }

    for ( const child of node.children ) {
        setChildType( child, type );
    }

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeUnaryNoArg( node ) {

    if ( node.subtype === "sum" ) {
        const token = { type: Tokenizer.Types.GREEK_LETTER, data: "Sigma" };
        token.tokenType = Tokenizer.Types.FUNCTION;
        return rasterizeToken( token );
    }
    else if ( node.subtype === "prod" ) {
        const token = { type: Tokenizer.Types.GREEK_LETTER, data: "Pi" };
        token.tokenType = Tokenizer.Types.FUNCTION;
        return rasterizeToken( token );
    }
    else if ( node.subtype === "int" ) {

        let pixmap = createPixmapNode( Tokenizer.Types.FUNCTION );
        pixmap.rect.maxx = 2;
        pixmap.rect.miny =-1;
        pixmap.rect.maxy = 5;

        for ( let y = 1; y < pixmap.rect.height - 1; y++ ) {
            pixmap.coords.push( { x: 1, y: y } );
        }

        pixmap.coords.push( { x: pixmap.rect.width - 1, y: 0 } );
        pixmap.coords.push( { x: 0, y: pixmap.rect.height - 1 } );
        return pixmap;

    } else {

        const tokens = [...node.subtype].map( c => { return { type: Tokenizer.Types.LETTER, data: c }; } );

        let pixmap = createPixmapNode( Parser.NodeTypes.UNARY );

        for ( const token of tokens ) {

            const tokenPixmap = rasterizeToken( token );
            tokenPixmap.tokenType = Tokenizer.Types.FUNCTION;

            placeRightOf( tokenPixmap, pixmap );
            pixmap.children.push( tokenPixmap );
            pixmap.rect.includeRect( tokenPixmap.rect );

        }

        translateAll( pixmap, -pixmap.rect.minx, 0 );
        return pixmap;

    }

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeUnary( node ) {

    const argPixmap = ( node.children.length > 0 ) ? rasterize( node.children[0] ) : undefined;

    if ( node.subtype === "sqrt" ) {
        if ( argPixmap ) return wrapSqrt( argPixmap );
        return rasterizeToken( { type: Tokenizer.Types.MATH, data: "sqrt" } );
    }

    if ( node.subtype === Tokenizer.Types.OVER ) return wrapOver( argPixmap );
    if ( node.subtype === Tokenizer.Types.UNDER ) return wrapUnder( argPixmap );

    if ( Tokenizer.Functions.includes( '\\' + node.subtype ) && node.subtype !== "sqrt" ) {

        const pixmap = rasterizeUnaryNoArg( node );

        if ( argPixmap ) {
            translateAll( argPixmap, pixmap.rect.width + 1 - argPixmap.rect.minx, 0 );
            pixmap.children.push( argPixmap );
            pixmap.rect.includeRect( argPixmap.rect );
        }

        return pixmap;

    }

    console.error( "function type", node.subtype, "not implemented yet" );
    return argPixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeScript( node ) {

    const subtype = node.children[0].subtype;

    const pixmap = createPixmapNode( Parser.NodeTypes.SCRIPT );
    const base = rasterize( node.children[0] );
    const arg1 = rasterizeChildren( node.children[1] );
    const arg2 = rasterizeChildren( node.children[2] );

    pixmap.rect.includeRect( base.rect );
    pixmap.children.push( base );

    let sup = undefined;
    let sub = undefined;

    sub = ( node.children[1].type === Parser.NodeTypes.SUB ) ? arg1 : arg2;
    sup = ( sub === arg1 ) ? arg2 : arg1;

    const w = pixmap.rect.width;
    const top = pixmap.rect.top;
    const bottom = pixmap.rect.bottom;
    const useLimits = limits && VerticalScripts.includes( subtype );

    if ( sub ) {
        if ( useLimits ) placeBelow( sub, pixmap );
        else translateAll( sub, w + 1, bottom - sub.rect.miny );
        pixmap.children.push( sub );
        pixmap.rect.includeRect( sub.rect );
    }

    if ( sup ) {
        if ( useLimits ) placeAbove( sup, pixmap );
        else translateAll( sup, w + 1, top - sup.rect.height - sup.rect.miny + 1 );
        pixmap.children.push( sup );
        pixmap.rect.includeRect( sup.rect );
    }

    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeFraction( node ) {

    const nom = rasterizeArgument( node.children[0] );
    const den = rasterizeArgument( node.children[1] );

    if ( ! nom || ! den ) return;

    removeTranslation( nom );
    removeTranslation( den );
    translateAll( den, 0, nom.rect.height + 3 );

    let pixmap = createPixmapNode( node.type );
    pixmap.rect.maxx = 1 + Math.max( nom.rect.width, den.rect.width );
    pixmap.rect.maxy = nom.rect.height + 2 + den.rect.height;
    pixmap.rect.count = 8;

    translateAll( nom, Math.ceil( 0.5 * ( pixmap.rect.width - nom.rect.width )), 0 );
    translateAll( den, Math.ceil( 0.5 * ( pixmap.rect.width - den.rect.width )), 0 );
    pixmap.children.push( nom );
    pixmap.children.push( den );

    const ly = nom.rect.height + 1;

    for ( let lx = 0; lx < pixmap.rect.width; lx++ ) {
        pixmap.coords.push( { x: lx, y: ly } );
    }

    translateAll( pixmap, 0, 2 - ly );
    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
function rasterizeExpression( node ) {
    const exp = rasterizeChildren( node );
    removeTranslation( exp );
    return exp;
}


////////////////////////////////////////////////////////////////////////////////
function rasterizeLines( node ) {

    const pixmap = createPixmapNode( Parser.NodeTypes.LINES );

    for ( const child of node.children ) {

        const childPixmap = rasterize( child );
        hcenter( childPixmap );
        placeBelow( childPixmap, pixmap );
        childPixmap.rect.maxy += lineSpacing - 1;

        //  empty line
        if ( child.children.length === 0 ) {
            childPixmap.rect.maxy += 2;
        }

        pixmap.children.push( childPixmap );
        pixmap.rect.includeRect( childPixmap.rect );

    }

    return pixmap;

}


////////////////////////////////////////////////////////////////////////////////
export function rasterize( node ) {
    if ( ! node ) return undefined;
    if ( node.type == Parser.NodeTypes.SYMBOL ) return rasterizeSymbol( node );
    if ( node.type == Parser.NodeTypes.WORD ) return rasterizeWord( node );
    if ( node.type == Parser.NodeTypes.ARGUMENT ) return rasterizeArgument( node );
    if ( node.type == Parser.NodeTypes.GROUP ) return rasterizeGroup( node );
    if ( node.type == Parser.NodeTypes.UNARY ) return rasterizeUnary( node );
    if ( node.type == Parser.NodeTypes.SCRIPT ) return rasterizeScript( node );
    if ( node.type == Parser.NodeTypes.FRACTION ) return rasterizeFraction( node );
    if ( node.type == Parser.NodeTypes.EXPRESSION ) return rasterizeExpression( node );
    if ( node.type == Parser.NodeTypes.LINES ) return rasterizeLines( node );
    return undefined;
}