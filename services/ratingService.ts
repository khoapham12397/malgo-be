const {getNewRatings } = require("codeforces-rating-system"); 
export const exRating = ()=>{
    const contestants = [{
        position: 1,
        username: 'forthright48',
        previousRating: 1500,
      }, {
        position: 2,
        username: 'flash_7',
        previousRating: 1500,
      }, {
        position: 2,
        username: 'labib666',
        previousRating: 1500,
      }];
    const result = getNewRatings(contestants);
    console.log(result);
}