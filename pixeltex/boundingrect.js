export default class BoundingRect {

    constructor( x=0, y=0, width=0, height=0 ) {
        this.minx = x;
        this.miny = y;
        this.maxx = x + width;
        this.maxy = y + height;
    }

    get x() { return this.minx; }
    get y() { return this.miny; }
    get width() { return this.maxx - this.minx + 1; }   //  pixel width
    get height() { return this.maxy - this.miny + 1; }  //  pixel height

    get left() { return this.minx; }
    get right() { return this.maxx; }
    get top() { return this.miny; }
    get bottom() { return this.maxy; }
    get hcenter() { return Math.floor( 0.5 * ( this.minx + this.maxx )); }
    get vcenter() { return Math.floor( 0.5 * ( this.miny + this.maxy )); }

    include( x, y ) {
        this.minx = Math.min( x, this.minx );
        this.miny = Math.min( y, this.miny );
        this.maxx = Math.max( x, this.maxx );
        this.maxy = Math.max( y, this.maxy );
    }

    includeRect( rect ) {
        this.minx = Math.min( rect.minx, this.minx );
        this.miny = Math.min( rect.miny, this.miny );
        this.maxx = Math.max( rect.maxx, this.maxx );
        this.maxy = Math.max( rect.maxy, this.maxy );
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

}