
var L = require('leaflet');
var $ = require('jquery');
var tj = require('./togeojson');
var numberIcon = require('./leaflet_awesome_number_markers');
var displayHelper = require('./displayHelper');

$(function(){
    // MIERUNEMAPのAPIキーはローカル環境では表示されないのでご注意(https://codeforjapan.github.io/mapprint/　でのみ表示される）
    // サーバ上の場合のみMIERUNE地図を使う
    var tileserver = ( location.host == 'codeforjapan.github.io' ) ?
    'https://tile.cdn.mierune.co.jp/styles/normal/{z}/{x}/{y}.png?key=0Y_ktb4DaMAm1ULxQudU4cFMQ5zx_Q1-PGF7DXf07WLwf5F2OpY6cr8OvJSqmQbIwTl61KCMi5Uc-GwruiSicdPyutwtvyZ_wuCEHO3GoQgrMd4k' :
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    var attribution = ( location.host == 'codeforjapan.github.io' ) ?
    "Maptiles by <a href='http://mierune.co.jp/' target='_blank'>MIERUNE</a>, under CC BY. Data by <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors, under ODbL." :
    'Map data © <a href="http://openstreetmap.org/">OpenStreetMap</a>';

    var map = L.map('map').setView([41.3921, 2.1705], 13);
    L.tileLayer(
        tileserver, {
          attribution: attribution,
          maxZoom: 18
        }
    ).addTo( map );

    $('#date').text(() => {
      const d = new Date()
      return displayHelper.getPrintDate(d);
    });

    // 説明の表示/非表示
    $('#close').on('click', function(){
        $('.explain-container').toggle()
        if ($('#close').text() == '閉じる') {
          $('#close').text('開く')
        } else {
          $('#close').text('閉じる')
        }
    });

    $.ajax('./images/water-supply.kml').done(function (data, textStatus, jqXHR) {
        // データの最終更新日を表示（ローカルでは常に現在時刻となる）
        var date = displayHelper.getNowYMD(new Date(jqXHR.getResponseHeader('date')));
        console.log(date);
        $('#datetime').html(date.toString());
        var geojsondata = tj.kml(data);

        var geojson = L.geoJson(geojsondata, {
          onEachFeature: function (feature, layer) {
            var field = '名称: '+feature.properties.name+ '<br>'+
            '詳細: '+feature.properties.description;

            layer.bindPopup(field);
          }
        });
        geojson.addTo(map);
        map.fitBounds(geojson.getBounds());
      });
    map.on("moveend", function () {
        $('#list').html('<table>');
        var index = 0;
        var targets = [];
        this.eachLayer(function(layer) {
			if(layer instanceof L.Marker)
                if( map.getBounds().contains(layer.getLatLng()) )
                    if (layer.feature === undefined) {
                        return false;
                    }else {
                        var name = layer.feature.properties.name;
                        if (name !== undefined) {
                            targets.push(layer);
                        }
                    }
				    //that._list.appendChild( that._createItem(layer) );
        });
        // アイコンの設定 https://codeforjapan.github.io/mapprint/stylesheets/leaflet_awesome_number_markers.css 内の色を使う。
        var colors = {
            'その他':'black',
            'プール':'darkpuple',
            '井戸':'purple',
            '水道水':'cadetblue',
            '洗濯':'green',
            '風呂':'red',
            'シャワー':'orange',
            '給水':'green'
        };
        // sort targets
        var matchtexts =  Object.keys(colors);
        var res = targets.sort(function(a,b){
            var _a = a.feature.properties.name;
            var _b = b.feature.properties.name;
            var _a = matchtexts.indexOf(_a.split('｜')[0]);
            var _b = matchtexts.indexOf(_b.split('｜')[0]);
            if(_a > _b){
                return -1;
            }else if(_a < _b){
                return 1;
            }
            return 0;
        });
        // display them
        var lastCategory = "";
        res.forEach(function(layer,index){
            // get name
            var name = layer.feature.properties.name;
            // get category and marker type
            var category = name.split('｜')[0];
            if (matchtexts.indexOf(category) == -1)
                category = 'その他';
            var marker = colors[name.split('｜')[0]];
            if (marker == undefined)
                marker = colors['その他'];

            if (category != lastCategory){
                // display categories
                $('#list table').append('<tr><th colspan="2" class="category"><icon class="awesome-number-marker awesome-number-marker-icon-' + marker + '"></icon>' + category + '</th></tr>');
                lastCategory = category;
                $('#list table').append('<tr>');
            }else{
                if (index % 2 == 0){
                    $('#list table').append('<tr>');
                }
            }
            $('#list table tr:last').append('<td class="id">' + (index + 1) + '</td><td class="value">' + name + '</td>');
            // add markers to map
            layer.setIcon(new L.AwesomeNumberMarkers({
                number: index + 1,
                markerColor: marker
            }));
            //$('#list').append('<tr><td class="id">' + (index + 1) + '</td><td class="value">' + name + '</td><td class="description">' + description + '</td></tr>')
        });
    });
});
