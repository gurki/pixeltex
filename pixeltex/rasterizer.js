import { GentFont } from '../font.js'
import * as Parser from './parser.js'
import * as Tokenizer from './tokenizer.js'
import BoundingRect from './boundingrect.js'


const spacing = 1;
const ignoreSpaces = true;


function createPixmapNode( nodeType ) {
    return {
        rect: new BoundingRect(),
        coords: [],
        children: [],
        nodeType: nodeType,
        tokenType: undefined,
    }
}


function rasterizeChildren( node ) {

    if ( ! node ) return undefined;
    let pixmap = createPixmapNode( node.type );
    let x = 0;
    let top = -1;
    let bottom = -1;

    for ( const child of node.children ) {

        if ( child.token && child.token.type === Tokenizer.Types.SPACE ) continue;

        const childPixmap = rasterize( child );
        if ( ! childPixmap ) continue;

        translateAll( childPixmap, x - childPixmap.rect.x, 0 );
        x += childPixmap.rect.width + spacing;

        top = childPixmap.rect.top;
        bottom = childPixmap.rect.bottom;

        console.log( node.type, child.type );

        pixmap.children.push( childPixmap );
        pixmap.rect.includeRect( childPixmap.rect );

    }

    if ( ignoreSpaces && pixmap.rect.empty ) {
        return undefined;
    }

    // layoutScripts( pixmap );
    return pixmap;

}


export function translateAll( node, dx, dy ) {
    if ( ! node ) return;
    node.rect.translate( dx, dy );
    for ( const child of node.children ) {
        translateAll( child, dx, dy );
    }
}


function removeTranslation( node ) {
    if ( ! node ) return;
    translateAll( node, -node.rect.x, -node.rect.y );
}


function rasterizeSymbol( node ) {

    const token = node.token;
    let pixmap = createPixmapNode( node.type );

    if ( token.type == Tokenizer.Types.SPACE ) {
        return pixmap;
    }

    //  invalid symbol
    if ( ! ( token.type in GentFont ) ) return pixmap;

    pixmap.tokenType = token.type;
    const letter = GentFont[ token.type ][ token.data ];

    if ( ! letter ) return pixmap;

    const cols = ( letter.bits.length >= 12 ) ? 3 : 2;
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


function rasterizeWord( node ) {
    return rasterizeChildren( node );
}


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


function rasterizeGroup( node ) {

    const pixmap = rasterizeChildren( node );

    if ( node.subtype === Tokenizer.SubTypes.ROUND ) {
        return wrapRoundBrackets( pixmap );
    }

    console.error( "bracket type", node.subtype, "not implemented yet" );
    return pixmap;

}


function rasterizeCommand( node ) {
    return undefined;
}


function rasterizeArgument( node ) {
    return rasterizeChildren( node );
}


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
    return pixmap;

}


function wrapOver( pixmap ) {
    pixmap.rect.miny -= 2;
    for ( let x = 0; x < pixmap.rect.width; x++ ) {
        pixmap.coords.push( { x: x, y: 0 } );
    }
    return pixmap;
}


function wrapUnder( pixmap ) {
    pixmap.rect.maxy += 2;
    for ( let x = 0; x < pixmap.rect.width; x++ ) {
        pixmap.coords.push( { x: x, y: pixmap.rect.height - 1 } );
    }
    return pixmap;
}


function rasterizeUnary( node ) {

    const pixmap = rasterizeChildren( node );
    const token = node.children[0].token
    const fn = token.data;


    if ( fn === "sqrt" ) return wrapSqrt( pixmap );
    if ( token.type === Tokenizer.Types.OVER ) return wrapOver( pixmap );
    if ( token.type === Tokenizer.Types.UNDER ) return wrapUnder( pixmap );

    console.log( node );
    if ( token.type === Tokenizer.Types.SUBSCRIPT ) return pixmap;
    if ( token.type === Tokenizer.Types.SUPERSCRIPT ) return pixmap;

    console.error( "function type", fn, "not implemented yet" );
    return pixmap;

}


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

    // pixmap.coords.push( { x: pixmap.rect.x, y: pixmap.rect.y } );

    for ( let lx = 0; lx < pixmap.rect.width; lx++ ) {
        pixmap.coords.push( { x: lx, y: ly } );
    }

    // pixmap.coords.push( { x: pixmap.rect.right, y: pixmap.rect.bottom } );
    translateAll( pixmap, 0, 2 - ly );

    return pixmap;

}


function rasterizeTerminal( node ) {
    return rasterizeChildren( node );
}


function rasterizeExpression( node ) {
    const exp = rasterizeChildren( node );
    removeTranslation( exp );
    return exp;
}


export function rasterize( node ) {
    if ( ! node ) return undefined;
    if ( node.type == Parser.NodeTypes.SYMBOL ) return rasterizeSymbol( node );
    if ( node.type == Parser.NodeTypes.WORD ) return rasterizeWord( node );
    if ( node.type == Parser.NodeTypes.ARGUMENT ) return rasterizeArgument( node );
    if ( node.type == Parser.NodeTypes.GROUP ) return rasterizeGroup( node );
    if ( node.type == Parser.NodeTypes.COMMAND ) return rasterizeCommand( node );
    if ( node.type == Parser.NodeTypes.UNARY ) return rasterizeUnary( node );
    if ( node.type == Parser.NodeTypes.FRACTION ) return rasterizeFraction( node );
    if ( node.type == Parser.NodeTypes.EXPRESSION ) return rasterizeExpression( node );
    if ( node.type == Parser.NodeTypes.TERMINAL ) return rasterizeTerminal( node );
    return undefined;
}