class Links{
    constructor(G, options = {}){
        this.G = G;
        this.create_mesh(); 
    }

    nodes(){
        return this.G.nodes();
    }

    edges(){
        return this.G.edges();
    }

    setColors(f){
        const edges = this.edges();
        const n = edges.length;

        const colors = this.mesh.geometry.attributes.color.array;
        for(let e=0; e<edges.length; e++){
            let color = f(this.G, edges[e]);
            colors[e*6+0] = colors[e*6+3+0] = color.r*255;
            colors[e*6+1] = colors[e*6+3+1] = color.g*255;
            colors[e*6+2] = colors[e*6+3+2] = color.b*255;
        }
        this.mesh.geometry.attributes.color.needsUpdate = true;
    }

    setPositions(f){
        const nodes = this.nodes();
        const vertices = this.mesh.geometry.attributes.position.array;

        const positions = {};
        for(let node_id of nodes){
            positions[node_id] = f(this.G, node_id);
        }

        // align edges to node positions
        const edges = this.edges();
        for(let e=0; e<edges.length; e++){
            let edge = edges[e];
            let source_pos = positions[edge[0]];// this.G.node.get(edge[0]).pos; // get source node position
            let target_pos = positions[edge[1]]; // get target node position

            vertices[e*6+0] = source_pos.x;
            vertices[e*6+1] = source_pos.y;
            vertices[e*6+2] = source_pos.z;

            vertices[e*6+3+0] = target_pos.x;
            vertices[e*6+3+1] = target_pos.y;
            vertices[e*6+3+2] = target_pos.z;
        }
        this.mesh.geometry.attributes.position.needsUpdate = true;
    }

    create_mesh(){
        let numberofedges = this.edges().length;

        let geometry = new THREE.BufferGeometry();
        let vertices = new Float32Array( numberofedges*(3+3) );
        let colors = new Uint8Array(vertices.length/3.0*3.0 );

        geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
        geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3, true ) );

        // links
        let web_material = new THREE.LineBasicMaterial( {
            transparent: true,
            opacity: 0.5,
            color: "white",
            vertexColors: THREE.VertexColors,
            //blending: THREE.AdditiveBlending
        } );
        let web = new THREE.LineSegments( geometry, web_material );
        web.renderOrder = -1;
        this.mesh = web;
    }
}

export {Links};