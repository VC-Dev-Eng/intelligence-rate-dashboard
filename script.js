let now = new Date()
let days30Pass = new Date()

days30Pass.setDate(days30Pass.getDate() - 29)

let days30Date = []

for(let i = days30Pass; i <= now; i.setDate(i.getDate() + 1)) {
    days30Date.push(new Date(i).toISOString().substr(0, 10))
}

let data30DaysVC = []
let data30DaysReal = []

days30Date.forEach(async (value, index, array) => {
    await fetch(`https://data.fixer.io/api/${value}?access_key=59fbf81af567c668fc4694fb20a783ba&base=NZD&symbols=IDR`)
    .then(response => response.json())
    .then(data => {
        data30DaysVC.push([new Date(value).getTime(), Math.round(data.rates.IDR - (data.rates.IDR * 0.01))])
        data30DaysReal.push([new Date(value).getTime(), data.rates.IDR])
    })
    if (index === array.length -1) {
        Highcharts.stockChart({
            chart: {
                renderTo: document.getElementById('container'),
                type: 'line',
                zoomType: 'xy',
                events: {
                    load: updateLegendLabel,
                    selection: function(e) {
                        if (this.series.length !== 2) {
                            this.series.pop()
                        }
                        this.series.forEach(function (series) {
                            if (series.checkbox.checked === true) {
                                series.points.forEach(function (point) {
                                    if (point.x >= e.xAxis[0].min && point.x <= e.xAxis[0].max &&
                                        point.y >= e.yAxis[0].min && point.y <= e.yAxis[0].max) {
                                        point.select(true, true)
                                    }
                                })
                            }
                        })
                        return false
                    }
                }
            },
            title: {
                text: 'VC Intelligence Dashboard'
            },
            plotOptions: {
                line: {
                    cursor: 'pointer',
                    allowPointSelect: true,
                    marker: {
                        enabled: true
                    }
                },
                series: {
                    type: 'line',
                    cursor: 'pointer',
                    showCheckbox: true,
                    allowPointSelect: true,
                    selected: true,
                    marker: {
                        enabled: true,
                        radius: 0.1,
                        states: {
                            hover: {
                                radius: 5
                            },
                            select: {
                                radius: 5
                            }
                        }
                    },
                    point: {
                        events: {
                            select: function () {
                                let text = 'Average: ' + this.y,
                                    chart = this.series.chart;
                                    selectedPoints = chart.getSelectedPoints()
                                    avg = []
                                for (let i = 0; i < selectedPoints.length; i++) {
                                    avg.push(selectedPoints[i].y)
                                }
                                if (!chart.lbl) {
                                    chart.lbl = chart.renderer.label(text, 100, 70)
                                        .attr({
                                            padding: 10,
                                            r: 5,
                                            fill: Highcharts.getOptions().colors[1],
                                            zIndex: 5,
                                        })
                                        .css({
                                            color: '#FFFFFF'
                                        })
                                        .add()
                                } else {
                                    chart.lbl.attr({
                                        fill: Highcharts.getOptions().colors[1],
                                        text: 'Average: ' + avg.reduce((a,b) => a + b) / avg.length
                                    })
                                }
                            },
                            unselect: function () {
                                let text = 'Average: ' + this.y,
                                    chart = this.series.chart,
                                    selectedPoints = chart.getSelectedPoints(),
                                    avg = []
    
                                for (let i = 0; i < selectedPoints.length; i++) {
                                    avg.push(selectedPoints[i].y)
                                }
    
                                if (avg.length > 0) {
                                    chart.lbl.attr({
                                        text: 'Average: ' + avg.reduce((a,b) => a + b) / avg.length
                                    })
                                } else {
                                    chart.lbl.attr({
                                        fill: 'rgba(0, 0, 0, 0)',
                                        text: ''
                                    })
                                }
                            }
                        }
                    }
                }
            },
            yAxis: {
                title: {
                    text: 'Rates'
                }
            },
            xAxis: {
                type: "datetime",
                title: {
                    text: 'Date'
                },
                labels: {
                    formatter: function() {
                        return Highcharts.dateFormat('%b/%e/%Y', this.value);
                    }
                },
                events: {
                    afterSetExtremes: updateLegendLabel
                }
            },
            rangeSelector: {
                buttons: [
                    {
                        type: 'day',
                        count: 29,
                        text: '1m',
                        title: 'View 1 month'
                    }, 
                    {
                        type: 'day',
                        count: 6,
                        text: '1w',
                        title: 'View 1 week'
                    }
                ],
            },
            navigator: {
                series:[{
                    marker: {
                        enabled: true
                    },
                    threshold: 0,
                    area: 'line'
                }]
            },
            stockTools: {
                gui: {
                    enabled: true
                }
            },
            series: [
                {
                    name: 'VC Rate',
                    data: data30DaysVC,
                    findNearestPointBy: 'xy',
                    allowPointSelect: true,
                    showInLegend: true
                },
                {
                    name: 'Real Rate',
                    data: data30DaysReal,
                    findNearestPointBy: 'xy',
                    allowPointSelect: true,
                    showInLegend: true,
                }
            ],
            legend: {
                enabled: true,
                align: 'right',
                verticalAlign: 'middle',
                layout: 'vertical',
            },
        })
    }
})

function updateLegendLabel() {
    let chrt = !this.chart ? this : this.chart;
    chrt.update({
        legend: {
            labelFormatter: function() {
                let lastVal = this.yData[this.yData.length - 1],
                    chart = this.chart,
                    xAxis = this.xAxis,
                    points = this.points,
                    avg = 0,
                    counter = 0,
                    min, minPoint, max, maxPoint;

                points.forEach(function(point, inx) {
                    if (point.isInside) {
                        if (!min || min > point.y) {
                        min = point.y;
                        minPoint = point;
                        }

                        if (!max || max < point.y) {
                        max = point.y;
                        maxPoint = point;
                        }

                        counter++;
                        avg += point.y;
                    }
                });
                avg /= counter;

                return `
                    ${this.name}<br>
                    <span style="color: red">Min: ${min} IDR</span><br/>
                    <span style="color: red">Max: ${max} IDR</span><br/>
                    <span style="color: red">Average: ${avg} IDR</span><br/>
                `
            }
        }
    })
}