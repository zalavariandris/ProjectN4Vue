const ArtistView = Vue.component("artist-view", {
    template: `
        <div>
            <h2>
                <router-link :to="{ name: 'artist', params: { id: $route.params.id}}">
                    {{name}}
                </router-link>
            </h2>
            <ul>
                <li v-for="item in exhibitions">
                    <router-link :to="{name: 'exhibition', params:{id:item.id}}">
                        {{item.title}} ({{item.date}})
                    </router-link>
                </li>
            </ul>
        </div>
        `,

    computed: {
        name: function(){
            const sql = `SELECT name FROM artists WHERE id = ${this.$route.params.id}`;
            let results = this.$store.state.connection.exec(sql);
            return results[0].values[0][0];
        },

        exhibitions: function(){
            // query database
            const sql = `
            SELECT e.id, e.title, e.date
            FROM artists_exhibitions ae
            INNER JOIN exhibitions e ON e.id = ae.exhibition_id
            WHERE ae.artist_id = ${this.$route.params.id}
            ORDER BY e.date DESC;
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
        },

        exhibitionsGroupedByYear: function(){
            const groups = {};
            for(let ex of this.exhibitions){
                let year = new Date(ex.date).getFullYear();
                if(!groups[year])
                    groups[year] = [];
                groups[year].push(ex);
            }
            console.log(groups);
            return groups;
        }
    }
});

export {ArtistView}