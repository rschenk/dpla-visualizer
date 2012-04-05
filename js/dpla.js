jQuery(document).ready(function($){
	var $searchForm = $("#searchForm");
	$searchForm.on("submit",function(e){
		var submit = $searchForm.find('[type="submit"]').attr("disabled","disabled"),
		    params = $searchForm.serialize(),
		    displayParams = "'" + $('#query').val() + "'",
		    $results = $("#results").empty();
		var facetQueryString = "&facet=subject&facet=creator&facet=language";
		//http://api.dp.la/dev/item/?search_type=keyword&query=internet&facet=subject&facet=creator&facet=language&limit=2&callback=?
		var url = "http://api.dp.la/dev/item/?" + params + facetQueryString + "&callback=?";
		//alert(url);
		$.getJSON(url)
		    .done(function(data){
			    var retrievedCount=0;
			    var output = '',
				numResults = (data.num_found) ? data.num_found : 0;
			    var facets = {};

			    
			    // extract facets
			    $.each(['subject', 'creator', 'language'], function(i, facetName){
				    facets[facetName+'s'] = [];
				    var currentFacet = facets[facetName+'s'];

				    for(key in data.facets[facetName]) {
					currentFacet.push({
						title: key,
						    totalCount: data.facets[facetName][key],
							count: +data.facets[facetName][key],
						    retrievedCount: 0
						    });
				    }
				});

			    // method to increment count of number of items retreived by facet.
			    var incrementFacetRetrievedCount = function(property,item){
				if ( item.hasOwnProperty(property) ) {
				    $.each(facets[property+'s'],function(i,facetEntry){
					    if ( $.isArray(item[property]) ) {
						var properties = item[property];
						$.each(properties,function(i,p){
							if ( facetEntry.title === p ) {
							    facetEntry.retrievedCount++;
							}
						    });
					    } else {
						if ( facetEntry.title === item[property] ) {
						    facetEntry.retrievedCount++;
						}
					    }
				    });
				}
			    };

			    // now apply the method above and count returned items by facet.
			    $.each(data.docs,function(i,item){
				    //output += '<div class="result"><h2>Result ' + (i + 1) + '</h2>' + JSON.stringify(item) + '</div>';
				    retrievedCount++;
				    incrementFacetRetrievedCount("creator",item);
				    incrementFacetRetrievedCount("language",item);
				    incrementFacetRetrievedCount("subject",item,",");

				});

			    $searchForm[0].reset();

			    // display summary results.
			    output += '<strong>' + numResults + '</strong> results found, <strong>' + retrievedCount + '</strong> results retrieved:<br />';
			    $results.append(output);

			    // pump facet data into treemap.
			    var treeMap_data = {"level":0,"name":"DPLA Results for "+displayParams,"id":"DPLA Results","data":{"$color":71,"$area":data.num_found,"retrievedItems": retrievedCount, "totalItems":data.num_found},"children":[]};

			    $.each(facets,function(facetType,facetEntries){
				    var treeMap_column = {
					"level" : 1,
					"name" : facetType,
					"data" : {
					    "$area": 0,
					    "$color": 50,
					    "totalItems" : 0
					},
					"children" : []
				    }; 
				    treeMap_data.children.push(treeMap_column);
				    $.each(facetEntries,function(i,facetEntry){
					    var treeMap_box = {
						"level" : 2,
						"name" : facetEntry.title,
						"data" : {
						    "$area": facetEntry.totalCount,
						    "$color": Math.round((facetEntry.retrievedCount/ retrievedCount)*100),
						    "totalItems" : facetEntry.totalCount
						},
						"children" : []
					    };
					    treeMap_column.data.$area+=facetEntry.totalCount;
					    treeMap_column.children.push(treeMap_box);
					});
				});
			    //alert(JSON.stringify(facets));
			    showTreeMap(treeMap_data);
				
				
				
				/*
				  
				Timeline histogram
				
				
				*/
				
				
				var publicationYears = _.chain(facets.creators)
				                        .map(function(creator){ 
											return creator.title.match(/\d\d\d\d/g); 
										})
										.compact()
										.map(function(years){
											  var sum = _.reduce(years, function(s, n){ return s + parseInt(n); }, 0);
											  return Math.round(sum / years.length); 
										})
										.value()
										.sort();
				
				
				var nh = new NumericHistogram(publicationYears, 10);
				var histogramData = [];
				for(year in nh.toJSON() ) {
					histogramData.push({ year: +year, value: +nh.get(year) });
				}
				
				
				
				var h = 100,
				    w = 600;
					

				$('#publicationHistogram').empty();
				var viz = d3.select('#publicationHistogram').append('svg:svg').attr('class', 'chart').attr('width', w).attr('height', h);
				
				var x = d3.scale.ordinal()
				        .domain(_.map(histogramData, function(d){ return d.year; }))
						.rangeBands([0, w]);
				
				var y = d3.scale.linear()
				        .domain([0, nh.maxValue])
						.range([0, h]);
						
										
				viz.selectAll("rect")
				    .data(histogramData)
				  .enter().append("rect")
				    .attr('transform', function(d){ return "translate(0, "+ (h - y(d.value)) +")"; })
				    .attr('x', function(data){ return x(data.year); } )
				    .attr("y", 0)
				    .attr("width", x.rangeBand())
				    .attr("height", function(data){ return y(data.value); });				
				
				
				viz.append("line")
				  .attr('transform', 'translate(0, '+(h-1)+')')
				  .attr('x1', 0)
				  .attr('x2', w);
				  
				  
				  
				  
				  
				  
			  /* 
				  
				  
			  Subject Keyword Cloud
				  
				  
			  */
			  
			  
			  var subjectHeadingCloud = d3.select("#subjectHeadings").attr("class", "keyword_cloud");
			  
			  
			  
			  var classes = d3.scale.linear()
			    .domain([0, d3.max(_.map(facets.subjects, function(s){ return s.count; }))] )
				.range([1, 6]);
				
			  subjectHeadingCloud.selectAll('div.keyword')
			  	.data( _.sortBy(facets.subjects, function(s){ return s.title; }))
			  .enter().append('div')
			    .attr('class', function(d){ return "keyword size" + Math.round(classes(d.count)); })
				.attr('title', function(d){ return d.count; })
				.text(function(d){ return d.title; });
			  
				
			})
		    .fail(function(){
			    alert('Glaring error');
			})
		    .always(function(){
			    submit.removeAttr("disabled");
			});
		return false;
	    });
    });