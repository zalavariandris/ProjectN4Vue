const ExhibitionsView = Vue.component("exhibitions-view", {
    template: `
        <div class="card">
            <h2>Exhibitions</h2>
            <input v-model="search" placeholder="filter">
            <table>
                <thead>
                    <tr>
                        <td>title</td>
                        <td>date</td>
                        <td>gallery</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="exhibition in exhibitions">
                        <td>
                            <router-link :to="{name: 'exhibition', params: {id: exhibition.id}}">
                                {{exhibition.title}}
                            </router-link>
                        </td>
                        <td>
                            {{exhibition.date}}
                        </td>
                        <td>
                            <router-link :to="{name: 'gallery', params: {id: exhibition.gallery.id}}">
                            {{exhibition.gallery.name}}
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

        exhibitions: function(){
            // wait till connection comes alive
            if(!this.connection)
                return [];

            // query database
            const sql = `
            SELECT e.id, e.title, e.date, g.id, g.name
            FROM exhibitions e
            JOIN galleries g ON g.id=e.gallery_id
            WHERE title LIKE '%${this.search}%'
            ORDER BY date DESC
            LIMIT ${this.limit} OFFSET ${this.pageNumber}*${this.limit};
            `;
            let results = this.connection.exec(sql);

            // process result
            if(!results[0]){
                return {columns: [], rows: []};
            }

            return results[0].values.map((row)=>{
                return {
                    id: row[0],
                    title: row[1],
                    date: row[2],
                    gallery:{
                        id: row[3],
                        name: row[4]
                    } 
                }
            });
        },

        pageCount: function(){
            // wait till connection comes alive
            if(!this.connection)
                return 0;

            const sql = `
            SELECT COUNT(id)
            FROM artists
            WHERE name LIKE '%${this.search}%'
            `;

            let results = this.connection.exec(sql);
            if(!results[0]) return 0;
            return Math.ceil(results[0].values[0][0]/this.limit);
        }
    },
    
    methods:{
        resetPage: function(){
            this.page = 0;
        }
    }
});

export {ExhibitionsView}