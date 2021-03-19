import * as Renderer from './render.js'


Vue.component( 'TexOutputItem', {
    props: [ "input" ],
    template: `
    <div id="tex-output>
        <canvas id="tex-canvas" ref="canvas"/>
    </div>
    `,

    methods: {
        update ( evt ) {

            let canvas = document.getElementById( "tex-canvas" );
            let ctx = canvas.getContext( '2d' );
            ctx.fillStyle = "#454b61";
            ctx.fillRect( 0, 0, canvas.clientWidth, canvas.clientHeight );

            ctx.font = '48px serif';
            ctx.fillStyle = "white";
            ctx.fillText( this.input, 0, 0 );

            for ( let i = 0; i < 10; i++ ) {
                ctx.fillRect( Math.random() * canvas.clientWidth, Math.random() * canvas.clientHeight, 1, 1 );
            }

            console.log( this.input );

        }
    },

    mounted () {
        this.canvas = this.$refs.canvas;
        Renderer.drawLetter( this.canvas, this.letter );
    }
});