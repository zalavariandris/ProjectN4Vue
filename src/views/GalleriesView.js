const GalleriesView = Vue.component("galleries-view", {
    template: `
        <div class="card">
            <h2>Galleries</h2>
            <input v-model="search" v-on:input="resetPage" placeholder="search">

            <table>
                <thead>
                    <tr>
                        <td>name</td>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="gallery in galleries">
                        <td>
                            <router-link :to="{name: 'gallery', params: {id: gallery.id}}">
                                {{gallery.name}}
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

        galleries: function(){
            // wait till connection comes alive
            if(!this.connection)
                return [];

            // query database
            const sql = `
            SELECT id, name
            FROM galleries
            WHERE name LIKE '%${this.search}%'
            ORDER BY name ASC
            LIMIT ${this.limit} OFFSET ${this.pageNumber}*${this.limit};
            `;
            let results = this.connection.exec(sql);

            // process result
            if(!results[0]){
                return [];
            }

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
            this.pageNumber = 0;
        }
    }
});

export {GalleriesView}