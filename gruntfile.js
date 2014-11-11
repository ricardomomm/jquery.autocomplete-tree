module.exports = function(grunt) {

  var pkg = grunt.file.readJSON('package.json');

  var banner = [
      '/**',
      '*  Ajax Autocomplete-tree for jQuery, version <%= pkg.version %>', 
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
		},
		jasmine: {
			full: {
				src: "src/**/*.js",
				options: {
					specs: "tests/spec/*[S|s]pec.js",
					vendor: [
						"tests/lib/matchers.js",
						"tests/lib/jasmine-species/jasmine-grammar.js",
						"tests/lib/setup.js",
						"scripts/jquery-1.7.2.min.js",
						"tests/lib/jquery.keymasher.js",
						"tests/lib/jasmine.jquery.js"
					],
					styles: "src/**/*.css"
				}
			}
		}
  });

  // Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');

  // Default task(s).
	grunt.registerTask('test', ['jasmine']);
  grunt.registerTask('default', ['uglify', 'cssmin']);

  grunt.task.registerTask('release', 'Create release', function(version) {
		
    // Update plugin version:
    filePath = 'package.json';
    src = grunt.file.readJSON(filePath);

    if (src.version !== version){
      src.version = version;
      grunt.log.writeln('Updating: ' + filePath);
      grunt.file.write(filePath, JSON.stringify(src, null, 2));
			
			grunt.config('pkg', grunt.file.readJSON('package.json'));
			
    } else {
      grunt.log.writeln('No updates for: ' + filePath);
    }
		
    // Update plugin version:
    filePath = 'ricardomomm-autocomplete-tree.jquery.json';
    src = grunt.file.readJSON(filePath);

    if (src.version !== version){
      src.version = version;
      grunt.log.writeln('Updating: ' + filePath);
      grunt.file.write(filePath, JSON.stringify(src, null, 2));
    } else {
      grunt.log.writeln('No updates for: ' + filePath);
    }

    // Update bower version:
    filePath = 'bower.json';
    src = grunt.file.readJSON(filePath);

    if (src.version !== version){
      src.version = version;
      grunt.log.writeln('Updating: ' + filePath);
      grunt.file.write(filePath, JSON.stringify(src, null, 2));
    } else {
      grunt.log.writeln('No updates for: ' + filePath);
    }
		
    // Minify latest version:
    grunt.task.run('uglify:build');
		grunt.task.run('cssmin:build');
		
  });
};
