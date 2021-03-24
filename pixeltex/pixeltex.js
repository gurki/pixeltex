import { MiniGent } from '../font/minigent.js'
import * as Tokenizer from './tokenizer.js'
import * as Parser from './parser.js'
import * as Rasterizer from './rasterizer.js'
import * as Renderer from './renderer.js'


var app = new Vue({

    data: {
        font: MiniGent,
        codes: {},
        input: ""
    },

    watch: {},
    computed: {},
    filters: {},
    methods: {
        inputChanged() {

            const lines = this.input.split( '\n' );
            const canvasWidth = this.ctx.canvas.clientWidth;
            const canvasHeight = this.ctx.canvas.clientHeight;

            //  ab
            //  \frac{x}{y}
            //  a\frac{x}{y}b
            //  a\frac{\frac{uv}{w}}{xyz}b
            //  \left(a\frac{\frac{uv}{w}}{xyz}b\right)
            //  \left(a\frac{\frac{uv}{w}}{\sqrt{xyz}}b\right)
            //  \left(1\frac{\left(\frac{2x}{y}\right)}{\sqrt{3}}z\right)
            //  \gamma:=\left(1\frac{\left(\frac{2x}{y}\right)}{\sqrt{3}}z\right)
            //  \sqrt{3\left(\frac{a}{b}\right)^2_i}=4\sum_{i=0}^{n}(u_i\cdotv_i)+\log{a}
            //  \sqrt{3\left(\frac{a}{\log{b}}\right)^2_i}=4\sum_{i=0}^{n}(u_i\cdotv_i)+\int_1^3x\dx
            this.ctx.fillStyle = "#2c2f3a";
            this.ctx.strokeStyle = "#191d27";
            this.ctx.fillRect( 0, 0, canvasWidth, canvasHeight );
            this.ctx.strokeRect( 0, 0, canvasWidth, canvasHeight );

            for ( const line of lines ) {

                const tokens = Tokenizer.tokenize( line, this.codes );
                const ast = Parser.parse( tokens );
                // console.log( ast );
                const fb = Rasterizer.rasterize( ast );
                // console.log( fb );

                Renderer.render( fb, this.ctx );

            }

        },
        saveImage() {
            const canvas = document.getElementById( "tex-canvas" );
            let link = document.getElementById( 'link' );
            link.setAttribute( 'download', 'PixelTexRender.png' );
            link.setAttribute( 'href', canvas.toDataURL("image/png").replace("image/png", "image/octet-stream") );
            link.click();
        },
        showExample( id ) {
            if ( id == 1 ) this.input = "Hello there! :grinning:";
            if ( id == 2 ) this.input = "GREEK LETTERS?!\n\n\\gamma\\xi\\Delta\n\nNICE :thumbsup:"
            if ( id == 3 ) this.input = "Equation 1)\n\n\\left(a\\frac{\\frac{uv}{w}}{xyz}b\\right)"
            if ( id == 4 ) this.input = "\\sqrt{3\\left(\\frac{a}{\\log{b}}\\right)^2_i}=4\\sum_{i=0}^{n}(u_i\\cdotv_i)+\\int_1^3x\\dx-\\left(\\lim_{n\\rightarrow\\infty}\\frac{1}{n^{-2}}\\right)"
            this.inputChanged();
        }
    },
    mounted() {

        let canvas = document.getElementById( "tex-canvas" );

        this.ctx = canvas.getContext( '2d' );
        this.ctx.imageSmoothingEnabled = false
        this.ctx.fillStyle = "#2c2f3a";
        this.ctx.fillRect( 0, 0, canvas.width, canvas.height );

    }

});

app.$mount( "#app" );