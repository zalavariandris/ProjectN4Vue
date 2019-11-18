import {VPaginate} from '../components/VPaginate.js'

const ArtistsView = Vue.component("artists-view", {
    template: `
        <div class="card">
            <h2>Artists</h2>
            <input v-model="search" v-on:input="resetPage" placeholder="search">
            <table>
                <thead>
                    <tr>
                        <td>name</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="artist in artists">
                        <td>
                            <router-link :to="{name: 'artist', params: {id: artist.id}}">
                            {{artist.name}}
                            </router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
            <vpaginate v-model="pageNumber" :length="pageCount"></vpaginate>
        </div>
        `,

    data: function(){
        return {
            search: "",
            limit: 10,
            pageNumber: 0
        }
    },

    computed: {
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
            LIMIT ${this.limit} OFFSET ${this.pageNumber}*${this.limit};
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

        pageCount: function(){
            // wait till connection comes alive
            if(!this.connection)
                return 0;

            // query database
            const sql = `
            SELECT COUNT(id)
            FROM artists
            WHERE name LIKE '%${this.search}%'
            `;

            // process results
            let results = this.connection.exec(sql);
            if(!results[0])
                return 0;
            return Math.ceil(results[0].values[0][0]/this.limit);
        }
    },

    methods:{
        resetPage: function(){
            this.page = 0;
        }
    }
});

export {ArtistsView}