const fs = require('fs');

function updateBackdrops(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Match: poster: 'some/value', backdrop: '' (inline style on same line)
  content = content.replace(/poster:\s*'([^']*)'\s*,\s*backdrop:\s*''/g, function(match, posterUrl) {
    if (!posterUrl) return match; // keep empty if poster is also empty
    return "poster: '" + posterUrl + "', backdrop: '" + posterUrl + "'";
  });

  // Match: poster: "some/value", backdrop: "" (double quote variant)
  content = content.replace(/poster:\s*"([^"]*)"\s*,\s*backdrop:\s*""/g, function(match, posterUrl) {
    if (!posterUrl) return match;
    return 'poster: "' + posterUrl + '", backdrop: "' + posterUrl + '"';
  });

  // Match multiline: poster on one line, backdrop: '' on next line(s)
  content = content.replace(/(poster:\s*'([^']*)'[^\n]*\n(?:[^\n]*\n){0,3}?[^\n]*)(backdrop:\s*'')/g, function(match, before, posterUrl, backdropPart) {
    if (!posterUrl) return match;
    return before + "backdrop: '" + posterUrl + "'";
  });

  fs.writeFileSync(filePath, content, 'utf8');

  // Count how many backdrops were set
  const matches = (content.match(/backdrop:\s*'\.\/img\//g) || []).length;
  console.log('Updated: ' + filePath + ' (' + matches + ' backdrops set from local img)');
}

updateBackdrops('data/movies.js');
updateBackdrops('data/series.js');
console.log('Done!');
