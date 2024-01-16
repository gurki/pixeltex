import * as Renderer from './render.js'


Vue.component( 'LetterItem', {
    props: [ 'letter' ],
    template: `
    <div class="letter">
        <div class="unicode">{{letter.unicode}}</div>
        <div class="symbol">{{letter.symbol}}</div>
        <canvas class="canvas" width=40 height=40 ref="canvas" @click="update"/>
        <div class="name">{{letter.name}}</div>
        <div class="code">{{letter.code}}</div>
    </div>
    `,

    methods: {
        update ( evt ) {}
    },

    mounted () {
        this.canvas = this.$refs.canvas;
        Renderer.drawLetter( this.canvas, this.letter );
    }
});