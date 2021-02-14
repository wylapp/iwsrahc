/**
 * This Javascript is modified based on the original
 * index_subshow.js specially for dataset choice
 * cascade selector and pending pipeline for time-
 * spending tasks.
 * Author: Yl.W. 2021, @NZH-Hulunbuir
 */

// window.onbeforeunload = function(event) {
//     return confirm("Are you sure you want to close this tab?");
// }
// This tip-before-close may not working well because this is not a
// standard API, but there's no better implyment.
$(document).ready(function () {
  $.paceOptions = {
    ajax: true, // disabled
    document: true, // disabled
    eventLag: true, // disabled
  };
  $('#typeconfirm').attr('disabled', true);
  $.getJSON('/cancers', function (data) {
    cancertypeInit(data);
  })
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
  materialInit([]);
  $("#cancertype").on("select2:select", function (e) {
    $('#typeconfirm').attr('disabled', true);
    let data = e.params.data;
    //console.log(data);
    materialInit(genOptions(data.type))
    $('#material').val(null).trigger("change")
  })
  $("#material").on("select2:open", function (e) {
    if (!$('#cancertype').val()) {
      $.snack(
        'error',
        'You should select cancer type first!',
        5000
      )//snack(type, title, timedelay)
      $("#material").select2("close"); // close dropdown
    }
  })
  $('#material').on("select2:select", function (t) {
    $('#typeconfirm').attr('disabled', false);
    //console.log(t.params.data)
  })
  $("#typeconfirm").on("click", function () {
    if (!$('#cancertype').val() || !$('#material').val()) {
      $.snack(
        'error',
        'You should select cancer type and material!',
        5000
      )
    }
    else {
      $.ajax({
        url: '/cancers',
        method: 'post',
        dataType: 'json',
        contentType: 'application/json;charset=utf-8',
        data: JSON.stringify({
          //"uid": $('#runtime').val(),
          "cancer": $('#cancertype').find(':selected').text(),
          "material": $('#material').find(':selected').text()
        }),
        success: function (t) {
          $("#beginer").hide();
          geneTablehadler(t);
        }
      })
    }
  })
});

function genOptions(dataList) {
  newOplist = []
  for (let i = 0; i < dataList.length; i++) {
    newOplist.push({
      id: i,
      text: dataList[i]
    })
  }
  return newOplist;
}
function cancertypeInit(d) {
  $("#cancertype").empty().select2({
    placeholder: "---Your selection---",
    allowClear: true,
    width: "100%",
    templateResult: formatState,
    data: d
  });
  $('#cancertype').val(null).trigger("change")
}
function materialInit(dataList) {
  $("#material").empty().select2({
    placeholder: "---Your selection---",
    allowClear: true,
    width: "100%",
    data: dataList,
    minimumResultsForSearch: -1
  });
}
function formatState(state) {
  /**
   * This part is for formating disabled and available
   * options in the Cancertype selectbox.
   */
  if (!state.id) {
    return state.text;
  }
  let $state = $(
    '<span>' + state.text + '<p style="margin:0 auto;" class="text-muted">' + state.name + '</p>' + '</span>'
  );
  if (state.disabled == true) {
    $state = $(
      '<span>' + state.text + '<font color="red"> (Not Available)</font>' +
      '<p style="margin:0 auto;" class="text-muted">' + state.name + '</p></span>'
    );
  }
  return $state;
}
// following scripts controls all workflow.
function geneTablehadler(r) {
  let newtable = '<table id="geneselector"></table>'
  $('#worker').append(newtable);
  //Add new DOM node to the pending dialog.
  //This new table is for gene select.
  geneTableCreator(r.data);
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
    //alert(JSON.stringify(genelist.map(v => v["id"])));
    $("#maskOfProgressImage").show();
    let dataform = new FormData();
    dataform.append("runtime", document.getElementById("uid").innerText);
    dataform.append("genelist", JSON.stringify(genelist.map(v => v["id"])));
    dataform.append("cancer", $('#cancertype').find(':selected').text());
    dataform.append("material", $('#material').find(':selected').text());
    // $('#conFirm').attr("disabled", "disabled");
    $.toast({
      type: 'info',
      title: 'Clustering now!',
      content: 'This procedure may cost up to 30 seconds. You may have to wait for a short while.',
      delay: 5000
    });
    $.ajax({
      url: "/pushgenes2",
      type: 'POST',
      data: dataform,
      cache: false,
      contentType: false,
      processData: false,
      success: function (result) {
        Pace.stop();
        if (result.statues == 0) {
          $('#conFirm').attr("disabled", false)
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
  $('#worker').append(figarea);
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
  Plotly.newPlot('tester', data, layout1,{modeBarButtonsToRemove: ['hoverClosestCartesian', 'hoverCompareCartesian']});
  $("#maskOfProgressImage").hide();
  $('#worker').append(downbuttons);
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
    $('#worker').append('<img class="img-fluid" alt="Responsive image" id="newKM"></img>');
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