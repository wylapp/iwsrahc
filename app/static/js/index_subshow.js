/*
 * This Javascript source code is created by WuYoulin.
 * It's mainly created for the BBD-LAB tcga gene seclet tool
 * The user interaction is very simple only using jquery framework.
 * Maybe it needs to be redo in a more modern way.
 * @Chengdong Building, 2020 december.
 */
$(document).ready(function () {
    //geneTablehadler();
    $("#pending").hide();
    //$("#showout").hide();
    $("#grouping").attr('disabled', true);
    $.toastDefaults = {
        position: 'top-center', /** top-left/top-right/top-center/bottom-left/bottom-right/bottom-center - Where the toast will show up **/
        dismissible: false, /** true/false - If you want to show the button to dismiss the toast manually **/
        stackable: true, /** true/false - If you want the toasts to be stackable **/
        pauseDelayOnHover: true, /** true/false - If you want to pause the delay of toast when hovering over the toast **/
        style: {
            toast: '', /** Classes you want to apply separated my a space to each created toast element (.toast) **/
            info: '', /** Classes you want to apply separated my a space to modify the "info" type style  **/
            success: '', /** Classes you want to apply separated my a space to modify the "success" type style  **/
            warning: '', /** Classes you want to apply separated my a space to modify the "warning" type style  **/
            error: '', /** Classes you want to apply separated my a space to modify the "error" type style  **/
        }
    };
    $.paceOptions = {
        ajax: true, // disabled
        document: true, // disabled
        eventLag: true, // disabled
    };
})
function submitfile() {
    //Upload progress bar xhr part
    var xhr = new XMLHttpRequest(); xhr.upload.onprogress = function (e) { }
    var xhrOnProgress = function (fun) {
        xhrOnProgress.onprogress = fun; //绑定监听
        //使用闭包实现监听绑
        return function () {
            //通过$.ajaxSettings.xhr();获得XMLHttpRequest对象
            var xhr = $.ajaxSettings.xhr();
            //判断监听函数是否为函数
            if (typeof xhrOnProgress.onprogress !== 'function')
                return xhr;
            //如果有监听函数并且xhr对象支持绑定时就把监听函数绑定上去
            if (xhrOnProgress.onprogress && xhr.upload) {
                xhr.upload.onprogress = xhrOnProgress.onprogress;
            }
            return xhr;
        }
    }
    // data form part
    var files = $("#fileinputbox").prop("files");
    var dataform = new FormData();
    dataform.append("file", files[0]);
    dataform.append("runtime", document.getElementById("uid").innerText);
    Pace.start();
    $.ajax({
        url: "/upload",
        type: 'POST',
        data: dataform,
        cache: false,
        contentType: false,
        processData: false,
        xhr:xhrOnProgress(function(e){
            var per=100 * e.loaded / e.total;//计算百分比
            per = per.toFixed(2);
            var son =  document.getElementById("uploadbar");
            // console.log(per);
            son.innerHTML = per + "%";
            son.style.width = per + "%";
        }),
        success: function (result) {
            Pace.stop();
            if (result.statues == 0) {
                $("#beginer").fadeOut("slow");
                $.toast({
                    type: 'success',
                    title: 'Upload successfully.',
                    content: 'Your file has been uploaded to the server successfully.',
                    delay: 5000
                });
                geneTablehadler();
            } else {
                $.toast({
                    type: 'error',
                    title: 'Fatal error happens!',
                    content: result.msg,
                    delay: 5000
                });
            };
            // console.log(result)
        }
    });
    $("#submitfiles").attr("disabled", true);
    $("#submitfiles").css("cursor","no-drop");
    $("#refreshit").show()
}
/*
 * THE FOLLOWING PART CONTROLS GENE SELECTION TABLE.
 */
function geneTablehadler() {
    let newtable = '<table id="geneselector"></table>'
    $('#pending').after(newtable);
    //Add new DOM node to the pending dialog.
    //This new table is for gene select.
    let dataform = new FormData();
    dataform.append("runtime", document.getElementById("uid").innerText);
    $("#maskOfProgressImage").show();
    $.ajax({
        url: "/getgenes",
        type: 'POST',
        data: dataform,
        cache: false,
        contentType: false,
        processData: false,
        success: function (result) {
            if (result.statues == 0) {
                geneTableCreator(result.data);
            }
            else {
                $.toast({
                    type: 'error',
                    title: 'Fatal error happens!',
                    content: result.msg,
                    delay: 5000
                });
            }
        }
    });
}
function geneTableCreator(e) {
    $('#geneselector').bootstrapTable({
        pagination: true,
        search: true,
        clickToSelect: true,
        checkboxHeader: false,
        showFullScreen: true,
        pageSize: 50,
        pageList: [25, 50, 100],
        height: 720,
        maintainMetaData: true,
        idField: "id",
        sidePagination: 'client',
        columns: [{
            field: 'selected',
            title: 'Selected',
            checkbox: true
        }, {
            field: 'id',
            title: 'Item ID'
        }, {
            field: 'name',
            title: 'Item Name'
        }],
        data: e,
    });
    $("#maskOfProgressImage").hide();
    let topbuttons = '<div id="controlPanel" class="search btn-group">\
      <button id="conFirm" class="btn btn-success btn-sm" onclick="conFirmgenes()">Confirm</button>\
      <button id="showAll" class="btn btn-primary btn-sm" onclick="geneShowAll()">Show selections</button>\
      <button id="clearAll" class="btn btn-primary btn-sm" onclick="geneClearAll()">Clear all</button>\
      </div>';
    $(".fixed-table-toolbar").prepend(topbuttons);
    //   console.log($(".fixed-table-toolbar"))
}
/**
 * This tree functions are for table control.
 */
