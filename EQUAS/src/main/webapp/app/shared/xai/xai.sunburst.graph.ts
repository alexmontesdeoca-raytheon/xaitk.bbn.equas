declare var d3: any;
export class SunburstGraph {
    public questionCsv: any;
    public wordHierarchy;

    private leafNodeText = '.';
    private filterFactor = 0.008; // 0.005 radians = 0.29 degrees
    private opacityUnFocus = 0.3;
    private totalNumberOfQuestions;
    private allNodes;

    // Dimensions of sunburst.
    private width = 1000;
    private height = 800;
    // var radius = Math.min(width, height) / 3;
    private radius = Math.min(this.width, this.height) / 3;
    // Total size of all segments; we set this later, after loading the data.
    private totalSize = 0;
    // Breadcrumb dimensions: width, height, spacing, width of tip/tail.
    private b = {
        w: 75,
        h: 30,
        s: 3,
        t: 10
    };

    private temp;
    private ngramJson;
    private wordArray = [];

    private Prefix = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18'];

    // Mapping of step names to colors.
    private colors = {
        the: '#aed',
        is: '#13a',
        what: '#a58',
        are: '#fcb',
        this: '#28d',
        in: '#f9c',
        on: '#8a6',
        a: '#4c4',
        of: '#384',
        how: '#331',
        many: '#b06',
        color: '#61b',
        there: '#494',
        does: '#294',
        man: '#e4d',
        people: '#beb',
        to: '#fce',
        picture: '#894',
        wearing: '#fcb',
        it: '#cf2',
        these: '#3ca',
        where: '#d87',
        have: '#9d8',
        kind: '#381',
        or: '#02e',
        person: '#d50',
        photo: '#e97',
        do: '#87a',
        you: '#7a0',
        doing: '#fb8',
        type: '#afa',
        animal: '#3ab',
        woman: '#975',
        they: '#a9a',
        room: '#766',
        be: '#0ed',
        holding: '#611',
        animals: '#2f0',
        for: '#994',
        can: '#d9c',
        dog: '#a85',
        at: '#d0d',
        cat: '#10c',
        train: '#b0d',
        that: '#672',
        his: '#a6d',
        sign: '#058',
        he: '#a0e',
        which: '#65f',
        water: '#813',
        any: '#e92',
        shirt: '#75c',
        food: '#2bb',
        bus: '#a52',
        why: '#a73',
        an: '#6db',
        see: '#355',
        made: '#fe4',
        playing: '#adc',
        sitting: '#cc0',
        with: '#703',
        mans: '#a50',
        plane: '#ed7',
        plate: '#382',
        sport: '#1d4',
        shown: '#009',
        time: '#2cf',
        table: '#67b',
        right: '#927',
        taken: '#c42',
        left: '#ae2',
        was: '#88b',
        white: '#dca',
        number: '#45b',
        background: '#b72',
        standing: '#aef',
        pizza: '#74b',
        who: '#219',
        being: '#f2f',
        look: '#42c',
        from: '#38b',
        has: '#c3a',
        boy: '#13a',
        her: '#a05',
        all: '#18a',
        and: '#1eb',
        wall: '#594',
        ground: '#293',
        girl: '#7a3',
        she: '#ccb',
        street: '#294',
        sky: '#0b0',
        say: '#cf8',
        hand: '#249',
        red: '#3b2',
        top: '#cb3',
        day: '#ebb',
        eating: '#5e6',
        clock: '#7c2',
        would: '#f6b',
        looking: '#5ca',
        like: '#652',
        visible: '#ebd',
        men: '#7fb',
        building: '#c19',
        bear: '#620',
        truck: '#cdd',
        here: '#019',
        up: '#595',
        game: '#599',
        image: '#61d',
        front: '#f0b',
        name: '#39f',
        going: '#7b2',
        toilet: '#2c4',
        same: '#d2d',
        out: '#d53',
        bird: '#41e',
        one: '#998',
        behind: '#091',
        fruit: '#023',
        car: '#83a',
        green: '#0c9',
        riding: '#c1b',
        child: '#e25',
        light: '#e64',
        horse: '#8e8',
        trees: '#00b',
        black: '#8ae',
        seen: '#bb2',
        two: '#495',
        scene: '#b73',
        bed: '#e1c',
        their: '#a10',
        brand: '#aa8',
        object: '#a53',
        cake: '#4f6',
        hat: '#f8f',
        ball: '#5bc',
        blue: '#c5b',
        flowers: '#ff1',
        hair: '#1e9',
        colors: '#3b3',
        did: '#4f2',
        vehicle: '#1bd',
        giraffe: '#875',
        elephant: '#5c7',
        side: '#056',
        pictured: '#926',
        could: '#6f3',
        root: '#353d47',
        '.': '#fff'
    };
    private vis;
    private partition;
    private arc;

