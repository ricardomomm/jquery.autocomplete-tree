module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  var banner = [
      '/**',
      '*  Ajax Autocomplete-tree for jQuery, version ' + pkg.version, 
      '*  (c) 2014 Ricardo Momm',
      '*',
      '*  Ajax Autocomplete-tree for jQuery is freely distributable under the terms of an MIT-style license.',
      '*  For details, see the web site: https://github.com/ricardomomm/jquery.autocomplete-tree',
      '*/'].join('\n') + '\n';

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    uglify: {
      options: {
        banner: banner
      },
      build: {
				files : {
					'dist/jquery.autocomplete-tree.min.js': 'src/jquery.autocomplete-tree.js'
				}
      }
    },
		cssmin: {
			options: {
				banner: banner
			},
			build: {
				files : {
					'dist/jquery.autocomplete-tree.min.css': 'src/jquery.autocomplete-tree.css'
				}
      }
		}
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
  grunt.registerTask('default', ['uglify', 'cssmin']);

  grunt.task.registerTask('build', 'Create release', function() {

    // Minify latest version:
    grunt.task.run('uglify');
		grunt.task.run('cssmin');

    // Update plugin version:
    filePath = 'ricardomomm-autocomplete-tree.jquery.json';
    src = grunt.file.readJSON(filePath);

    if (src.version !== version){
      src.version = version;
      console.log('Updating: ' + filePath);
      grunt.file.write(filePath, JSON.stringify(src, null, 4));
    } else {
      console.log('No updates for: ' + filePath);
    }

    // Update bower version:
    filePath = 'bower.json';
    src = grunt.file.readJSON(filePath);

    if (src.version !== version){
      src.version = version;
      console.log('Updating: ' + filePath);
      grunt.file.write(filePath, JSON.stringify(src, null, 4));
    } else {
      console.log('No updates for: ' + filePath);
    }
  });
};
