function showTreeMap(treeMapData) {
   

	var tm = new TM.Squarified({

                //Where to inject the Treemap
                rootId: 'infovis',

		//add click handlers for zooming  
		//in and out  
		//addLeftClickHandler: true,  
		//addRightClickHandler: true,  

		//Allow coloring
		Color: {
		   
		    allow: true,
		    //Select a value range for the $color
		    //property. Default's to -100 and 100.
		    minValue: 0,
		    maxValue: 100,
		    //Set color range. Default's to reddish and
		    //greenish. It takes an array of three
		    //integers as R, G and B values.
		    maxColorValue: [0, 255, 0],
		    minColorValue: [255, 255, 255]
		},

		//Allow tips  
		Tips: {  
		    allow: true,  
		    //add positioning offsets  
		    offsetX: 20,  
		    offsetY: 20,  
		    //implement the onShow method to  
		    //add content to the tooltip when a node  
		    //is hovered  
		    onShow: function(tip, node, isLeaf, domElement) {  
			if (node.level === 0) {
			    tip.innerHTML = "All Results";
			} else if ( node.level === 1 ) {
			    tip.innerHTML = "All " + node.name + "Results";
			}  else {
			    tip.innerHTML = "Facet: " + node.name + "<br />Results" + node.data.$area;
			}
			tip.innerHTML += "<br />Total Items: " + node.data.totalItems;
			tip.innerHTML += "<br />Retrieved Items: " + node.data.retrievedItems;
		    }
		}  
	    });
    //load JSON data
    tm.loadJSON(treeMapData);
}