function geneClearAll() {
    if($(".search-input")[0].value == ""){
        $("#geneselector").bootstrapTable('togglePagination').bootstrapTable('uncheckAll').bootstrapTable('togglePagination');
      }
      else{
        $.toast({
          type: 'warning',
          title: 'Clear the search box',
          content: 'To clear all selections, you need to clear the search box!',
          delay: 5000
        });
      }
}
function geneShowAll() {
    $.toast({
        type: 'info',
        title: 'Your selections',
        content: JSON.stringify($("#geneselector").bootstrapTable('getSelections')),
        delay: 5000
    });
}
function conFirmgenes() {
    let genelist = $("#geneselector").bootstrapTable('getSelections');
    if (genelist.length == 0) {
        $.toast({
            type: 'error',
            title: 'Invalid operation',
            content: 'At least one feature must be chosen!',
            delay: 5000
        });
    }
    else {
        $.toast({
            type: 'info',
            title: 'Clustering now!',
            content: 'This procedure may cost up to 30 seconds. You may have to wait for a short while.',
            delay: 5000
        });
        $("#maskOfProgressImage").show();
        let dataform = new FormData();
        dataform.append("runtime", document.getElementById("uid").innerText);
        dataform.append("genelist", JSON.stringify(genelist.map(v => v["id"])));
        $.ajax({
            url: "/pushgenes",
            type: 'POST',
            data: dataform,
            cache: false,
            contentType: false,
            processData: false,
            success: function (result) {
                if (result.statues == 0) {
                    // $('#conFirm').attr("disabled", "disabled")
                    showFigs(result.data);
                }
                else {
                    $.toast({
                        type: 'error',
                        title: 'Fatal error happens!',
                        content: result.msg,
                        delay: 5000
                    });
                }
            }
        })
    }
}

