import {D3Graph} from '../components/D3Graph.js'
import {VAutocomplete} from '../components/VAutocomplete.js'
function select_artists_where_name_like(connection, name){
    const sql = `
    SELECT id, name
    FROM artists
    WHERE name LIKE '${name}'
    `;

    const results = connection.exec(sql);

    if(!results[0])
        return [];

    return results[0].values.map((row)=>{
        return {
            id: row[0],
            name: row[1]
        };
    });
};

function select_artist_where_id_is(connection, artist_id){
    const sql = `
    SELECT id, name
    FROM artists
    WHERE id = '${artist_id}'
    `;

    const results = connection.exec(sql);

    if(!results[0])
        return null;

    return results[0].values.map((row)=>{
        return {
            id: row[0],
            name: row[1]
        };
    })[0];
}

function select_exhibitions_where_artistid_is(connection, artist_id){
    const sql = `
    SELECT e.id, e.title
    FROM artists_exhibitions ae
    INNER JOIN exhibitions e ON e.id = ae.exhibition_id
    WHERE ae.artist_id = ${artist_id}
    `
    const results = connection.exec(sql);

    if(!results[0])
        return [];

    return results[0].values.map((row)=>{
        return {
            id: row[0],
            title: row[1]
        };
    });
};

function select_artists_of_exhibition(connection, exhibition_id){
    const sql=`
    SELECT a.id,a.name
    FROM artists_exhibitions ae 
    INNER JOIN exhibitions e ON e.id == ae.exhibition_id 
    INNER JOIN artists a ON a.id == ae.artist_id
    WHERE e.id=${exhibition_id};
    `

    const results = connection.exec(sql);

    if(!results[0])
        return [];

    return results[0].values.map((row)=>{
        return {
            id: row[0],
            name: row[1]
        };
    });
}

const LittleGraph = Vue.component("little-graph", {
    template: `
        <div class="card">
            <h2>Little Graph</h2>

            <section>
                <v-autocomplete v-model="searchSource" :filter="filterArtists" v-on:select="selectSource" v-slot="item" placeholder="source">
                    <router-link :to="{name: 'littlegraph', query:{...$route.query, ...{id: item.id}}}">{{item.name}}</router-link>
                </v-autocomplete>

                <v-autocomplete v-model="searchTarget" :filter="filterArtists" v-on:select="selectTarget" v-slot="item" placeholder="target">
                    <router-link :to="{name: 'littlegraph', query:{...$route.query, ...{target_id: item.id}}}">{{item.name}}</router-link>
                </v-autocomplete>
            </section>

            <section>
                <span v-if="artist">{{artist.name}}</span>
                <span v-if="targetArtist"> -> {{targetArtist.name}}</span>
            </section>

            <section>
                showLeafes: <input type="checkbox" v-model.number="showLeafes"/>
                <br/>
                iterations:
                <button v-on:click='iterations--'>-</button>
                {{this.iterations}}
                <button v-on:click='iterations++'>+</button>
            </section>

            <section>
                <d3-graph :graph="subgraph" v-on:select="graphSelect"></d3-graph>
            </section>
        </div>
    `,

    data: function(){
        return {
            searchSource: "",
            searchTarget: "",
            iterations:2,
            showLeafes: false
        }
    },

    watch: {
        '$route.query.id': function(id) {
            this.searchSource = "";
            this.searchTarget = "";
        }
    },

    methods: {
        selectSource(item){
            if(item && item.id!=this.artist.id){
                this.$router.push({name: 'littlegraph', query: {...this.$route.query, ...{id: item.id}}});
            }
        },

        selectTarget(item){
            if(item){
                if(!this.targetArtist || item.id!=this.targetArtist.id){
                    this.$router.push({name: 'littlegraph', query: {...this.$route.query, ...{target_id: item.id}}});
                }
            }
        },

        graphSelect(node){
            let artist_id = Number(node.id.slice(1));
            if(node && artist_id!=this.artist.id){
                this.$router.push({name: 'littlegraph', query: {...this.$route.query, ...{id: artist_id}}});
            }
        },

        filterArtists(query){
            if(!this.nxGraph)
                return [];

            if(!query)
                return [];

            let results = this.nxGraph.nodes(true).filter((node)=>{
                // latinize: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
                let nodelabel = node[1].label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                let searchString = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nodelabel.includes(searchString);
            });

            return results.sort((node)=>nxGraph.degree(node[0])).slice(0, 5).map((node)=>{
                return {
                    id: Number(node[0].slice(1)),
                    name: node[1].label
                }
            });
        }
    },

    created: function(){
        window.littlegraph = this;
    },

    computed: {
        connection: function(){
            return this.$store.getters.connection;
        },

        artist: function(){
            if(!this.connection)
                return null;

            let artist = select_artist_where_id_is(this.connection, this.$route.query.id);

            console.log(artist);
            if(!artist)
                return null;

            // this.searchSource = artist.name;
            return artist;
        },

        targetArtist: function(){
            if(!this.connection)
                return null;

            let artist = select_artist_where_id_is(this.connection, this.$route.query.target_id);

            console.log(artist);
            if(!artist)
                return null;

            // this.searchSource = artist.name;
            return artist;
        },

        nxGraph: function(){
            return this.$store.getters.nxGraph;
        },

        subgraph: function(){
            if(!this.nxGraph)
                return {nodes: [], edges: []};

            if(!this.artist)
                return {nodes: [], edges: []};

            let source_node_id = "A"+String(this.artist.id).padStart(6, "0");

            let path = [source_node_id];
            if(this.targetArtist){
                let target_node_id = "A"+String(this.targetArtist.id).padStart(6, "0");
                let path = jsnx.bidirectionalShortestPath(this.nxGraph, source_node_id, target_node_id);
            }

            let neighbors = [];
            for(let node_id of path){
                neighbors.push(...Array.from(jsnx.singleSourceShortestPath(this.nxGraph, node_id, this.iterations).keys()));
            }

            let subgraph = this.nxGraph.subgraph(neighbors);

            if(!this.showLeafes){
                neighbors = subgraph.nodes().filter((node)=>{
                    return subgraph.degree(node)>1;
                });
            }

            subgraph = this.nxGraph.subgraph(neighbors);


            // process nxgraph to graphJson
            let jsonSubgraph =  {
                nodes: subgraph.nodes(true).map((node)=>{
                 return {
                  id: node[0],
                  label: node[0].startsWith("A") ? node[1].label : node[1].label,
                  radius: node[0].startsWith("A") ? subgraph.degree(node[0])*3 : 10,
                  color: node[0].startsWith("A") ? 'orange' : 'yellow'
                 };
                }),
                edges: subgraph.edges().map((edge)=>{
                    return {
                        source: edge[0],
                        target: edge[1]
                    };
                })
            };
            return jsonSubgraph;
        },

        searchSourceResults: function(){
            if(!this.searchSource)
                return [];

            if(!this.nxGraph)
                return [];

            let results = this.nxGraph.nodes(true).filter((node)=>{
                // latinize: https://stackoverflow.com/questions/990904/remove-accents-diacritics-in-a-string-in-javascript
                let nodelabel = node[1].label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                let searchString = this.searchSource.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return nodelabel.includes(searchString);
            });

            return results.sort((node)=>nxGraph.degree(node[0])).slice(0, 5).map((node)=>{
                return {
                    id: Number(node[0].slice(1)),
                    name: node[1].label
                }
            });
        },
    }
});

export {LittleGraph};