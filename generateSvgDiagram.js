(function(){

function generateSvgDiagram ( topology ){
    //var portdefs = require("./edge-defs.json");

    //var topology = require("./uat-19n-3sn-topology.json");


    // TODO: templatize height and width of svg

    var svgHeaderTemplate = fp.template( `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
xmlns:svg="http://www.w3.org/2000/svg"
xmlns="http://www.w3.org/2000/svg"
xmlns:xlink="http://www.w3.org/1999/xlink"
height="700"
width="1400"
xml:space="preserve"
version="1.1"
id="svg2">
<rect id="legend" x="1200" y="10" width="200" height="600" style="fill:#ffffff;stroke:#bfbfbf"></rect>
  <text id="text1488" x="1230" y="20" style="font-weight:bold;font-size:10px;font-family:Arial;" text-anchor="start">Legend</text>
` );

    var componentTemplate = fp.template(`\n
<symbol id="<%= id.toLowerCase() %>">
    <use xlink:href="#struct" style="fill:<%= bg %>;stroke:<%= stroke %>;"/>
    <text id="text1488" x="12.5" y="10.5"
        style="font-weight:bold;font-size:9px;font-family:Arial;fill:<%= text %>;" 
        alignment-baseline="middle" text-anchor="middle"
    ><%= id.toUpperCase() %></text>
</symbol>
    `);
	

    var legendTemplate = fp.template(`\n
  <use xlink:href="#<%= id.toLowerCase() %>"  x="<%= x %>" y="<%= y %>"/><text id="legend_r" x="<%= legendx %>" y="<%= legendy %>" style="font-weight:normal;font-size:7.5px;font-family:Arial;"><%= name %></text>
    `);

    var svgSymbols = `
  <symbol id="struct">
    <rect id="compcs2" x="1.5" y="1.5" width="30" height="16" rx="3" style="stroke-width:1.5"/>
  </symbol>
    `;

    var svgSymbols = svgSymbols + topology.components.map((component)=>{
      return componentTemplate(component)
    }).join("\n");

    var y = 10
    var svgFooter = svgFooter + topology.components.map((component)=>{
      y = y + 20;
      return legendTemplate({
        id: component.id,
        name: component.name || component.id.toLowerCase(),
        x: 1210,
        y: y,
        legendx: 1250,
        legendy: y + 12
      })
    }).join("\n");

     svgFooter = svgFooter + `
</svg>
    `;


    // Layout Constants
    var compWidth = 30;
    var compHeight = 16;
    var compSpacingV = 3;
    var compPadding = 2;

    var compTemplate = fp.template('<use xlink:href="#<%= comp %>"  x="<%= x %>" y="<%= y %>"/>');

    var nodeWidth = 35;
    var nodeSpacingH = 3;
    var nodePadding = 2;

    var nodeTemplate = fp.template(`\n
    <rect id="node<%= id %>" x="<%= x %>" y="<%= y %>" width="35" height="<%= height %>" style="fill:#ffffff;stroke:#bfbfbf">
        <title><%= tooltip %></title>
    </rect>
    <text id="nodetext<%= id %>" x="<%= textx() %>" y="<%= texty() %>" style="font-weight:normal;font-size:7.5px;font-family:Arial;"
        alignment-baseline="middle" text-anchor="middle"><%= text() %></text>
    `);


    //------------------------------------- load balancers ---
    var lbNodeWidthAndHPad = 30;
    var dcLbH = 30;
    var lbPH = 10;
            
    //var subnetWidth = 15;
    var subnetPaddingH = 7;
    var subnetPaddingV = 3;

    var subnetFooter = 20;
    var subnetSpacingH = 15;

    var subnetTemplate = fp.template(
                `\n<rect id="subnet<%= id %>" x="<%= x %>" y="<%= y - 5 %>" width="<%= width %>" height="<%= height %>" style="fill:#f2f2f2;stroke:#bfbfbf">
                    <title><%= tooltip %></title>
                </rect>
    <text id="nodetext<%= id %>" x="<%= textx() %>" y="<%= y %>" style="font-weight:normal;font-size:7.5px;font-family:Arial;"
        alignment-baseline="middle" text-anchor="middle"><%= text() %></text>
    `);

    var tierHeader = 20;
    var tierSpacingV = 10;
    var tierHeaderTemplate = fp.template(`
        <line x1="<%= x1 %>" y1="<%= y1 %>" x2="<%= x2 %>" y2="<%= y2 %>" style="stroke:#7f7f7f;;stroke-width:0.5;stroke-dasharray:6, 2;stroke-dashoffset:0;"/>
        <text id="text1488" x="<%= x %>" y="<%= y %>" style="font-weight:normal;font-size:8px;font-family:Arial;" text-anchor="end"><%= name %></text>
    `);

    var regionHeader = 12;
    var regionFooter = 12;
    var regionPaddingH = 7;
    var regionSpacingH = 30;
    var regionHeaderTemplate = fp.template(`
        <text id="text1488" x="<%= x %>" y="<%= y %>" style="font-weight:bold;font-size:10px;font-family:Arial;" text-anchor="start"><%= name %></text>
    `);
    var regionSeparatorTemplate = fp.template(`
        <line id="lineSep1" x1="<%= x1 %>" y1="<%= y1 %>" x2="<%= x2 %>" y2="<%= y2 %>" style="stroke:#7f7f7f;;stroke-width:2;stroke-dasharray:6, 2;stroke-dashoffset:0;"/>
    `);


    var tpComponents = [ "OL", "ZK", "CS", "HT", "No", "QD", "PG", "MY"];

    // Calculate Layout Geometry
    var nodesSvg = [];    // svg shapes accumulator

    function getNodeHeight( comps ){
        return compHeight * comps
            + (comps-1)*nodeSpacingH
            + nodePadding*2 + 6;
    };

// RIP: [Refactoring in process]: if we switch layout on tier-by-tier for node height, we do not need maxNodeComponents anymore
//    var maxNodeComponents = fp.max( fp.flatMap( subnet => subnet.nodes  )(region.subnets).map( node => node.components.length ) );
//
//    var nodeHeight = getNodeHeight( maxNodeComponents );
//    var subnetHeight = getNodeHeight( maxNodeComponents) + subnetFooter;   // -- node name + paddings

    // var tierHeight = tierHeader + subnetHeight;  // 40 -- tier divider and name + subnet name + paddings

    // 
    // 

    // TODO: refactor to utils
    // make lookup table for component:isApigee check
    /*var isApigee = fp(portdefs.mappings.edge).reduce( (comps, comp) => {
        comps[comp.client.component] = comp.client.apigee;
        return comps;
    }, {});*/
	var isApigee = function(){return false};

    //
    // Pan-Diagram variables coordinate accumulators
    //
    var regionX = 0;
    var regionY = 0;

    var separatorFlipOn = false;
    var separatorY = 0;


// <g>
//     <use xlink:href="#lb"  x="89.2" y="16"/>
//     <use xlink:href="#r"  x="190" y="37" transform="scale(0.6)"/>
//     <use xlink:href="#r"  x="220" y="37" transform="scale(0.6)"/>
// </g>

/* 
<g onmouseover="showvis('visible')" onmouseout="showvis('hidden')" transform="translate(100,13)">
    <rect id="node1" x="1.5" y="1.5" width="80" height="17.6" style="fill:#ffffff;stroke:#bfbfbf">
            <title>Load Balancer: </title>
    </rect>
    <use xlink:href="#lb"/>
    <use xlink:href="#r"  transform="scale(0.6) translate(40,10)"/>
    <use xlink:href="#r"  transform="scale(0.6) translate(68,10)"/>
</g> 
*/

    // 
    // returns yoffset 
    //
    function drawLoadBalancers( loadbalancers, lbsX, lbsY, lbTotalWidth){


        var xoffset = 0;
        var yoffset = 0;
        // Phase I: Dry-run for calculating rows of LBs relative to lbTotalWidth viewport
        xoffset = 0;

        var lbWidth = 0;
        var lbRows = [];
        fp.reduce(
            (rows, lb) => {
                lbWidth = getLoadBalancerWidth( lb );


    console.log(xoffset, lbWidth);
                if( xoffset + lbPH + lbWidth > lbTotalWidth ){
                    rows.push( xoffset );

                    xoffset = lbWidth;
                }else{
                    xoffset += lbPH + lbWidth;
                }
                return rows;                
            }, lbRows
        )(loadbalancers);
        // process last row
        lbRows.push( xoffset );

        // Phase II: Draw the LBs
        var row = 0;
        xoffset = (lbTotalWidth - lbRows[row])/2;
        yoffset = 5;
        
        fp.map(
            lb => {
    console.log(xoffset, lbWidth);
                if( xoffset + lbPH + lbWidth > lbTotalWidth ){
                    row++

                    xoffset = (lbTotalWidth - lbRows[row])/2;
                    yoffset += 20
                }

                lbWidth = drawLoadBalancer( lb, lbsX + xoffset, lbsY + yoffset );

                xoffset += lbPH + lbWidth;
            }
        )(loadbalancers);

        return yoffset
    }

    var lbNodeX = 40;
    

    function getLoadBalancerWidth(lb){
        return (lbNodeX + lbNodeWidthAndHPad*lb.nodes.length)*0.6;
    }
    function drawLoadBalancer(lb, xoffset, yoffset ){
        var lbNodeT = fp.template(`<use xlink:href="#<%= comp %>" transform="scale(0.6) translate(<%= x %>,<%= y %>)"/>`);
    
        var lbT = fp.template(`<g transform="translate(<%= x %>,<%= y %>)">
        <rect id="node1" x="0" y="0" width="<%= width %>" height="17.6" style="fill:#ffffff;stroke:#bfbfbf">
                <title><%= tooltip %></title>
        </rect> 
        <use xlink:href="#lb">
        <svg id="lb" width="600" height="100%">
            <text id="text1488" x="12.5" y="11.5" style="font-weight:bold;font-size:9px;font-family:Arial;fill:#ff6601;text-decoration: underline;" alignment-baseline="middle" text-anchor="middle">LB:</text>
            </svg>
        </use>
        <%= lbcomps %>
</g>`);

    
        var lbNodesSvg = []

        var lbNodeH = 8;
        var lbNodeI = 0;

        fp.reduce(
            (acc, lbcomp) => {
                lbNodesSvg.push( lbNodeT( { comp: lb.comp.toLowerCase(), x: lbNodeX + lbNodeWidthAndHPad*lbNodeI++, y: lbNodeH } ) );

                return acc;
            }, lbNodesSvg

        )(lb.nodes);

        lbWidth = getLoadBalancerWidth(lb)

        nodesSvg.push( lbT({x: xoffset, y: yoffset, width: lbWidth, tooltip: "tooltip", lbcomps: lbNodesSvg.join("\n")} ) );

        return getLoadBalancerWidth(lb);
    }
    //------------------------------------- load balancers ---

    // Global Load Balancers geometry
    var globalLbH = 20;
        
    // TODO: [ ] soft-code and calc from the DC geometry
    // TODO: SIC: DCs could have different sizes, ie, hight and width. 
    //      in addition, there potencially could be a 'long' LB that would be
    //      wider than its DC.
    //      But right now, its biggest DC defines  

    // Planet Pass I: get Topology Geometry

    var planetTotalWidth = fp.map(
        region => 2*regionPaddingH+ getRegionWidth( getTierSizes(region) )
    )(topology.regions).reduce( (twidth, rwidth) => twidth + regionSpacingH +  rwidth );


    
    globalLbH += drawLoadBalancers( topology.loadbalancers, 0, 10, planetTotalWidth );


    // Iterate by regions/data centres for Load Balancers
    regionX += regionPaddingH

    var lbHeights = [];
    fp.map(region => {
        var regionWidth = getRegionWidth(getTierSizes(region));

        regionY = globalLbH + regionHeader;

        if( separatorFlipOn ){
            nodesSvg.push( regionSeparatorTemplate({ 
                x1: regionX + regionSpacingH/2, y1: regionY, 
                x2: regionX + regionSpacingH/2, y2: separatorY
            }) );  

            regionX += regionSpacingH;
        }else{
            separatorFlipOn = true;
        }

        nodesSvg.push( regionHeaderTemplate({ 
            x: regionX, y: regionY + 4 , 
            name: region.name.toUpperCase(),  
        }) );  
        regionY += regionHeader;

        // dc-level load balances
        
        // TODO: XXX: hard-coded width for LB 'viewport'
        lbHeight = drawLoadBalancers( region.loadbalancers, regionX, regionY, regionWidth ) + dcLbH;
        lbHeights.push( lbHeight );

        separatorY = regionY;

        regionX += regionWidth;
        regionX += regionPaddingH
    })(topology.regions)
    
    // Calc regionY for Region Subnets
    regionY = globalLbH + regionHeader + fp.max(lbHeights);

    // Iterate by regions/data centres for Edge Subnets
    regionX = regionPaddingH;

    var regionHeights = []
    fp.map(region => {
        var regionWidth = getRegionWidth(getTierSizes(region));

        regionHeight = drawRegion( region, regionX, regionY );
        regionHeights.push (regionHeight );

        regionX += regionSpacingH;
        
        separatorY = regionY;

        regionX += regionWidth;
        regionX += regionPaddingH
    })(topology.regions)
    regionX += regionPaddingH

    maxRegionHeight = fp.max(regionHeights) + regionPaddingH*2;

    function getTierSizes(region){
        // Iterate collection of subnets by tier -- vertical layout
        var tierSizes = fp.keyBy( "tier" )
        (fp.map( tier => {

        var tierSize = fp.map( 
                subnet => {
                    var subnetWidth = getSubnetWidth( subnet );
                    var subnetMaxComps = fp.max( fp.map( node => node.components.length )(subnet.nodes) );

                    return { width: subnetWidth, maxComps: subnetMaxComps };
                })(
                fp.filter( { "tier": tier.name } )(region.subnets)
            ).reduce( ( tierSize, subnetSize ) => { 
                            return { 
                                width: tierSize.width === 0 ? subnetSize.width : tierSize.width + subnetSpacingH + subnetSize.width, 
                                maxNodeComponents: tierSize.maxNodeComponents > subnetSize.maxComps ? tierSize.maxNodeComponents : subnetSize.maxComps
                            }
            }, { width: 0, maxNodeComponents: 0 }  );

            return { tier: tier.name, width: tierSize.width, nodeHeight: getNodeHeight( tierSize.maxNodeComponents ) }

        })(region.tiers));

        return tierSizes;
    }


    function getRegionWidth(tierSizes){
        var maxTierWidth = fp(tierSizes).reduce( 
            (maxtiersize, tiersize) => { 
                return maxtiersize > tiersize.width? maxtiersize: tiersize.width 
            }, 0
        )
        
        return maxTierWidth
    }

    function drawRegion( region, regionX, regionY ){
        // Pass I: calculate Maximum Tier Width and Tier Subnets TotalHeight Array
        var tierSizes = getTierSizes(region);
        var maxTierWidth = getRegionWidth(tierSizes);

        // Pass II: generate tier layout
        var subnetX = 0;
        var subnetY = 0;

        fp.map( tier => {

            nodesSvg.push( tierHeaderTemplate({ 
                x1: regionX + 0, y1: regionY + subnetY, 
                x2: regionX + maxTierWidth, y2: regionY + subnetY,
                x: regionX + maxTierWidth, y: regionY + subnetY+8, 
                name: tier.name.toUpperCase(),  
            }) );

            subnetX = ( maxTierWidth - tierSizes[ tier.name ].width )/2;    // Center this tier subnets
            subnetY += tierHeader

            fp.map(
                subnet => {
                    //console.log(subnet);              

                    drawSubnet( subnet, tierSizes[tier.name].nodeHeight, regionX + subnetX, regionY + subnetY )

                    subnetX += getSubnetWidth( subnet ) + subnetSpacingH;


                })(
                fp.filter( { "tier": tier.name } )(region.subnets)
            )
            subnetY += tierSizes[tier.name].nodeHeight+subnetFooter + tierSpacingV;

        })( region.tiers );

        return subnetY;   // region Width
   }

    function getSubnetWidth( subnet ){
        return subnet.nodes.length* nodeWidth + (subnet.nodes.length-1)*nodeSpacingH + subnetPaddingH*2;
    }


    function drawSubnet( subnet, nodeHeight, subnetX, subnetY  ){

            var subnetWidth = getSubnetWidth( subnet );

            nodesSvg.push( subnetTemplate(
                {   
                    id: 1, x: subnetX, y: subnetY, 
                    width:  subnetWidth, height: nodeHeight+subnetFooter,
                    tooltip: "Subnet: " + subnet.name,
                    text: function() { return subnet.name },
                    textx: function(){ return this.x + subnetWidth/2 }, 
                }) 
            );

            var nodeX = 0;
            var nodeY = 0;

            // Generate nodes
            fp.reduce(
                (acc, node) => {
                        // console.log(i.components); 
                    
                        acc.push( nodeTemplate({ 
                            id: node.id, 
                            tooltip: "Host Name: " + node.hostname,
                            x: 1+subnetX + subnetPaddingH + nodeX, 
                            y: subnetY + subnetPaddingV + nodeY, 
                            height: nodeHeight,
                            textx: function(){ return this.x + nodeWidth/2 }, 
                            texty: function(){ return this.y + this.height + 8 },
                            text: function() { return node.hostname }
                         }) );
                    
                        function drawComponents(comps, compX, compY, compInc){

                            var comps = fp(comps).reduce(
                                (acc, c) => {
                                    acc.push( compTemplate({comp: c.comp.toLowerCase(), x: subnetX + subnetPaddingH + nodeX + compX, y: subnetY + subnetPaddingV + compY }) );
                                    compY += compInc();

                                    return acc;
                                }, nodesSvg
                            );      

                            return comps;          
                        };

                        // Generate components: Apigee
                        acc.push( drawComponents( fp(node.components).filter(comp=>isApigee[comp.comp]), compPadding, compPadding, compY => compHeight + compSpacingV ) );

                        // Generate components: 3rd Parties
                        acc.push( drawComponents( fp(node.components).filter(comp=>!isApigee[comp.comp]).reverse(), compPadding, nodeHeight - compPadding - compHeight -3, compY => -(compHeight + compSpacingV) ) );
                       
                        nodeX += nodeWidth + nodeSpacingH;
                        return acc;
                    }, nodesSvg 
                )(subnet.nodes);
    }


    //---------------------------------
    // console.log(svgHeader);
    // console.log(nodesSvg.join("\n"));
    // console.log(svgFooter);


	return [
		svgHeaderTemplate( { height: globalLbH + dcLbH + regionHeader +  maxRegionHeight + regionFooter + 10, width: regionX } ),
		svgSymbols,
		nodesSvg.join('\n'),
		svgFooter
	].join("\n")
}
	
if (typeof module !== 'undefined' && typeof module.exports !== 'undefined'){
 var fp = require("lodash/fp");
  module.exports = generateSvgDiagram;
}else{
  var fp = _.noConflict();
  window.generateSvgDiagram = generateSvgDiagram;
}

})()
