const axios = require('axios');
const http = require('http');

exports.getMainPage = (req, res) => {
    let url = 'https://api.themoviedb.org/3/movie/550988?api_key=4ca94f8b470d7e34bd3f59c3914295c8';
    axios.get(url)
    .then(response => {
        console.log(response.data.title);
        let data = response.data;
        let releaseDate = new Date(data.release_date).getFullYear();
        let genres = '';

        data.genres.forEach(genre => {
            genres = genres + `${genre.name}, `;
        });

        
        let genresUpdated = genres.slice(0, -2) + '.';
        moviePoster = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${data.poster_path}`;
        console.log(genresUpdated);
        let currentYear = new Date().getFullYear();
        res.render('index', {movieData: data, releaseDate: releaseDate, genres: genresUpdated, poster: moviePoster, year: currentYear});
    });
}


exports.getSearchPage = (req, res) => {
    res.render('search', { movieDetails:'' });
}

exports.postSearchPage = (req, res) => {
    let userMovieTitle = req.body.movieTitle;

    let movieUrl = `https://api.themoviedb.org/3/search/movie?api_key=4ca94f8b470d7e34bd3f59c3914295c8&query=${userMovieTitle}`;
    let genresUrl = 'https://api.themoviedb.org/3/genre/movie/list?api_key=4ca94f8b470d7e34bd3f59c3914295c8&language=en-US';
    
    let endpoints = [movieUrl, genresUrl];

    axios.all(endpoints.map((endpoint) => axios.get(endpoint)))
    .then(axios.spread((movie, genres) => {
        const [movieRaw] = movie.data.results;
        let movieGenreIds = movieRaw.genre_ids;
        let movieGenres = genres.data.genres;
        
        let movieGenresArray = [];

        for(let i = 0; i < movieGenreIds.length; i++) { // i++ - i = i + 1
            for(let j = 0; j < movieGenres.length; j++) {
                if(movieGenreIds[i] === movieGenres[j].id){
                    movieGenresArray.push(movieGenres[j].name);
                }
            }
        }

        let genresToDisplay = '';
        movieGenresArray.forEach(genre => {
            genresToDisplay = genresToDisplay+ `${genre}, `;
        });

        genresToDisplay = genresToDisplay.slice(0, -2) + '.';

        let movieData = {
            title: movieRaw.title,
            year: new Date(movieRaw.release_date).getFullYear(), 
            genres: genresToDisplay,
            overview: movieRaw.overview,
            posterUrl: `https://image.tmdb.org/t/p/w500${movieRaw.poster_path}`
        };
        
        res.render('search', {movieDetails: movieData});
    }));

}

exports.postGetMovie = (req, res) => {
	const movieToSearch =
		req.body.queryResult && req.body.queryResult.parameters && req.body.queryResult.parameters.movie
			? req.body.queryResult.parameters.movie
			: '';

	const reqUrl = encodeURI(
		`http://www.omdbapi.com/?t=${movieToSearch}&apikey=cc6f9d1b`
	);
	http.get(
		reqUrl,
		responseFromAPI => {
			let completeResponse = ''
			responseFromAPI.on('data', chunk => {
				completeResponse += chunk
			})
			responseFromAPI.on('end', () => {
				const movie = JSON.parse(completeResponse);
                if (!movie || !movie.Title) {
                    return res.json({
                        fulfillmentText: 'Sorry, we could not find the movie you are asking for.',
                        source: 'getmovie'
                    });
                }

				let dataToSend = movieToSearch;
				dataToSend = `${movie.Title} was released in the year ${movie.Year}. It is directed by ${
					movie.Director
				} and stars ${movie.Actors}.\n Here some glimpse of the plot: ${movie.Plot}.`;

				return res.json({
					fulfillmentText: dataToSend,
					source: 'getmovie'
				});
			})
		},
		error => {
			return res.json({
				fulfillmentText: 'Could not get results at this time',
				source: 'getmovie'
			});
		}
	)
}