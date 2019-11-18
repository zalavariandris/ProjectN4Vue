Array.prototype.pairs = function (func) {
    let allpairs = [];
    for (var i = 0; i < this.length - 1; i++) {
        for (var j = i; j < this.length - 1; j++) {
            allpairs.push([this[i], this[j+1]]);
        }
    }
    return allpairs;
}

let D3GraphView = Vue.component("D3GraphView", {
    template: `
    <div>
        <input v-model="search" placeholder="filter">
    </div>
    `,
    data: function(){
        return {
            search: ""
        }
    },

    computed:{
        basicGraph(){
            return {
                nodes: [
                    {id: "n0", label: "judit", x: 20, y:100},
                    {id: "n1", label: "andris", x: 100, y:100},
                    {id: "n2", label: "masa", x: 50, y:200}
                ],

                edges:[
                    {source: "n0", target:"n1"},
                    {source: "n1", target:"n2"},
                    {source: "n0", target:"n2"}
                ]
            };
        },

        randomGraph(){
            function randomString(){
                const characters = "abc";
                let label = "";
                for(let i=0; i<Math.random()*10; i++){
                    label+=characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return label;
            }
            let graph = {nodes: [], edges: []};

            for(let i=0; i<50; i++){
                graph.nodes.push({id: "id"+String(i), label: randomString()});
            }

            for(let i=0; i<200; i++){
                graph.edges.push({
                    source: graph.nodes[Math.floor(Math.random()*graph.nodes.length)].id,
                    target: graph.nodes[Math.floor(Math.random()*graph.nodes.length)].id
                });
            }
            return graph;
        },

        artistsGraph(){
            let results;
            // query database
            const sql_artists_with_degree = `
            SELECT a.id, a.name, COUNT(ae.artist_id) as exhibitions_count
            FROM artists_exhibitions ae
            JOIN artists a ON a.id = ae.artist_id
            WHERE a.name LIKE '%${this.search}%'
            GROUP BY ae.artist_id
            ORDER BY exhibitions_count DESC
            LIMIT 1000
            `;

            results = this.$store.state.connection.exec(sql_artists_with_degree);

            // process result
            let graph = {nodes: [], edges: []};
            if(!results[0]){
                return graph;
            }

            // populate nodes
            for(let row of results[0].values){
                graph.nodes.push({id: row[0], label: row[1], degree:row[2]});
            }

            //populate edges
            const sql_all_exhibitions = `
            SELECT id, title
            FROM exhibitions
            ORDER BY date DESC
            `;

            results = this.$store.state.connection.exec(sql_all_exhibitions);
            let exhibitions = [];
            for(let row of results[0].values){
                exhibitions.push({id: row[0], title: row[1]});
            }

            const sql_artists_at_exhibition=`
            SELECT a.id, a.name
            FROM artists_exhibitions ae 
            INNER JOIN exhibitions e ON e.id == ae.exhibition_id 
            INNER JOIN artists a ON a.id == ae.artist_id
            WHERE e.id={exhibition_id}
            `;

            for(let exhibition of exhibitions){
                let results = this.$store.state.connection.exec(sql_artists_at_exhibition.replace("{exhibition_id}", exhibition.id));
                if(!results[0])
                    continue
                let artists = results[0].values;
                for(let pair of artists.pairs()){
                    let source_id = pair[0][0];
                    let target_id = pair[1][0];

                    graph.edges.push({source:source_id, target:target_id});
                };
                console.log("hey");
            }

            return graph;
        },

        graph: function(){
            let graph = this.artistsGraph;
            return graph;
        },

        filteredGraph: function(){
            let filteredGraph = {nodes: this.graph.nodes, edges:this.graph.edges};

            filteredGraph.nodes = filteredGraph.nodes.filter( (n)=>{
                return n.label.indexOf(this.search)>=0;
            });

            filteredGraph.edges = filteredGraph.edges.filter(function(edge){
                let sourceFound = filteredGraph.nodes.find(function(n){
                    return n.id == edge.source.id || n.id == edge.source;
                });
                let targetFound = filteredGraph.nodes.find(function(n){
                    return n.id == edge.target.id || n.id == edge.target;
                });
                return sourceFound && targetFound;
            });
            return filteredGraph;
        }
    },

    methods:{
        updateNodes: function(){
            let node = this.viz.selectAll('circle').data(this.filteredGraph.nodes);
            
            node.attr("cx", (d)=>d.x)
                .attr("cy", (d)=>d.y);

            node.enter()
                .append("circle")
                .attr('fill', 'darkgrey')
                .attr('r', (d)=>d.degree*d.degree/100)
                .attr("cx", (d)=>d.x)
                .attr("cy", (d)=>d.y)
                .call(d3.drag()
                  .on("start", dragstarted)
                  .on("drag", dragged)
                  .on("end", dragended)
                );

            //  drag event handlers
            let self = this;
            function dragstarted(d) {
                if (!d3.event.active) self.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            function dragended(d) {
                if (!d3.event.active) self.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            }

            node.exit().remove();
        },

        updateLabels: function(){
            let label = this.viz.selectAll("text").data(this.filteredGraph.nodes);

            label.attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y)
                .text(function(d, i) { return d.label; });

            label.enter()
                .append("text")
                .text(function(d, i) { return d.label+" ("+d.degree+")"; })
                .attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y)
                .attr('style', "user-select: none");

            label.exit().remove();
        },

        updateLinks: function(){
            let link = this.viz.selectAll("line").data(this.filteredGraph.edges);
            let self = this;

            link.attr("x1", function(d){return d.source.x;})
                .attr("y1", function(d){return d.source.y;})
                .attr("x2", function(d){return d.target.x;})
                .attr("y2", function(d){return d.target.y;});

            link.enter()
                .append("line")
                .attr("stroke", "darkgrey")
                .attr("stroke-width", 2.0)
                .attr("x1", function(d){return d.source.x;})
                .attr("y1", function(d){return d.source.y;})
                .attr("x2", function(d){return d.target.x;})
                .attr("y2", function(d){return d.target.y;});

            link.exit().remove();
        },

        updateSimulation(){
            this.simulation.stop();
            this.simulation.nodes(this.filteredGraph.nodes);
            this.simulation.force("link", d3.forceLink(this.filteredGraph.edges).id((d)=>d.id).distance(100).strength(1))
            this.simulation.alphaTarget(0.3).restart();
        }
    },

    watch:{
        search: function(){
            console.log("search");
        },

        filteredGraph: function(){
            this.updateLinks();
            this.updateNodes();
            this.updateLabels();
            this.updateSimulation();
        }
    },

    mounted: function(){
        window.app = this;
        // data
        let nodes = this.filteredGraph.nodes;
        let edges = this.filteredGraph.edges;
        var width = 500;
        var height = 500;

        // selectors
        this.svg = d3.select(this.$el) // D3 uses a jQuery like selector
            .append("svg")
            .attr("height", width)
            .attr("width", height);

        this.viz = this.svg.append("g").attr("class", "viz");
        this.svg.call(d3.zoom().on("zoom",  ()=>{
           this.viz.attr("transform", d3.event.transform)
        }));
        
        // simulation
        this.simulation = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-3000))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(1))
        .force("y", d3.forceY(height / 2).strength(1))
        .force("link", d3.forceLink(edges).id((d)=>d.id).distance(50).strength(1))  
        .on("tick", tick)
        .stop();

        this.updateLinks();
        this.updateNodes();
        this.updateLabels();


        let self = this;
        function tick(){
            let node = self.svg.selectAll("circle");

            node
                .attr("cx", (d)=>d.x)
                .attr("cy", (d)=>d.y);
            window.node = node;

            let label = self.svg.selectAll("text")
                .attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y);

            let link = self.svg.selectAll("line")
                .attr("x1", function(d){return d.source.x;})
                .attr("y1", function(d){return d.source.y;})
                .attr("x2", function(d){return d.target.x;})
                .attr("y2", function(d){return d.target.y;});
        }

        this.simulation.restart();
    },
});

export {D3GraphView};