/* TODO
use the general update pattern
updating the graph creates new simulation.

at this exampl, the existing nodes keep their positions: https://bl.ocks.org/mbostock/1095795
 */

function getNeighbors(nxGraph, root, iterations){
    let currentNodes = [root];
    let nextNodes = [];
    let neighbors = [];
    for(let i=0; i<(iterations+1); i++){
        for(let node of currentNodes){
            neighbors.push(node);
            for(let neighbour of nxGraph.neighbors(node)){
                nextNodes.push(neighbour);
            }
        }
        currentNodes = nextNodes;
        nextNodes = [];
    }
    return neighbors;
};

const D3Graph = Vue.component('d3-graph', {
    props: ['graph'],
    template: `
    <div>
        <div>{{stats}}</div>
    </div>`,
    data: function(){
        return {
            stats: "",
            hovered: null,
            selected: null,
            // d3nodes: [],
            // d3edges: []

            node: undefined,//d3 selection
            link: undefined,//d3 selection
        }
    },

    watch: {
        'graph': function(){
            // this.d3nodes = 

            // this.d3edges = 

            this.updateLinks();
            this.updateNodes();
            this.updateLabels();
            this.updateSimulation();
            this.updateStats();
        }
    },

    computed: {
        d3graph: function(){
            /*
            d3.forceSimulation alters the graph property, 
            so the original graph has to be copied to run the simulation
            without ruining the passed graph
            */
            return {
                nodes: this.graph.nodes.map((node)=>{
                    return {
                        id: node.id, 
                        label: node.label,
                        color: node.color,
                        radius: node.radius,
                        x:0, y:0
                    }
                }),
                edges: this.graph.edges.map((edge)=>{
                    return {
                        source: edge.source, 
                        target: edge.target
                    };
                })
            }
        },

        nxGraph: function(){
            let nxGraph = new jsnx.Graph();
            for(let node of this.graph.nodes){
                nxGraph.addNode(node.id, {label: node.label});
            }
            for(let edge of this.graph.edges){
                nxGraph.addEdge(edge.source, edge.target);
            }
            return nxGraph;
        }
    },

    methods:{
        select: function(node){
            this.$emit('select', node);
        },

        updateNodes: function(){
            // data join
            let node = this.viz.select('.nodes').selectAll('circle').data(this.d3graph.nodes, (d)=>d.id);
            
            // update old elements
            // node.attr("cx", (d)=>d.x)
            //     .attr("cy", (d)=>d.y)
            //     .attr('fill', (d)=> d.color ? d.color : 'darkgrey')
            //     .attr('r', (d)=>d.radius ? d.radius : 10);

            // endter + update all elements
            node.enter()
                .append("circle")
                .on('mouseover', mouseOver)
                .on('mouseout', mouseOut)
                .on('click', (node)=> this.select(node))
                .call(d3.drag()
                  .on("start", dragstart)
                  .on("drag", dragged)
                  .on("end", dragended)
                )
                .merge(node)
                .attr('fill', (d)=> d.color ? d.color : 'darkgrey')
                .attr('r', (d)=>d.radius ? d.radius : 10)
                .attr("cx", (d)=>d.x)
                .attr("cy", (d)=>d.y);

            node.exit().remove();


            //  drag event handlers
            let self = this;
            function dragstart(d) {
                if (!d3.event.active) self.simulation.alpha(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            }

            function dragged(d) {
                d.fx = d3.event.x;
                d.fy = d3.event.y;
            }

            function dragended(d) {
                if (!d3.event.active) self.simulation.alpha(0.3);
                d.fx = null;
                d.fy = null;
            }

            function mouseOver(hoveredNode){
                // get neighbors
                // let neighbors = getNeighbors(self.nxGraph, hoveredNode.id, 2);
                let neighbors = jsnx.singleSourceShortestPath(self.nxGraph, hoveredNode.id, 2);
                //color nodes
                self.viz.select('.nodes').selectAll('circle').filter((d)=>{
                    return !neighbors.has(d.id);
                }).attr("opacity", 0.1);

                // color links
                self.viz.select('.links').selectAll('line').filter((edge)=>{
                    return !neighbors.has(edge.source.id) || !neighbors.has(edge.target.id);
                }).attr("opacity", 0.1);
            }

            function mouseOut(hoveredNode){
                // get neighbors
                // let neighbors = getNeighbors(self.nxGraph, hoveredNode.id, 2);
                let neighbors = jsnx.singleSourceShortestPath(self.nxGraph, hoveredNode.id, 2);
                //color nodes
                self.viz.select('.nodes').selectAll('circle').filter((d)=>{
                    return !neighbors.has(d.id);
                }).attr("opacity", 1);

                // color links
                self.viz.select('.links').selectAll('line').filter((edge)=>{
                    return !neighbors.has(edge.source.id) || !neighbors.has(edge.target.id);
                }).attr("opacity", 1);
            }
        },

        updateLabels: function(){
            let label = this.viz.select('.labels').selectAll("text").data(this.d3graph.nodes, (d)=>d.id);

            label.attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y)
                .text(function(d, i) { return d.label; });

            label.enter()
                .append("text")
                .text(function(d, i) { return d.label; })
                .attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y)
                .attr('style', "user-select: none; pointer-events: none;")
                .attr('fill', 'black');

            label.exit().remove();
        },

        updateLinks: function(){
            let link = this.viz.select('.links').selectAll("line").data(this.d3graph.edges, function(d) { return d.source.id + "-" + d.target.id; });

            // link.attr("x1", function(d){return d.source.x;})
            //     .attr("y1", function(d){return d.source.y;})
            //     .attr("x2", function(d){return d.target.x;})
            //     .attr("y2", function(d){return d.target.y;});

            link.enter()
                .append("line")
                .attr("stroke", "darkgrey")
                .attr("stroke-width", 2.0)
                .merge(link)
                .attr("x1", function(d){return d.source.x;})
                .attr("y1", function(d){return d.source.y;})
                .attr("x2", function(d){return d.target.x;})
                .attr("y2", function(d){return d.target.y;});

            link.exit().remove();
        },

        updateSimulation(){
            this.simulation.stop();
            this.simulation.nodes(this.d3graph.nodes);
            this.simulation.force("link", d3.forceLink(this.d3graph.edges).id((d)=>d.id).distance(100).strength(1))
            this.simulation.alpha(1).restart();
        },

        updateStats(){
            this.stats = `nodes: ${this.graph.nodes.length}, edges: ${this.graph.nodes.length}`;
        }
    },

    created: function(){
        window.d3graph = this; 
    },

    mounted: function(){
        const width = 500;
        const height = 500;

        // create svg
        this.svg = d3.select(this.$el)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height);

        // handle zoom
        this.viz = this.svg.append("g").attr("class", "viz");
        this.svg.call(d3.zoom().on("zoom",  ()=>{
           this.viz.attr("transform", d3.event.transform)
        }));

        this.viz.append('g').attr('class', 'links');
        this.viz.append('g').attr('class', 'nodes');
        this.viz.append('g').attr('class', 'labels');

        // setup simulatio

        this.simulation = d3.forceSimulation(this.d3graph.nodes)
        .force("charge", d3.forceManyBody().strength(-3000))
        .force("center", d3.forceCenter(this.$el.offsetWidth / 2, height / 2))
        .force("x", d3.forceX(this.$el.offsetWidth / 2).strength(1))
        .force("y", d3.forceY(height / 2).strength(1))
        .force("link", d3.forceLink(this.d3graph.edges).id((d)=>d.id).distance(50).strength(1))  
        .on("tick", ticked)
        .stop();
        window.simulation = this.simulation;

        window.addEventListener('resize', (event)=>{
            let width = this.$el.offsetWidth;
            let height = this.$el.offsetHeight;
            this.simulation
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("x", d3.forceX(width / 2).strength(1))
            .force("y", d3.forceY(height / 2).strength(1))
        });

        // run simulation
        let self = this;
        function ticked(){
            let node = self.viz.select('.nodes').selectAll("circle")
                .attr("cx", (d)=>d.x)
                .attr("cy", (d)=>d.y);

            let label = self.viz.select('.labels').selectAll("text")
                .attr("x", (d)=>d.x)
                .attr("y", (d)=>d.y);

            let link = self.viz.select('.links').selectAll("line")
                .attr("x1", function(d){return d.source.x;})
                .attr("y1", function(d){return d.source.y;})
                .attr("x2", function(d){return d.target.x;})
                .attr("y2", function(d){return d.target.y;});
        }
        this.simulation.restart();

        // update elements
        this.updateLinks();
        this.updateNodes();
        this.updateLabels();
        this.updateStats();
    }
});

export {D3Graph};