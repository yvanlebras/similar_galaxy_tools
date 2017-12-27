

$(document).ready(function(){

    var similarityData = null,
        // download this https://github.com/anuprulez/large_files_repository/blob/master/similarity_matrix.json to your
        // local machine and set the path variable
        path = "";
    $.getJSON( path, function( data ) {
        var toolIdsTemplate = "";
        // sort the tools in ascending order of their ids
        similarityData = data.sort(function(a, b) {
            if( a.root_tool.id !== undefined && b.root_tool.id !== undefined ) {
                var first_id = a.root_tool.id.toLowerCase(),
                    second_id = b.root_tool.id.toLowerCase();
                if( first_id < second_id ) { return -1; }
                if( first_id > second_id ) { return 1; }
                return 0;
            }
        });
        for( var counter = 0, len = similarityData.length; counter < len; counter++ ) {
            var toolResults = similarityData[ counter ]; 
            if( toolResults.root_tool.id !== undefined ) {
                toolIdsTemplate += "<option value='" + toolResults.root_tool.id + "'>" + toolResults.root_tool.id + "</options>";
            }
        } // end of for loop
        $( ".tool-ids" ).append( toolIdsTemplate );
    });

    // Fire on change of a tool to show similar tools and plot cost vs iteration
    $( ".tool-ids" ).on( 'change', function( e ) {
        e.preventDefault();
        var selectedToolId = e.target.value,
            data = similarityData,
            availableSimilarTool = false,
            $el_tools = $( ".tool-results" );
        $el_tools.empty();
        for( var counter = 0, len = data.length; counter < len; counter++ ) {
            var toolResults = data[ counter ];
            if ( toolResults.root_tool.id === selectedToolId ) {
                var toolScores = toolResults.similar_tools,
                    aveToolScores = toolResults.average_similar_tools,
                    template = "";
                // make html for the selected tool
                $el_tools.append( createHTML( [ toolResults.root_tool ], selectedToolId, "<h4>Selected tool: " +  selectedToolId + "</h4>", "Score(optimal weights)" ) );
                // show optimal weights
                $el_tools.append( showWeights( toolResults.optimal_weights, "Optimal importance weights learned" ) );
                
                // make html for similar tools found by optimizing BM25 scores using Gradient Descent
                $el_tools.append( createHTML( toolScores, selectedToolId, "<h4> Similar tools for the selected tool: " +  selectedToolId + " found using optimal weights</h4>", "Score(optimal weights)" ) );
                
                // make html for similar tools found using average scores of BM25
                $el_tools.append( createHTML( aveToolScores, selectedToolId, "<h4> Similar tools for the selected tool: " +  selectedToolId + " found using average BM25 similarity scores</h4>", "Score(average weights)" ) );
                
                // plot loss drop vs iterations
                $el_tools.append( "<div id='tool-cost-iterations'></div>" );
                plotCostVsIterations( toolResults, "tool-cost-iterations", selectedToolId );
                availableSimilarTool = true;
                break;
            }
         } // end of for loop
         if ( !availableSimilarTool ) {
             $el_tools.empty().html( "<p class='no-similar-tool-msg'>No similar tool available. <p>" );
         }
    });
    
    var showWeights = function( weights, headerText ) {
        var template = "";
        template = "<div><h4> " + headerText + " </h4>"
        for( var item in weights ) {
            if( item === "input_output" ) {
                template += "<div>" + "Input and output file types: <b>" + toPrecisionNumber( weights[ item ] ) + "</b></div>";
            }
            else if( item === "name_desc_edam_help" ) {
                template += "<div>" + "Name, description, help and EDAM: <b>" + toPrecisionNumber( weights[ item ] )  + "</b></div>";
            }
        }
        template += "</div>";
        return template;
    };
    
    var toPrecisionNumber = function( number ) {
        return Math.round( parseFloat( number ) * 100) / 100;
    };

    var createHTML = function( toolScores, originalToolId, headerText, scoreHeaderText ) {
        var template = headerText;
        template += "<table><thead>";
        template += "<th>Id</th>";
        template += "<th> Input output score </th>";
        template += "<th> Name desc. Edam help score </th>";
        template += "<th> " + scoreHeaderText + "</th>";
        template += "<th> Name and description </th>";
        template += "<th> Input files </th>";
        template += "<th> Output files </th>";
        template += "<th> Help text (what it does) </th>";
        template += "<th> EDAM </th>";
        template += "</thead><tbody>";
        for( var counter_ts = 0, len_ts = toolScores.length; counter_ts < len_ts; counter_ts++ ) {
            var tool = toolScores[ counter_ts ],
                averageScore = ( tool.input_output_score + tool.name_desc_edam_help_score ) / 2;
            averageScore = averageScore.toFixed( 2 );
            template += "<tr>";
            template += "<td>" + tool.id + "</td>";
            template += "<td>" + tool.input_output_score + "</td>";
            template += "<td>" + tool.name_desc_edam_help_score + "</td>";
            template += "<td>" + tool.score.toFixed( 2 ) + "</td>";
            template += "<td>" + tool.name_description + "</td>";
            template += "<td>" + tool.input_types + "</td>";
            template += "<td>" + tool.output_types + "</td>";
            template += "<td>" + tool.what_it_does + "</td>";
            template += "<td>" + tool.edam_text + "</td>";
            template += "</tr>";
        }
        template += "</tbody></table>";
        return template;
    };
    
    var plotCostVsIterations = function( toolScores, $elPlot, selectedToolId ) {
        var costIterations = toolScores.cost_iterations,
            iterations = costIterations.length,
            x_axis = [];
        for( var i = 0; i < iterations; i++ ) {
            x_axis.push( i + 1 );
        }
	var data = [{
	    x: x_axis,
	    y: costIterations,
	    type: 'scatter'
	}];
	
	var layout = {
            title:'Cost vs Iterations for the tool: ' + selectedToolId,
            xaxis: {
                title: 'Iterations'
            },
            yaxis: {
                title: 'Cost'
            }
        };

	Plotly.newPlot( $elPlot, data, layout );
    }
});

