/**
 *  telewizjada plugin for Movian
 *
 *  Copyright (C) 2015 Pisek
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program. If not, see <http://www.gnu.org/licenses/>.
 *  
 */


(function(plugin) {
    var PREFIX = plugin.getDescriptor().id;
    var LOGO = plugin.path + "logo.png";
    var BACKGROUND = plugin.path + "views/img/background.jpg";
	
	var BASE_URL = "http://www.telewizjada.net";
	var BASE_ID_PREFIX = "2014tv";
	var MAX_DESC_LENGHT = 180;
    
    var blue = '6699CC', orange = 'FFA500', red = 'EE0000', green = '008B45', yellow = 'FFFF00';

    function colorStr(str, color) {
        return '<font color="' + color + '">' + str + '</font>';
    }

    function setPageHeader(page, title, image) {
        if (page.metadata) {
            page.metadata.title = title;
            page.metadata.logo = LOGO;
            if (image) {
            	page.metadata.background = image;
            	page.metadata.backgroundAlpha = 0.3;
            } else {
            	page.metadata.background = BACKGROUND;
            	page.metadata.backgroundAlpha = 0.7;
            }
        }
    }
	
	var service = plugin.createService(plugin.getDescriptor().title, PREFIX + ":start", "video", true, LOGO);
	
	var settings = plugin.createSettings(plugin.getDescriptor().title, LOGO, plugin.getDescriptor().synopsis);
	
    settings.createBool('showEpg', "Show EPG page", false,
    	function(v) {
            service.showEpg = v;
    	}
	);
	
    settings.createBool('showAdult', "Show Adult streams", false,
    	function(v) {
            service.showAdult = v;
    	}
	);
	
    settings.createBool('showCategories', "Show TV categories (TODO)", false,
    	function(v) {
            service.showCategories = v;
    	}
	);

	function d(c) {
		print(JSON.stringify(c, null, 4));
	}
		
    plugin.addURI(PREFIX + ":start", function(page) {
		setPageHeader(page, plugin.getDescriptor().title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		var c = showtime.httpReq(BASE_URL + '/get_channels.php');	
		var out = JSON.parse(c);
		//d(out);
		
		if (!service.showCategories) {
			showChannels(page, out.channels);
		} else {
			
			// TODO
			//out.categories
			
		}
		
		page.loading = false;
	});
	
	plugin.addURI(PREFIX + ":category:(.*)", function(page, category) {
		setPageHeader(page, title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		var c = showtime.httpReq(BASE_URL + '/get_channels.php');	
		var out = JSON.parse(c);
		
		showChannels(page, findElement(out.categories, 'Categoryid', category).Categorychannels);
		
		page.loading = false;
	});
	
	plugin.addURI(PREFIX + ":epg:(.*):(.*):(.*):(.*)", function(page, id, url, title, name) {
		setPageHeader(page, title);
		page.loading = true;
		
		page.type = "directory";
		page.contents = "movies";
		
		page.appendItem(PREFIX + ':tv:' + id + ':' + url + ':' + title + ':' + name, 'video', {
			title : 'Watch ' + title,
		});
		
		page.appendItem("", "separator", {
            title: 'Epg'
        });
		
		var c = showtime.httpReq(BASE_URL + '/get_epg.php', {
		    postdata: {
                'channelname': name.split(BASE_ID_PREFIX)[1]
            }
		});
		
		var epg = JSON.parse(c);
		for (e in epg) {
			
			var duration = epg[e].endtime - epg[e].starttime;
			var startTime = new Date(epg[e].starttime*1000);
			var fontColor = epg[e].attime ? green : orange;
			
			page.appendPassiveItem('video', null, {
				title : new showtime.RichText(colorStr(getTime(startTime) + ' - ' + epg[e].title, fontColor)),
				description : epg[e].description,
				duration : duration
			});
		}
		
		page.loading = false;
	});
	
    plugin.addURI(PREFIX + ":tv:(.*):(.*):(.*):(.*)", function(page, id, url, title, name) {
		setPageHeader(page, "Searching...");
		page.loading = true;
		
		var metadata = {};
        					  			 	   
		var c = showtime.httpReq(BASE_URL + '/set_cookie.php', {
		    postdata: {
                'url': url
            }
		});	
		//d(c);						   				 	     		   		 								   	   
																												   								   				 	     		   		 								   	   
        var c = showtime.httpReq(BASE_URL + '/get_channel_url.php', {
		    postdata: {
                'cid': id
            }
		});
        //d(c.toString());
        
		var videoUrl = JSON.parse(c).url;
        //d(videoUrl);
		
		var c = showtime.httpReq(BASE_URL + '/get_epg.php', {
		    postdata: {
                'channelname': name.split(BASE_ID_PREFIX)[1]
            }
		});
		var current = JSON.parse(c)[0];
		if (current) {
			title = title + " - " + current.title;
		}
		d(title);
        
		metadata.title = title;
		metadata.sources = [{ url: videoUrl, bitrate: 500 }];
		metadata.canonicalUrl = PREFIX + ":video:" + id + ':' + url + ':' + title;
		metadata.no_fs_scan = true;
		//d(metadata);
		setPageHeader(page, title);
		page.loading = false;
		page.source = "videoparams:"+showtime.JSONEncode(metadata);
		page.type = "video";
        
    });
	
	function findElement(arr, propName, propValue) {
		for (i in arr) {
			if (arr[i][propName] == propValue) {
				return arr[i];
			}
		}

	  // will return undefined if not found; you could return a default instead
	}
	
	function showChannels(page, channels) {
	
		var nextSite = service.showEpg ? 'epg' : 'tv';
		
		for (i in channels) {
			//d(channels[i]);
			
			if (channels[i].enabled && channels[i].online) {
				
				if (!service.showAdult && channels[i].isAdult) {
					continue;
				}
				
				page.appendItem(PREFIX + ':' + nextSite + ':' + channels[i].id + ':' + channels[i].url + ':' + channels[i].displayName + ':' + channels[i].name, 'video', {
					title : channels[i].displayName,
					icon : BASE_URL + channels[i].thumb,
					description : channels[i].description
				});
				
			}
			
		}
	
	}
	
	function getTime(date) {
		return date.getHours() + ':' + addZero(date.getMinutes());
	}
	
	function addZero(i) {
		if (i < 10) {
			i = "0" + i;
		}
		return i;
	}
	
})(this);