function showFigs(tt) {
    $("#maskOfProgressImage").hide();
    let figarea = '<div id="tester" style="width:100%;height:600px;"></div>'
    let downbuttons = '<div id="controlPanel2" class="clearfix">\
    <div class="col-md-7 col-xs-7 float-left">\
        <img src="static/images/plot_annotion.png" class="img-fluid" alt="Responsive image">\
    </div>\
    <div class="btn-group float-right">\
        <button id="conFirm2" class="btn btn-success btn-sm">Confirm seperations</button>\
    <button id="showAll2" class="btn btn-primary btn-sm">Show groups</button>\
    <button id="clearAll2" class="btn btn-primary btn-sm">Clear all</button>\
    </div>\
    </div>'
    if ($("#tester").exist()) {
        $("#tester").remove();
    }
    if ($("#controlPanel2").exist()) {
        $("#controlPanel2").remove();
    }
    if ($("#newKM").exist()) {
        $("#newKM").remove();
    }
    $('#workspace').append(figarea);
    TESTER = document.getElementById('tester');
    var data = [
        {
            z: [tt.score, tt.score, tt.score],
            //x: tt.names,
            y: [0, 1, 2],
            text: [tt.text, tt.text, tt.text],
            name: [tt.names, tt.names, tt.names],
            type: 'heatmap',
            hoverongaps: false,
            showscale: false,
            hovertemplate: '<b>%{text}<br>Score:%{z}</b><extra></extra>',
            colorscale: [[0, '#1fff2a'], [0.3, '#00cc0a'], [0.5, '#000000'], [0.75, '#bd002c'], [1, '#ff1f53']]
        }
    ]
    let layout1 = {
        title: "Riskscore & Lifetime Map",
        xaxis: {
            autorange: true,
            showgrid: false,
            zeroline: false,
            showline: false,
            autotick: true,
            ticks: '',
            showticklabels: false
        },
        yaxis: {
            tickmode: "array",
            // If "array", the placement of the ticks is set via `tickvals` and the tick text is `ticktext`.
            tickvals: [0, 1, 2],
            ticktext: ["Lifetime<br>(days)", "Risk<br>score", "Dendro-<br>gram"]
        },
        images: [
            {
                "source": tt.dendro,
                "xref": "x",
                "yref": "y",
                "x": -0.5,
                "y": 1.5,
                "sizex": tt.score.length,
                "sizey": 1,
                "sizing": "stretch",
                "opacity": 1,
                "xanchor": "left",
                "yanchor": "bottom",
                "layer": "top",
            }, {
                "source": tt.scatter,
                "xref": "x",
                "yref": "y",
                "x": -0.5,
                "y": -0.5,
                "sizex": tt.score.length,
                "sizey": 1,
                "sizing": "stretch",
                "opacity": 1,
                "xanchor": "left",
                "yanchor": "bottom",
                "layer": "top",
            }
        ]
    }
    Plotly.newPlot('tester', data, layout1, { modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian'] });
    $('#workspace').append(downbuttons);
    //So this is the click listener
    TESTER.on('plotly_click', function (t) {
        let pts = '';
        for (let i = 0; i < t.points.length; i++) {
            annotate_text = t.points[i].data.name[t.points[i].y][t.points[i].x] +
                '<br>Score:' + t.points[i].z.toFixed(4);
            annotation = {
                text: annotate_text,
                x: t.points[i].x,
                y: 1.5,
                alter: t.points[i].pointIndex[1]
            }
            annotations = TESTER.layout.annotations || [];
            annotations.push(annotation);
            Plotly.relayout('tester', { annotations: annotations })
        }
    })
    /**
     * Control piepline for heatmap selection
     * We don't use function this time rather than 
     * upper table control buttons.
     */
    $('#conFirm2').on('click', function () {
        try {
            let sepgrp = annotations.map(v => v["alter"])
            sepgrp = sepgrp.sort(function (a, b) { return a - b; })
            if (sepgrp.length == 0) {
                $.toast({
                    type: 'error',
                    title: 'Invalid opertion',
                    content: 'At least seperate into two groups!',
                    delay: 5000
                })
            } else {
                $("#maskOfProgressImage").show();
                let dataform = new FormData();
                dataform.append("runtime", document.getElementById("uid").innerText);
                dataform.append("boundery", JSON.stringify(sepgrp));
                $.ajax({
                    url: "/pushgroups",
                    type: 'POST',
                    data: dataform,
                    cache: false,
                    contentType: false,
                    processData: false,
                    success: function (result) {
                        if (result.statues == 0) {
                            handleNewpic(result.data);
                        }
                        else {
                            $.toast({
                                type: 'error',
                                title: 'Fatal error happens!',
                                content: result.msg,
                                delay: 5000
                            });
                        }
                    }
                })
                // alert(JSON.stringify(sepgrp))
            }

        }
        catch (e) {
            console.log(e)
            $.toast({
                type: 'error',
                title: 'Invalid opertion',
                content: 'At least seperate into two groups!',
                delay: 5000
            });
        }
    })
    $('#showAll2').on('click', function () {
        try {
            let sepgrp = annotations.map(v => v["alter"])
            sepgrp = sepgrp.sort(function (a, b) { return a - b; })
            let groupcount = sepgrp.length.toString()
            // let goupcount = (sepgrp.length - 1).toString()
            $.toast({
                type: 'info',
                title: 'Groups:',
                content: 'You\'ve made ' + groupcount + ' annotations on the heapmap. These groups are marked as group0 - group' + groupcount + ' from left to right.',
                delay: 5000
            });
        }
        catch (e) {
            console.log(e)
            $.toast({
                type: 'error',
                title: 'Invalid opertion',
                content: 'At least seperate into two groups!',
                delay: 5000
            });
        }
    })
    $('#clearAll2').on('click', function () {
        try {
            annotations = []
            Plotly.relayout('tester', { annotations: annotations })
        }
        catch (e) {
            console.log(e)
            $.toast({
                type: 'error',
                title: 'Invalid opertion',
                content: 'There\'s no sub-groups to clear yet.',
                delay: 5000
            });
        }
    })
}
async function handleNewpic(tt) {
    $("#maskOfProgressImage").hide();
    if ($('#newKM').exist()) {
        $('#newKM').attr("src", tt.KMcurve);
    }
    else {
        $('#workspace').append('<img class="img-fluid" alt="Responsive image" id="newKM"></img>');
        $('#newKM').attr("src", tt.KMcurve);
    }
}
/**
 * This is the prototype of exist funcion
 * it is regeistered to the jQuery codetree.
 */
(function ($) {
    $.fn.exist = function () {
        if ($(this).length >= 1) {
            return true;
        }
        return false;
    };
})(jQuery);