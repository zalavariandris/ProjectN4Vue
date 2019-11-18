/* VIEWS */
import {Overview} from './views/Overview.js'
import {ArtistsView} from './views/ArtistsView.js'
import {ArtistView} from './views/ArtistView.js'
import {ExhibitionsView} from './views/ExhibitionsView.js'
import {ExhibitionView} from './views/ExhibitionView.js'
import {GalleriesView} from './views/GalleriesView.js'
import {GalleryView} from './views/GalleryView.js'
import {GraphView} from './views/GraphView.js'
import {LittleGraph} from './views/LittleGraph.js'
    
/*Store*/
import {loadDatabase} from './CRUD.js'
const store = new Vuex.Store({
    state: {
        connection: null,
        loading: false,
        loadingProgress: 0,
        nxGraph: null
    },

    mutations: {
        fetch (state) {
            console.log('loading...');
            state.loading = true;
            initSqlJs({locateFile: filename => `/vendor/${filename}`}).then((SQL)=>{
              loadDatabase(SQL, "./resources/ikon.db", (progress)=>{
                state.loadingProgress = progress*100;
                console.log(state.loadingProgress);
              }).then((connection)=>{
                state.connection = connection;
                state.loading = false;
                console.log('loaded');
              });
            });
        },

        fetchGraph: function(state){
            console.log('loading graph...')
            fetch("./resources/ikon_artists_exhibitions_graph2.json")
            .then((resp)=> resp.json())
            .then((graphJson)=>{
                //process graph
                let nxGraph = new jsnx.Graph();
                for(let node_id in graphJson.nodes){
                    nxGraph.addNode(node_id, {label: graphJson.nodes[node_id].label});
                }
                for(let edge of graphJson.edges){
                    nxGraph.addEdge(edge.source, edge.target);
                }
                state.nxGraph = nxGraph;
                window.nxGraph = nxGraph;
                console.log('graph loaded');
            });
        }
    },

    getters:{
        connection: function(state){
          if(!state.connection){
            store.commit('fetch');
          }
          console.log("get connection");
          return state.connection;
        },

        nxGraph: function(state){
          if(!state.nxGraph){
            store.commit('fetchGraph');
          }
          return state.nxGraph;
        }

    }
});

/* Routing */
const routes = [
  { path: '/overview', component: Overview },
  { path: '/artists', component: ArtistsView },
  { name: 'artist', path: '/artists/:id', component: ArtistView},
  { path: '/exhibitions', component: ExhibitionsView },
  { name: 'exhibition', path: '/exhibitions/:id', component: ExhibitionView},
  { path: '/galleries', component: GalleriesView },
  { name: 'gallery', path: '/galleries/:id', component: GalleryView },
  { name: 'littlegraph', path: '/littlegraph', component: LittleGraph },
  // { name: 'littlegraph', path: '/littlegraph/:id', component: LittleGraph },
  { path: '/graphview', component: GraphView }
]

const router = new VueRouter({
  routes // short for `routes: routes`
});

/* MAIN APP */
const app = new Vue({
    router,
    store,
    el: '#app',
    created: function(){
        window.app = this;
    }
});