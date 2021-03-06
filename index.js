#!/usr/bin/env node

var program = require("commander");
var fs = require("fs");

program
    .version(require('./package').version);

program
    .option('-d, --directory [directory]', 'Directory where all non-uniquely-named artifacts are generated. Default: minus -topology.json')
    .option('-u, --ansible_user [ansible_user]', 'Ansible User Name')
    .option('-k, --ansible_key [ansible_key]', 'Ansible SSH Private Key File')
    .command("generate <artifact> <topology> [<output>]").alias("g")
    .description('Generate artifact')
    .action(function (artifact, topology, output) {
        artifactType = artifact || "<notprovided>";
        if(topology.indexOf('.yml' !== -1)){
          var yaml = require('js-yaml');
          var doc = yaml.safeLoad(fs.readFileSync(topology, 'utf8'));
		  topologyContent = doc;
        }
        outputFile = output || 'con';

        program.directory = program.directory; 
    });

program.on('*', function () {
    console.log('Unknown Command: ' + program.args.join(' '));
    program.help();
})

var supportedArtifactTypes = ["diagram", "portrequest", "checkports", "inventory"];

program.on('--help', function () {
    console.log(' Supported artifact:  ' + supportedArtifactTypes.join(", "));
    console.log('');
});
program.parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(1);
}

if (supportedArtifactTypes.indexOf(artifactType) == -1) {
    console.error(`The artifact '${artifactType}' is not supported.`);
    process.exit(1);
}

// create an output directory for generated artifacts


//console.log(artifactType);
//console.log(topologyFile);
//console.log(outputFile);

if( artifactType === "portrequest"){
    var generatePortRequest = require( "./generatePortRequest.js" );

    generatePortRequest(topologyFile, outputFile, program);
}else if (artifactType === "diagram" ){
    var generateSvgDiagram = require( "./generateSvgDiagram.js" );

    output = generateSvgDiagram(topologyContent);
	fs = require('fs');
    var svgstream = fs.createWriteStream( outputFile );
    svgstream.write( output );
    svgstream.end();
}else if (artifactType === "inventory" ){
    var generateInventory = require( "./generateInventory.js" );

    generateInventory(topologyFile, outputFile, program);
}
