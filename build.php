<?php
ini_set('auto_detect_line_endings', true);

print("Starting build of Impulse.js\n");
$impulse = "";

// build file header
$impulse .= includeFile("LICENSE");
$impulse .= includeFile("src/Core.js");

// concatenate select contents of ./srv
$files = array_diff(scandir("./src"), array("..", ".", "Core.js", "Init.js"));
foreach($files as $file) {
	$impulse .= includeFile("src/" . $file);
} // foreach( $file )

// build file footer
$impulse .= includeFile("src/Init.js");

// write file to disk
print("Writing 'impulse.js'\n");
file_put_contents("impulse.js", $impulse);

// minify and write to impulse.min.js
// FIXME make sure "use strict" is compatible with minifier
print("Minifying 'impulse.js'\n");
include("lib/jsmin-1.1.1.php");
$impulse = includeFile("LICENSE") . JSMin::minify($impulse);
print("Writing 'impulse.min.js'\n");
file_put_contents("impulse.min.js", $impulse);

function includeFile($file) {
	print("Including '$file'\n");
	return trim(file_get_contents($file)) . "\n\n";
} // includeFile( )
?>
