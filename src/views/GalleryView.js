const GalleryView = Vue.component("gallery-view", {
    template: `
        <div>
            <h2>
                <router-link :to="{ name: 'gallery', params: { id: $route.params.id}}">
                    {{name}}
                </router-link>
            </h2>
            <h3>exhibitons</h3>
            <ul>
                <li v-for="exhibition in exhibitions">
                    <router-link :to="{name: 'exhibition', params:{id:exhibition.id}}">
                        {{exhibition.title}} ({{new Date(exhibition.date).getFullYear()}})
                    </router-link>
                </li>
            </ul>
        </div>
        `,

    computed: {
        name: function(){
            const sql = `SELECT name FROM galleries WHERE id = ${this.$route.params.id}`;
            let results = this.$store.state.connection.exec(sql);
            return results[0].values[0][0];
        },

        exhibitions: function(){
            // query database
            const sql = `
            SELECT id, title, date
            FROM exhibitions
            WHERE gallery_id = ${this.$route.params.id}
            ORDER BY date DESC;
            `;
            let results = this.$store.state.connection.exec(sql);

            // process result
            if(!results[0])
                return [];

            return results[0].values.map((row)=>{
                return {
                    id: row[0],
                    title: row[1],
                    date: row[2]
                }
            });
        }
    }
});

export {GalleryView}