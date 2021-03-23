export default class BoundingRect {

    constructor( x=0, y=0, width=0, height=0 ) {
        this.minx = x;
        this.miny = y;
        this.maxx = x + width;
        this.maxy = y + height;
        this.count = 0;
    }

    get x() { return this.minx; }
    get y() { return this.miny; }
    get width() { return this.maxx - this.minx + 1; }   //  pixel width
    get height() { return this.maxy - this.miny + 1; }  //  pixel height

    get left() { return this.minx; }
    get right() { return this.maxx; }
    get top() { return this.miny; }
    get bottom() { return this.maxy; }
    get empty() { return this.count === 0; }
    get hcenter() { return Math.floor( 0.5 * ( this.minx + this.maxx )); }
    get vcenter() { return Math.floor( 0.5 * ( this.miny + this.maxy )); }

    include( x, y ) {

        if ( this.empty ) {
            this.minx = x;
            this.miny = y;
            this.maxx = x;
            this.maxy = y;
            this.count += 1;
            return;
        }

        this.minx = Math.min( x, this.minx );
        this.miny = Math.min( y, this.miny );
        this.maxx = Math.max( x, this.maxx );
        this.maxy = Math.max( y, this.maxy );
        this.count += 1;

    }

    includeRect( rect ) {

        if ( this.empty ) {
            this.minx = rect.minx;
            this.miny = rect.miny;
            this.maxx = rect.maxx;
            this.maxy = rect.maxy;
            this.count += 4;
            return;
        }

        this.minx = Math.min( rect.minx, this.minx );
        this.miny = Math.min( rect.miny, this.miny );
        this.maxx = Math.max( rect.maxx, this.maxx );
        this.maxy = Math.max( rect.maxy, this.maxy );
        this.count += 4;

    }

    translateX( dx ) {
        this.minx += dx;
        this.maxx += dx;
    }

    translateY( dy ) {
        this.miny += dy;
        this.maxy += dy;
    }

    translate( dx, dy ) {
        this.minx += dx;
        this.maxx += dx;
        this.miny += dy;
        this.maxy += dy;
    }

    setX( x ) {
        this.maxx -= this.minx;
        this.minx = x;
        this.maxx += x;
    }

    setY( y ) {
        this.maxy -= this.miny;
        this.miny = y;
        this.maxy += y;
    }

    set( x, y ) {
        this.setX( x );
        this.setY( y );
    }

}


function tests() {

    //  3x3 a
    const bb1 = new BoundingRect(); console.log( "bb1:", bb1 );
    bb1.include( 1, 0 ); console.log( "bb1:", bb1 );
    bb1.include( 2, 0 ); console.log( "bb1:", bb1 );
    bb1.include( 0, 1 ); console.log( "bb1:", bb1 );
    bb1.include( 2, 1 ); console.log( "bb1:", bb1 );
    bb1.include( 0, 2 ); console.log( "bb1:", bb1 );
    bb1.include( 1, 2 ); console.log( "bb1:", bb1 );
    bb1.include( 2, 2 ); console.log( "bb1:", bb1 );

    //  3x4 b
    const bb2 = new BoundingRect(); console.log( "bb2:", bb2 );
    bb2.include( 0,-1 ); console.log( "bb2:", bb2 );
    bb2.include( 0, 0 ); console.log( "bb2:", bb2 );
    bb2.include( 1, 0 ); console.log( "bb2:", bb2 );
    bb2.include( 2, 0 ); console.log( "bb2:", bb2 );
    bb2.include( 0, 1 ); console.log( "bb2:", bb2 );
    bb2.include( 2, 1 ); console.log( "bb2:", bb2 );
    bb2.include( 0, 2 ); console.log( "bb2:", bb2 );
    bb2.include( 1, 2 ); console.log( "bb2:", bb2 );
    bb2.include( 2, 2 ); console.log( "bb2:", bb2 );

}