import {Links} from "../graphviz/links.js"
import {Labels} from "../graphviz/labels.js"
import * as nx from '../../vendor/jsnetworkx.js'

let GraphView = Vue.component("graph-view", {
    template: `
    <div class="card">
    	<div><input placeholder="search" v-model="search"></div>
        <ul>
            <li v-for='artist in artists'>
                {{artist.name}}
            </li>
        </ul>
    </div>
    `,
    data: function(){
        return {
            graph: null,
            search: "",
            scene: null,
            camera: null,
            controls: null
        };
    },
    computed:{
        connection: function(){
            return this.$store.getters.connection;
        },

        artists: function(){
            // wait till connection comes alive
            if(!this.connection)
                return [];

            // query database
            const sql_artists_with_degree = `
            SELECT a.id, a.name, COUNT(ae.artist_id) as exhibitions_count
            FROM artists_exhibitions ae
            JOIN artists a ON a.id = ae.artist_id
            WHERE a.name LIKE '%${this.search}%'
            GROUP BY ae.artist_id
            ORDER BY exhibitions_count DESC
            LIMIT 5;
            `;
            let results = this.connection.exec(sql_artists_with_degree);

            // process results
            if(!results[0])
                return [];

            return results[0].values.map((row)=>{
                return {
                    id: row[0],
                    name: row[1]
                }
            });
        },

        nxGraph: function(){
            return this.$store.getters.nxGraph; 
        }
    },
    watch: {
        artists: function(){
            console.log("aritsts changed", this.artists)
            if(!this.artists[0])
                return;

            let artist_id = this.artists[0].id;
            let node_id = "A"+String(artist_id).padStart(6, "0");

            if(!this.graph.nodes[node_id])
                return;

            // move camera
            let pos = this.graph.nodes[node_id].pos;
            if(this.camera && this.controls){
                this.camera.position.set(pos[0], pos[1], pos[2]-0.015);
                this.controls.update();
                this.controls.target.set(pos[0], pos[1], pos[2]);
                this.controls.update(); 
            }

            // show neighbor labels
            if(!this.nxGraph)
                return;

            let root_node_id = "A"+String(artist_id).padStart(6, "0");
            let neighbors = this.nxGraph.neighbors(root_node_id);
            neighbors.push(root_node_id);

            this.labels.setVisibility((G, node_id)=>{
                let idx = neighbors.indexOf(node_id);
                return idx>=0;
            });
        },

        nxGraph: function(){
            console.log("NXGraph changed:", this.nxGraph);
        },

        graph: function(){
            let G = this.nxGraph;
            if(!G){
                return new jsnx.Graph();
            }
            // process graph to viz

            // viz graph
            let links = new Links(G);
            this.links = links;
            //position graph
            links.setPositions((G, node_id)=>{
                let pos = this.graph.nodes[node_id].pos;
                return new THREE.Vector3(pos[0], pos[1], pos[2]);
            });

            // colorize graph
            links.setColors((G, edge)=>{
                let source = this.graph.nodes[edge[0]];
                let target = this.graph.nodes[edge[1]];
                // Color edges by direction
                let r = Math.abs(source.pos[0] - target.pos[0]);
                let g = Math.abs(source.pos[1] - target.pos[1]);
                let b = Math.abs(source.pos[2] - target.pos[2]);
                let length = Math.sqrt(r*r+g*g+b*b);
                r/=length;
                g/=length;
                b/=length;

                return new THREE.Color(r,g,b);
            });
            this.scene.add(links.mesh);

            // create labels
            let labels = new Labels(G);
            this.labels = labels;
            labels.setPositions((G, node_id)=>{
                let pos = this.graph.nodes[node_id].pos;
                return new THREE.Vector3(pos[0], pos[1], pos[2]);
            });
            
            this.scene.add(labels.mesh);
            
        }
    },
    methods: {
        fetchGraph: function(){
            const self = this;
            fetch("./resources/ikon_artists_exhibitions_graph2.json")
            .then((resp)=> resp.json())
            .then((G)=>{
                self.graph = G;
                window.graph = G;
            });
        }
    },
    mounted: function(){
        window.view = this;
        // create renderer
        let renderer = new THREE.WebGLRenderer({
            // canvas: this.$el,
            antialias: false, 
            depth: true, 
            alpha: false, 
            preserveDrawingBuffer: true,
        }); 
        
        this.$el.appendChild(renderer.domElement);
        // renderer.domElement.style.position = 'fixed';
        // renderer.domElement.style.top = 0;
        // renderer.domElement.style.left = 0;
        // renderer.domElement.style.width = '100%';
        // renderer.domElement.style.height = '100%';
        // renderer.domElement.style['z-index'] = -1;
        renderer.setSize(500, 500);

        // create camera
        let aspect = renderer.domElement.offsetWidth / renderer.domElement.offsetHeight;
        let camera = new THREE.PerspectiveCamera( 75, aspect, 0.0001, 10 );
        this.camera = camera;
        camera.position.set(0,3,3);
        let self = this;
        window.addEventListener('resize', function(){
            camera.aspect = self.$el.offsetWidth / self.$el.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(500, 500);
        });

        // create camera controls
        let controls = new THREE.TrackballControls( camera, renderer.domElement );
        this.controls = controls;
        controls.update();
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.07;

        // create scene
        let scene = new THREE.Scene();
        this.scene = scene;
        //populate scene
        // let mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial());
        // scene.add(mesh);

        // animate
        function animate(){
            renderer.render(scene, camera);
            controls.update();
            requestAnimationFrame( animate );
        }

        //start animation
        animate();
        this.fetchGraph();
    },
});

export {GraphView};