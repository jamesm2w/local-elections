// Based on math from https://github.com/slashme/parliamentdiagram
// Initialize useful calculated fields:
// Total number of seats per number of rows in diagram:
// index + 1 is the number of rows to make a diagram with seats <= element at index

let rowTotals = [4, 15, 33, 61, 95, 138, 189, 247, 313, 388, 469, 559, 657, 762, 876, 997, 1126, 1263, 1408, 1560, 1722, 1889, 2066, 2250, 2442, 2641, 2850, 3064, 3289, 3519, 3759, 4005, 4261, 4522, 4794, 5071, 5358, 5652, 5953, 6263, 6581, 6906, 7239, 7581, 7929, 8287, 8650, 9024, 9404, 9793, 10187, 10594, 11003, 11425, 11850, 12288, 12729, 13183, 13638, 14109, 14580, 15066, 15553, 16055, 16557, 17075, 17592, 18126, 18660, 19208, 19758, 20323, 20888, 21468, 22050, 22645, 23243, 23853, 24467, 25094, 25723, 26364, 27011, 27667, 28329, 29001, 29679, 30367, 31061];

/**
* createArch 
* @description Creates an SVG string showing the passed parties in an arch diagram
* @param delegateParties Array of party objects. Required properties: name (name of party), 
*                        colour (colour of dot), seats (number of seats)
* @return string SVG string of delegates as dots in an arch with the total seat label across the bottom.
* @author slashme - https://github.com/slashme/ Original Python Code
* @author jamesm2w - https://github.com/jamesm2w/ Translation to JS + minor refraction
*/
function createArch(delegateParties=[{"name":"Other","colour":"#DDD","seats": 1}], name="") {
    // Keep a running total of the number of delegates in the diagram, for use later.
    let totalDelegates = 0;

    for (let party of delegateParties) {
      totalDelegates += party.seats;
    }
        
    // Initialize counters for use in layout
    let delegateCounter = 0;
    let totalLines = 0;

    let rows = 0;
    
    //Figure out how many rows are needed:
    for (let [index, delegateTotals] of rowTotals.entries()) {
      if (delegateTotals >= totalDelegates) {
        rows = index + 1;
        break;
      }
    }

    // Maximum radius of spot is 0.5/rows; leave a bit of space.
    // Radius of dot is inversely proportional to the number of rows in the whole diagram
    let radius = 0.4 / rows;
    
    // Open svg file for writing:
    let svgString = "";
    
    // Write svg header:
    svgString +=
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n';
    svgString +='<svg xmlns:svg="http://www.w3.org/2000/svg"\n';
    svgString += ' xmlns="http://www.w3.org/2000/svg" version="1.1"\n';
    
    // Make 350 px wide, 175 px high diagram with a 5 px blank border
    svgString += `viewBox='0 0 360 ${name == "" ? 185 : 205}'>\n`;
    svgString +=
        "<!-- Created with the Wikimedia parliament diagram creator (http://tools.wmflabs.org/parliamentdiagram/parliamentinputform.html) -->\n";
    svgString += "<g>\n";
    
    // Print the number of seats in the middle at the bottom.
    svgString +=
        `<text x="175" y="175" style="font-size:36px; font-weight:bold; text-align:center; text-anchor:middle; font-family:sans-serif;">
          ${totalDelegates}
        </text>\n`;

    if (name != "") {
      svgString += `<text x="175" y="200" style="font-size:20px; font-weight:bold; text-align:center; text-anchor:middle; font-family:sans-serif;">${name}</text>`
    }

    // Create list of all the spots centre coordinates
    let posList = [];
    for (let i = 1; i < rows; i++) {
      // Each row can contain pi/(2asin(2/(3n+4i-2))) spots, where n is the number of rows and i is the number of the current row.
      // Fill each row proportionally to the "fullness" of the diagram, up to the second-last row.

      // Number of delegates to put on this row
      let J = totalDelegates / rowTotals[rows-1] *
                    Math.PI/(2*Math.asin(2.0/(3.0*rows+4.0*i-2.0)))
      //console.log(J)
      J = Math.floor(J);

      // The radius of the row (length from pole to position of dots on arc) of the ith row in an N-row diagram (Ri) is (3*N+4*i-2)/(4*N)
      let R = (3 * rows + 4 * i - 2) / (4 * rows)
      
      if (J == 1) {
          posList.push([Math.PI / 2, 1.75 * R, R]);
      } else {
          for (let j = 0; j < J; j++) {
            // The angle to a spot is n.(pi-2sin(r/Ri))/(Ni-1)+sin(r/Ri) where Ni is the number in the arc
            // x = R.cos(theta) + 1.75
            // y = R.sin(theta)
              
            let angle = j * 
              (Math.PI - 2 * Math.sin(radius / R)) / (J - 1)
               + Math.sin(radius / R);

            posList.push([angle, R * Math.cos(angle) + 1.75, R * Math.sin(angle)]);
          }
      }
    }   

    // Deal with the leftovers
    // Now whatever seats are left go into the outside row:
    let J = totalDelegates - posList.length; // Number of delegates to place on outside row
    let R = (7.0 * rows - 2.0) / (4.0 * rows); // Radius of the outside row

    if (J == 1){ 
      posList.push([Math.PI / 2, 1.75 * R, R]);

    } else {

      for (let j = 0; j < J; j++) {
        let angle = parseFloat(j) * 
          (Math.PI-2.0*Math.sin(radius/R)) /(
          (parseFloat(J) - 1))+Math.sin(radius/R); 
  
        posList.push([angle, R * Math.cos(angle) + 1.75, R * Math.sin(angle)]);
      }
    }

    //poslist.sort(reverse=True)
    posList.sort((first, second) => {
      if (first[0] > second[0]) return -1;
      else if (second[0] > first[0]) return 1
      else return 0;
    });

    let Counter = 0;  // Number of spots drawn
  
    for (let i = 0; i < delegateParties.length; i++) {
      let party = delegateParties[i];
      // Make each party's blocks an svg group
      svgString += `<g style="fill: ${party.colour}; stroke: ${party.border}" id="${party.name.replace(" ", "")}">\n`;

      // poslist => {1: x-coord, 2: y-coord}

      let loopEnd = Counter + party.seats;
      while (Counter < loopEnd){
        //console.log(posList[Counter][0]);
        svgString += `<circle cx="${Math.round((posList[Counter][1] * 100.0) * 100) / 100}" cy="${Math.round((100 * (1.75 - posList[Counter][2])) * 100) / 100}" r="${radius * 100}"/>\n`;

        Counter++;
      }

      svgString += '</g>\n';

    }
    svgString += '</g>\n';
    svgString += '</svg>\n';

    return svgString;
}