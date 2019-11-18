const ExhibitionView = Vue.component("exhibition-view",{
	template: `
	<div>
		<h2>{{title}}</h2>
		<router-link :to="{name:'gallery', params: {id: gallery.id}}"">
            {{gallery.name}}
        </router-link>
	    <ul>
            <li v-for="artist in artists">
                <router-link :to="{name: 'artist', params:{id:artist.id}}">
                	{{artist.name}}
                </router-link>
            </li>
        </ul>
	</div>
	`,
	computed: {
        title: function(){
            const sql = `SELECT title FROM exhibitions WHERE id = ${this.$route.params.id}`;
            let results = this.$store.state.connection.exec(sql);
            return results[0].values[0][0];
        },
        gallery: function(){
        	const sql = `
        	SELECT g.id, g.name FROM exhibitions e
        	JOIN galleries g ON g.id = e.gallery_id
        	WHERE e.id = ${this.$route.params.id};
        	`
        	let results = this.$store.state.connection.exec(sql);
        	if(!results[0]) return null;

    		return {
    			id: results[0].values[0][0],
    			name: results[0].values[0][1]
    		};
        },
        artists: function(){
        	const sql = `
		    SELECT a.id, a.name
		    FROM artists_exhibitions ae
		    INNER JOIN artists a ON a.id = ae.artist_id
		    WHERE ae.exhibition_id = ${this.$route.params.id}
        	`;

        	let results = this.$store.state.connection.exec(sql);
        	console.log(results);
        	if(!results[0]) return [];
        	return results[0].values.map((row)=>{
        		return {
        			id: row[0],
        			name: row[1]
        		}
        	});
        }
    }
});

export {ExhibitionView};