/* COMPNENTS */
import {BaseTable} from '../components/BaseTable.js'

const Overview = Vue.component("overview", {
    template: `
        <div class="card" id="TheQuery">    
            <section>
                <h3>Artists</h3>
                <input v-model="artist_search" placeholder="filter">
                <base-table 
                v-bind:columns="artists.columns"
                v-bind:rows="artists.values"
                ></base-table>
            </section>

            <section>
                <h3>Exhibitions</h3>
                <input v-model="exhibition_search" placeholder="filter">
                <base-table 
                v-bind:columns="exhibitions.columns"
                v-bind:rows="exhibitions.values"
                ></base-table>
            </section>

            <section>
                <h3>Galleries</h3>
                <input v-model="gallery_search" placeholder="filter">
                <base-table 
                v-bind:columns="galleries.columns"
                v-bind:rows="galleries.values"
                ></base-table>
            </section>
        </div>
        `,

    data: function(){
        return {
            artist_search: "",
            exhibition_search: "",
            gallery_search: ""
        }
    },

    computed: {
        connection: function(){
            return this.$store.getters.connection;
        },
        
        artists: function(){
            // wait till connection comes alive
            if(!this.connection)
                return {columns: [], rows: []};

            // query database
            const sql = `
            SELECT DISTINCT a.name
            FROM artists_exhibitions ae
            INNER JOIN galleries g ON g.id = e.gallery_id
            INNER JOIN exhibitions e ON e.id = ae.exhibition_id
            INNER JOIN artists a ON a.id = ae.artist_id
            WHERE g.name LIKE '%${this.gallery_search}%'
            AND e.title LIKE '%${this.exhibition_search}%'
            AND a.name LIKE '%${this.artist_search}%'
            ORDER BY g.name ASC
            LIMIT 100;
            `;

            let results = this.connection.exec(sql);

            // process result
            if(!results[0]){
                return {columns: [], rows: []};
            }

            return results[0];
        },

        exhibitions: function(){
            // wait till connection comes alive
            if(!this.connection)
                return {columns: [], rows: []};

            // query database
            const sql = `
            SELECT DISTINCT e.title, e.date
            FROM artists_exhibitions ae
            INNER JOIN galleries g ON g.id = e.gallery_id
            INNER JOIN exhibitions e ON e.id = ae.exhibition_id
            INNER JOIN artists a ON a.id = ae.artist_id
            WHERE g.name LIKE '%${this.gallery_search}%'
            AND e.title LIKE '%${this.exhibition_search}%'
            AND a.name LIKE '%${this.artist_search}%'
            ORDER BY g.name ASC
            LIMIT 100;
            `;

            let results = this.connection.exec(sql);

            // process result
            if(!results.length){
                return {columns: [], rows: []};
            }

            return results[0];
        },

        galleries: function(){
            // wait till connection comes alive
            if(!this.connection)
                return {columns: [], rows: []};

            // query database
            const sql = `
            SELECT DISTINCT g.name
            FROM artists_exhibitions ae
            INNER JOIN galleries g ON g.id = e.gallery_id
            INNER JOIN exhibitions e ON e.id = ae.exhibition_id
            INNER JOIN artists a ON a.id = ae.artist_id
            WHERE g.name LIKE '%${this.gallery_search}%'
            AND e.title LIKE '%${this.exhibition_search}%'
            AND a.name LIKE '%${this.artist_search}%'
            ORDER BY g.name ASC
            LIMIT 100;
            `;

            let results = this.connection.exec(sql);

            // process result
            if(!results.length){
                return {columns: [], rows: []};
            }

            return results[0];
        },
    }
});

export {Overview}