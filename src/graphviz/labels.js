class Labels{
    constructor(G, options){
        this.G = G;
        this.sprites = {};
        this.visible = {};
        this.create_mesh();
    }

    nodes(){
        return this.G.nodes();
    }

    edges(){
        return this.G.edges();
    }

    text(node_id){
        return this.G.node.get(node_id).label;
    }

    setPositions(f){
        const nodes = this.nodes();
        for(let node_id of nodes){
            let pos = f(this.G, node_id);
            this.sprites[node_id].position.set(pos.x, pos.y, pos.z);
        }
    }

    setVisibility(f){
        const nodes = this.nodes();
        for(let node_id of nodes){
            let visible = f(this.G, node_id);
            if(!visible){
                this.hideSprite(node_id);
            }
            else{
                this.showSprite(node_id);
            }
        }
    }

    hideSprite(node_id){
        this.mesh.remove(this.sprites[node_id]);
    }

    showSprite(node_id){
        this.mesh.add(this.sprites[node_id]);
    }

    create_mesh(options){
        let nodes = this.nodes();

        let mesh = new THREE.Group()
        for(let n of nodes)
        {
            // attributes
            let text = this.text(n);
            let textHeight = 0.0025;
            let fontFace = "Futura";
            let fontSize = 32; // 32
            let font = "normal "+fontSize+"px"+" "+fontFace;

            // create canvas
            let canvas = document.createElement('canvas');
            let ctx = canvas.getContext("2d");
            ctx.font = font;
            let textWidth = ctx.measureText(text).width;
            canvas.width = textWidth;
            canvas.height = fontSize;

            ctx.font = font;
            ctx.textAlign = "left";
            ctx.textBaseline = 'bottom';
            if(canvas.width>0 && canvas.height>0){
                ctx.fillStyle = "white";
                ctx.fillText(text, 0, canvas.height);

                // create texture
                let tex = new THREE.Texture(canvas);
                tex.needsUpdate = true;
                let spriteMat = new THREE.SpriteMaterial({
                    map: tex,
                    fog: true,
                    sizeAttenuation: true,
                    premultipliedAlpha: false
                });
                let sprite = new THREE.Sprite(spriteMat);
                this.sprites[n] = sprite;
                // let o = new THREE.Object3D()
                // o.add(sprite);

                // sprite.position.set(nodes[n]['pos'][0], nodes[n]['pos'][1], nodes[n]['pos'][2]);
                let aspect = canvas.width/canvas.height;
                sprite.center = new THREE.Vector2(1,0);
                sprite.scale.set(textHeight * aspect, textHeight);
                // sprite.degree = nodes[n].degree;
                // this.showSprite(n);
            }
        }
        this.mesh = mesh;
    }
}

export {Labels};