    constructor(questionCsv: any) {
        this.questionCsv = questionCsv;

        // d3.json('ngram.json', (error, ngramResults) => {
        //     if (error) {
        //         return console.warn(error);
        //     }
        //     this.ngramJson = ngramResults;
        //     // window.alert(ngramJson["what"]["topAns"][0][0]);
        // });

        this.vis = d3
            .select('#chart')
            .append('svg:svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .append('svg:g')
            .attr('id', 'container')
            .attr('transform', 'translate(' + this.width / 2 + ',' + this.height / 2 + ')');

        this.partition = d3.layout
            .partition()
            .size([2 * Math.PI, this.radius * this.radius])
            .value(d => {
                return d.size;
            });

        this.arc = d3.svg
            .arc()
            .startAngle(d => {
                return d.x;
            })
            .endAngle(d => {
                return d.x + d.dx + 0.01;
            })
            .innerRadius(d => {
                return Math.sqrt(d.y) * 1.5;
            })
            .outerRadius(d => {
                return Math.sqrt(d.y + d.dy) * 1.5;
            });

        // Use d3.text and d3.csv.parseRows so that we do not need to have a header
        // row, and can receive the csv as an array of arrays.
        // d3.text("visit-sequences.csv", function (text) {
        const csv = d3.csv.parseRows(this.questionCsv);
        this.wordHierarchy = this.buildHierarchy(csv);
        this.createVisualization(this.wordHierarchy);
    }

    public searchInputChange(searchInputText) {
        // let searchInputText = document.getElementById('txtSearch').value;
        searchInputText = searchInputText.toLowerCase();
        const searchInputArray = searchInputText.split(' ');
        const searchInputLastWord = searchInputArray.slice(-1)[0];

        // Get list of next possible word
        let nextWordStr = '';
        const lastWordinChain = this.pluckLastNode(searchInputArray, this.allNodes[0]); // sequenceArray[sequenceArray.length -1]
        if (lastWordinChain !== undefined) {
            lastWordinChain.children.sort((a, b) => {
                return b.value - a.value;
            });
            if (searchInputLastWord === '') {
                // if (searchInputLastWord === allNodes[0]) {//If root node
                //     createVisualization(allNodes);
                // } else {

                // }
                this.mouseover()(lastWordinChain, null);
                this.click()(lastWordinChain, null);
                this.mouseover()(lastWordinChain, null);
            }

            let hitCount = 0;
            for (let i = 0; i < lastWordinChain.children.length; i++) {
                const nextWord = lastWordinChain.children[i];
                if (nextWord.name.startsWith(searchInputLastWord)) {
                    hitCount += 1;
                    const nextWordPercent = 100 * nextWord.value / this.totalNumberOfQuestions;
                    const nextWordPercentStr = nextWordPercent.toPrecision(3);
                    // if (nextWordPercent < .01) {
                    //     nextWordPercentStr = '< 0.01';
                    // }
                    nextWordStr += nextWord.name.padEnd(15, ' ') + '(' + nextWordPercentStr + '%) <br>';

                    if (searchInputLastWord !== '' && nextWord.name === searchInputLastWord) {
                        // Exact match highlight node in sunburst
                        this.mouseover()(nextWord, null);
                    }
                }
            }
            if (hitCount > 0) {
                nextWordStr = 'Next word results (' + hitCount + ')<br><br>' + nextWordStr;
            } else {
                nextWordStr = 'no matches';
            }
        }

        const divrootWords = d3.select('#rootWords');
        divrootWords.html(nextWordStr);
    }
    public pluckLastNode(searchArray, treeBranch) {
        if (searchArray[0] === '') {
            return treeBranch;
        }
        const isLastWord = searchArray.length === 1;
        if (isLastWord) {
            return treeBranch;
        }
        // for (let searchIndex = 0; searchIndex < searchArray.length; searchIndex++) {
        const word = searchArray[0];
        for (let n = 0; n < treeBranch.children.length; n++) {
            const treeNode = treeBranch.children[n];
            if (treeNode.name === word) {
                // if (searchIndex < searchArray.length)
                searchArray.shift(); // Remove first element
                return this.pluckLastNode(searchArray, treeNode);
                // return treeNode;
            }
        }
        // return treeBranch;
        // }
    }

    public getRandomColor() {
        const letters = '789ABCD'.split('');
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 6)];
        }
        return color;
    }

    public getColor(colors, name) {
        if (colors[name] !== undefined) {
            return colors[name];
        } else {
            const a = this.getRandomColor();
            return a;
        }
    }

    // doit();

    // function hello() {
    //     wordArray = []
    //     d3.select("#chart").selectAll("svg").remove();
    //     d3.select("#trail").style("visibility", "hidden");
    //     d3.select("#list").style("visibility", "hidden");
    //     doit();
    // }

    // function doit() {

    // var totalquest = 248349;

    // d3.text('annotations.csv', function(text) {
    //     var csv = d3.csv.parseRows(text);
    //     var json = buildHierarchy(csv);
    //     createVisualization(json);
    // });

    // Main function to draw and set up the visualization, once we have the data.
    public createVisualization(wordHierarchy) {
        // Basic setup of page elements.
        this.initializeBreadcrumbTrail();
        // drawLegend();
        // drawwans();
        //        d3.select("#toggleanswer").on("click", showans);

        // Bounding circle underneath the sunburst, to make it easier to detect
        // when the mouse leaves the parent g.
        this.vis
            .append('svg:circle')
            .attr('r', this.radius)
            .style('opacity', 0);

        // For efficiency, filter nodes to keep only those large enough to see.
        this.allNodes = this.partition.nodes(wordHierarchy).filter(d => {
            return d.dx > this.filterFactor;
        });

        const path = this.vis
            .data([wordHierarchy])
            .selectAll('path')
            .data(this.allNodes)
            .enter()
            .append('svg:path')
            .attr('display', d => {
                return d.depth ? null : 'none';
            })
            .attr('d', this.arc)
            .attr('fill-rule', 'evenodd')
            .style('fill', d => {
                return this.getColor(this.colors, d.name);
            })
            .style('opacity', this.opacityUnFocus)
            .on('mouseover', this.mouseover())
            .on('click', this.click());
        // .call(this.unrollSunburst());

        // Add the mouseleave handler to the bounding circle.
        d3.select('#container').on('mouseleave', this.mouseleave());

        // Get total size of the tree = value of root node from partition.
        this.totalSize = path.node().__data__.value;

        // Get list of next possible word
        const lastWordinChain = this.allNodes[0]; // sequenceArray[sequenceArray.length -1]
        lastWordinChain.children.sort((a, b) => {
            return b.value - a.value;
        });
        let nextWordStr = 'Root words (' + lastWordinChain.children.length + ')<br><br>';
        for (let i = 0; i < lastWordinChain.children.length; i++) {
            const nextWord = lastWordinChain.children[i];
            const nextWordPercent = 100 * nextWord.value / this.totalNumberOfQuestions;
            const nextWordPercentStr = nextWordPercent.toPrecision(3);
            // if (nextWordPercent < .01) {
            //     nextWordPercentStr = '< 0.01';
            // }
            nextWordStr += nextWord.name.padEnd(15, ' ') + '(' + nextWordPercentStr + '%) <br>';
        }

        const divrootWords = d3.select('#rootWords');
        divrootWords.html(nextWordStr);
    }

    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root.
    public getAncestors(node) {
        const path = [];
        let current = node;
        while (current.parent) {
            if (current.name !== this.leafNodeText) {
                path.unshift(current);
            }
            current = current.parent;
        }
        path.unshift(current); // Add root node
        return path;
    }

    // Fade all but the current sequence, and show it in the breadcrumb trail.
    public mouseover(): (d, i) => void {
        return (d, i) => {
            if (d.name === this.leafNodeText) {
                return;
            }
            const ques = d.value;
            const totalp = (100 * d.value / this.totalNumberOfQuestions).toPrecision(3);
            const percentage = 100 * d.value / this.totalNumberOfQuestions;
            let percentageString = percentage.toPrecision(3) + '%';
            if (percentage < 0.1) {
                percentageString = '< 0.1%';
            }
            const totalpstring = '/' + this.totalNumberOfQuestions + ' = ' + totalp + '%';

            d3.select('#percentage').text(percentageString);

            d3.select('#explanation').style('visibility', '');

            // https://hstefanski.wordpress.com/2015/10/25/responding-to-d3-events-in-typescript/
            const sequenceArray = this.getAncestors(d);
            const wordArray = [];
            for (let j = 0; j < sequenceArray.length; j++) {
                wordArray.push(sequenceArray[j].name);
            }

            this.updateBreadcrumbs(sequenceArray, percentageString, ques, totalpstring);

            const listDiv = d3.select('#list');
            this.showTopAnswers(wordArray);

            listDiv.style('visibility', '');

            // Fade all the segments.
            d3.selectAll('path').style('opacity', this.opacityUnFocus);

            // Then highlight only those that are an ancestor of the current segment.
            this.vis
                .selectAll('path')
                .filter(node => {
                    return sequenceArray.indexOf(node) >= 0;
                })
                .style('opacity', 1);
        };
    }

    public showTopAnswers(wordArray) {
        const ans = d3.select('#anss');
        let freq = '';
        const ans2 = d3.select('#anss2');
        let word = '';
        try {
            if (wordArray.length > 0) {
                for (let i = 0; i < this.ngramJson[wordArray.join(' ')]['topAns'].length; i++) {
                    freq = freq + this.ngramJson[wordArray.join(' ')]['topAns'][i][1] + '<br>';
                }
                for (let i = 0; i < this.ngramJson[wordArray.join(' ')]['topAns'].length; i++) {
                    word = word + this.ngramJson[wordArray.join(' ')]['topAns'][i][0] + '<br>';
                }
            }
        } catch (error) {
            console.log("Can't find top answers for (" + wordArray.join(' ') + ')');
        }
        ans.html(freq);
        ans2.html(word);
    }

    // Restore everything to full opacity when moving off the visualization.
    public mouseleave(): (d, i) => void {
        return (d, i) => {
            // Hide the breadcrumb trail
            d3.select('#trail').style('visibility', 'hidden');

            // Deactivate all segments during transition.
            d3.selectAll('path').on('mouseover', this.mouseover());

            d3.select('#list').style('visibility', 'hidden');

            // Transition each segment to full opacity and then reactivate it.
            d3
                .selectAll('path')
                .transition()
                .duration(0)
                .style('opacity', this.opacityUnFocus);
            // .each('end', () => {
            //     d3.select(this).on('mouseover', this.mouseover());
            // });

            d3
                .select('#explanation')
                .transition()
                .duration(0)
                .style('visibility', 'hidden');
        };
    }

    public initializeBreadcrumbTrail() {
        // Add the svg area.
        const trail = d3
            .select('#sequence')
            .append('svg:svg')
            .attr('width', 1500)
            .attr('height', 50)
            .attr('id', 'trail');
        // Add the label at the end, for the percentage.
        trail
            .append('svg:text')
            .attr('id', 'endlabel')
            .style('stroke', '#000');
    }

    // Generate a string that describes the points of a breadcrumb polygon.
    public breadcrumbPoints(): (d, i) => void {
        return (d, i) => {
            const points = [];
            points.push('0,0');
            points.push(this.b.w + ',0');
            points.push(this.b.w + this.b.t + ',' + this.b.h / 2);
            points.push(this.b.w + ',' + this.b.h);
            points.push('0,' + this.b.h);
            if (i > 0) {
                // Leftmost breadcrumb; don't include 6th vertex.
                points.push(this.b.t + ',' + this.b.h / 2);
            }
            return points.join(' ');
        };
    }

    // Update the breadcrumb trail to show the current sequence and percentage.
    public updateBreadcrumbs(nodeArray, percentageString, ques, totalpstring) {
        // Data join; key function combines name and depth (= position in sequence).
        const g = d3
            .select('#trail')
            .selectAll('g')
            .data(
                nodeArray,
                d => {
                    return d.name + d.depth;
                }
                // ).on('click', this.mouseover()).on('click', this.click());
            )
            .on('click', (d, i) => {
                this.mouseover()(d, i);
                this.click()(d, i);
            });

        // Add breadcrumb and label for entering nodes.
        const entering = g.enter().append('svg:g');

        entering
            .append('svg:polygon')
            .attr('points', this.breadcrumbPoints())
            .style('fill', d => {
                return this.getColor(this.colors, d.name);
            });

        entering
            .append('svg:text')
            .attr('x', (this.b.w + this.b.t) / 2)
            .attr('y', this.b.h / 2)
            .attr('dy', '0.55em')
            .attr('text-anchor', 'middle')
            .style('stroke', '#FFFF')
            .text(d => {
                return d.name;
            });

        // Set position for entering and updating nodes.
        g.attr('transform', (d, i) => {
            return 'translate(' + i * (this.b.w + this.b.s) + ', 0)';
        });

        // Remove exiting nodes.
        g.exit().remove();

        // Now move and update the percentage at the end.
        d3
            .select('#trail')
            .select('#endlabel')
            .attr('x', (nodeArray.length + 1.2) * (this.b.w + this.b.s))
            .attr('y', this.b.h / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'middle')
            .text(ques + totalpstring);

        // Make the breadcrumb trail visible, if it's hidden.
        d3.select('#trail').style('visibility', '');
    }

    // Restore everything to full opacity when moving off the visualization.
    public mouseleaveclick(): (d, i) => void {
        return (d, i) => {
            const ques = this.temp.value;
            const totalp = (100 * this.temp.value / this.totalNumberOfQuestions).toPrecision(3);
            const percentage = 100 * this.temp.value / this.totalNumberOfQuestions;
            let percentageString = percentage.toPrecision(3) + '%';
            if (percentage < 0.1) {
                percentageString = '< 0.1%';
            }
            const totalpstring = '/' + this.totalNumberOfQuestions + ' = ' + totalp + '%';

            d3.select('#percentage').text(percentageString);

            d3.select('#explanation').style('visibility', '');

            d3.select('#list').style('visibility', '');

            const sequenceArray = this.getAncestors(this.temp);
            const wordArray = [];
            for (let j = 0; j < sequenceArray.length; j++) {
                wordArray.push(sequenceArray[j].name);
            }

            this.updateBreadcrumbs(sequenceArray, percentageString, ques, totalpstring);

            this.showTopAnswers(wordArray);

            // Hide the breadcrumb trail
            d3.select('#trail').style('visibility', '');

            // Deactivate all segments during transition.
            d3.selectAll('path').on('mouseover', this.mouseover());

            // Transition each segment to full opacity and then reactivate it.
            d3
                .selectAll('path')
                .transition()
                .duration(0)
                .style('opacity', this.opacityUnFocus);
            // .each('end', () => {
            //     d3.select(this).on('mouseover', this.mouseover());
            // });

            d3
                .select('#explanation')
                .transition()
                .duration(0)
                .style('visibility', 'hidden');
        };
    }

    public click(): (d, i) => void {
        return (d, i) => {
            if (d.name === this.leafNodeText) {
                return;
            }

            this.temp = d;

            // update the search text with the item that was clicked
            const sequenceArray = this.getAncestors(d);
            let filterText = '';
            for (let index = 1; index < sequenceArray.length; index++) {
                filterText += sequenceArray[index].name + ' ';
            }
            (<HTMLInputElement>document.getElementById('sunburstFilterText')).value = filterText;

            d3
                .select('#container')
                .selectAll('path')
                .remove();

            const nodes = this.partition.nodes(d).filter(node => {
                return node.dx > this.filterFactor; // 0.005 radians = 0.29 degrees
            });

            const path = this.vis
                .data([d])
                .selectAll('path')
                .data(nodes)
                .enter()
                .append('svg:path')
                .attr('display', node => {
                    return node.depth ? null : 'none';
                })
                .attr('d', this.arc)
                .attr('fill-rule', 'evenodd')
                .style('fill', node => {
                    return this.getColor(this.colors, node.name);
                })
                // .style("stroke", "#D6CACA")
                .style('opacity', this.opacityUnFocus)
                .on('mouseover', this.mouseover())
                .on('click', this.click());

            // Add the mouseleave handler to the bounding circle.
            d3.select('#container').on('mouseleave', this.mouseleaveclick());

            // Get total size of the tree = value of root node from partition.
            this.totalSize = path.node().__data__.value;
            // console.log(totalSize);
        };
    }
    public unrollSunburst(): (d, i) => void {
        return (d, i) => {
            const perimeterDifference = d3.scale.linear().range([this.radius * 2 * Math.PI, 8]);
            d3
                .transition()
                .delay(1000)
                .duration(2000)
                .tween('unroll', () => {
                    return t => {
                        const diff = perimeterDifference(t);
                        const innerRadius = this.radius * this.radius * 2 * Math.PI / diff - this.radius;
                        const wedgeAngle = diff / this.radius;

                        this.vis.attr('transform', 'translate(' + this.width / 2 + ' ' + (this.height / 2 - innerRadius) + ')');
                        const scaleSqrt = d3.scale.sqrt();
                        scaleSqrt.range([innerRadius, innerRadius + this.radius]);
                        const angle = d3.scale.linear();
                        angle.range([Math.PI + wedgeAngle / 2, Math.PI - wedgeAngle / 2]);
                        d.attr('d', this.arc);
                    };
                });
            // .on('end', () => {
            //     perimeterDifference.range(perimeterDifference.range().reverse());
            //     // slices.call(animate);
            // });
        };
    }

    // Take a 2-column CSV and transform it into a hierarchical structure suitable
    // for a partition layout. The first column is a sequence of step names, from
    // root to leaf, separated by hyphens. The second column is a count of how
    // often that sequence occurred.
    public buildHierarchy(csv) {
        const root = { name: 'root', children: [] };

        this.totalNumberOfQuestions = 0;
        // //Calc the Total Number Of Questions
        // for (var i = 0; i < csv.length; i++) {
        //     var size = +csv[i][1];
        //     totalNumberOfQuestions += size;
        // }

        for (let i = 0; i < csv.length; i++) {
            if (csv[i].length > 0) {
                const sequence = csv[i][0];
                const size = +csv[i][2];
                this.totalNumberOfQuestions += size;
                if (isNaN(size)) {
                    // e.g. if this is a header row
                    console.log(i.toString());
                    continue;
                }
                // var parts = sequence.split("-");
                const parts = sequence.split(' ');
                let currentNode = root;
                for (let j = 0; j <= parts.length; j++) {
                    const children = currentNode['children'];
                    const nodeName = parts[j];
                    let childNode;
                    if (j < parts.length) {
                        // Not yet at the end of the sequence; move down the tree.
                        let foundChild = false;
                        for (let k = 0; k < children.length; k++) {
                            if (children[k]['name'] === nodeName) {
                                childNode = children[k];
                                foundChild = true;
                                break;
                            }
                        }
                        // If we don't already have a child node for this branch, create it.
                        if (!foundChild) {
                            childNode = { name: nodeName, children: [] };
                            children.push(childNode);
                        }
                        currentNode = childNode;
                    } else {
                        // Reached the end of the sequence; create a leaf node.
                        childNode = { name: this.leafNodeText, size };
                        children.push(childNode);
                    }
                }
            }
        }
        // var tmp = JSON.stringify(buildForceJson(root));
        // var x = window.open();
        // x.document.open();
        // x.document.write(tmp);
        // x.document.close();

        return root;
    }

    // let forceJson;
    // let nodeId = 0;
    // function buildForceJson(root) {
    //     const nodeId = 0;
    //     forceJson = {
    //         'nodes': [],
    //         'links': []
    //     };
    //     recursiveBuildForceJson(root, undefined, 0);
    //     return forceJson;
    // }
    // function recursiveBuildForceJson(treeNode, parentTreeNode, level) {
    //     if (level >= 3) {
    //         return;
    //     }

    //     let category = 'root';
    //     if (parentTreeNode !== undefined) {
    //         category = parentTreeNode.description;
    //     }
    //     const node = { 'id': nodeId.toString(), 'user': category, 'description': treeNode.name };
    //     nodeId += 1;
    //     forceJson.nodes.push(node);

    //     // Link
    //     if (parentTreeNode !== undefined) {
    //         forceJson.links.push({ 'source': parentTreeNode.id, 'target': node.id });
    //     }

    //     if (treeNode.children !== undefined) {
    //         for (let i = 0; i < treeNode.children.length; i++) {
    //             const childNode = treeNode.children[i];
    //             if (childNode.name !== 'end') {
    //                 recursiveBuildForceJson(childNode, node, level + 1);
    //             }
    //         }
    //     }
    // }

    // function arcTween(a) {
    //     const i = d3.interpolate({ x: a.x0, dx: a.dx0 }, a);
    //     return function (t) {
    //         const b = i(t);
    //         a.x0 = b.x;
    //         a.dx0 = b.dx;
    //         return arc(b);
    //     };
    // }

    // function stash(d) {
    //     d.x0 = 0; // d.x;
    //     d.dx0 = 0; // d.dx;
    // }
    //     // }
}
